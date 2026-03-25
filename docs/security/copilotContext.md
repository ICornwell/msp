# Copilot Working Context — MSP Security Architecture

Restore this context when working on any security, access control, policy,
audit, or module admission aspect of the Mighty-Small-Platform.

---

## What this platform is

MSP is a module-federated, micro-service platform that allows third-party
**Custom Modules** (UI, Service, Data layers) to run inside a platform
operated by a governed entity. The platform owner is responsible for what
runs on it. Custom module authors must not be able to exfiltrate data,
escalate privilege, or bypass governance — even with full control of their
own module's source code.

All security reasoning flows from this constraint.

---

## The three trust tiers

```
[ Platform services ]  — trusted; hold signing keys; own enforcement points
       │
[ Custom Modules ]     — installed, signed, admitted; never directly trusted
       │
[ Data ]               — never directly accessible to Custom Modules;
                         always mediated by DataHub with policy applied
```

---

## Network topology (K8s micro-segmentation)

```
Internet
  │
  ▼
[ DMZ ]
  ├─ UI BFF   ──┐
  ├─ API BFF  ──┤──►  [ ServiceHub ]  ──►  [ Custom Service Modules ]
  └─ Agent BFF─┘           │                        │
                            │                        ▼ (via ServiceHub)
                            └──────────►  [ DataHub ]  ──►  [ Custom Data Modules ]
```

- ServiceHub: sole internal egress chokepoint. All inter-module calls route
  through it. No direct module-to-module paths exist.
- Custom Modules: inbound only from ServiceHub; no direct external inbound;
  no direct outbound except back through ServiceHub via manifest-declared routes.
- DataHub: receives requests from ServiceHub; applies minimisation + redaction;
  calls Custom Data Modules; returns minimised results to ServiceHub.

**Default NetworkPolicy stance: deny all. Every allowed path is explicit.**

---

## Access control model (three stacked layers)

```
CBAC  ← signed context authority tokens (time, geo, custom domain facts)
  └─ ABAC  ← actor type × work attributes × resource classification
       └─ ReBAC  ← Actor → Participation → Work → Resource graph traversal
```

All three must allow. Default answer is always DENY.

### Core domain entities

**Actor** — human, service account, AI agent. Has type + attributes.

**Work** — unit of purposeful activity. Every data access is associated with
a Work. Carries data classification attributes that constrain accessible data.

**Participation** — the relationship between an Actor and a Work.
Access rights derive from Participation *type*, not Actor type.
This is the primary ReBAC edge.

**Resource** — any activity, endpoint, or data entity declared in a module
manifest. Carries classification attributes matched by PDP.

**Policy** — a signed, versioned graph node. PDP evaluates policies;
policies are never mutated (new version = new node + supersededBy edge).

### PDP evaluation sequence (on every ServiceHub request)

1. Identify Actor from token
2. Resolve Work context
3. Traverse Actor → Participation → Work → Resource
4. Evaluate ABAC (attribute match)
5. Evaluate CBAC (signed context assertions)
6. Manifest check (activity declared in active signed manifest)
7. Allow or Deny (always write audit event either way)

---

## Module admission & signing

Custom Modules cannot run unless their manifest is **signed by the platform**.

Automated gate (fail = hard reject):
- DSL schema validation
- Dependency allow-list check
- AST scan: network calls / eval / process.env in policy DSL blocks
- Manifest ↔ container cross-reference

On automated pass → work item created for human reviewer → reviewer signs.

At load time ServiceHub verifies signature against platform public key.
Unsigned or tampered = load failure + alert.

**Critical:** build systems and dev teams must not have production data access.
This is what makes build-time data embedding impossible without being obvious.

---

## DataHub's role (data minimisation boundary)

Custom Service Modules never receive un-minimised data.

Flow: Custom Service Module → ServiceHub → DataHub → Custom Data Module
                                              │ applies minimisation policy
                                              │ applies redaction policy
                                        result back via ServiceHub

Minimisation and redaction DSLs are admitted as part of the Custom Module
manifest (signed). DataHub executes them; Custom Service Module never touches
raw data.

---

## Audit model

Every PDP evaluation (allow OR deny) writes a structured audit event to the
Platform Graph DB:

```
AuditEvent
  -[forActor]→          Actor
  -[onResource]→        Resource
  -[inWorkContext]→     Work
  -[viaParticipation]→  Participation
  -[usedPolicy]→        Policy (version-pinned)
  -[withEvidence]→      { attributes, context assertions }
  -[appliedMinimisation]→ MinimisationPolicy
  -[appliedRedaction]→    RedactionPolicy
```

Append-only. Platform audit writer service account only. No mutation.

Volume management: audit event nodes in a dedicated partition. Only edges
back into the policy graph are in the primary graph topology.

---

## Platform Graph DB

The native data backend is a graph DB. It stores:
- Actor, Work, Participation, Resource, Policy nodes (platform state)
- Module manifest nodes (with supersededBy versioning edges)
- Audit event nodes (write-once, partitioned separately from topology)

Policy introspection is graph traversal in the opposite direction to PDP:
`Resource ← Policy ← Participation type ← Work type ← Actor type`
gives "who can access R and what minimisation applies" without simulation.

---

## CBAC context authorities

Signed context facts from registered authorities:
- Time server: "current time is in range R"
- Geo service: "request is from jurisdiction J"
- Custom: any domain-specific signed assertion

Context authorities are themselves admitted via the signing/approval flow.
An assertion from an unregistered authority is treated as absent (→ deny
if the policy requires it).

---

## Phased build-out (as of March 2026)

**Phase 1 (in progress):**
- MF Vite plugin with correct shared scope (singleton fix: done)
- ServiceHub manifest-based routing (working)
- MSAL actor token propagation (working)
- Manifest signing infrastructure (not yet started)
- Basic ReBAC in ServiceHub (not yet started)

**Phase 2:** PDP, structured audit, DataHub pipeline, DSL admission AST scanner

**Phase 3:** CBAC, full policy introspection, DPIA reports

**Phase 4:** MF-Node for server-side modules, vm.Context DSL sandboxing,
Neon (Rust) addon sharing via MF shared scope

---

## NIST targets

- **SP 800-207** — Zero Trust Architecture (primary)
- **SP 800-162 rev 1** — ABAC
- **SP 800-204B** — ABAC for microservices (ServiceHub-as-PEP pattern)
- **SP 800-53 rev 5** — AC-*, AU-*, SC-7/8, SI-7 families
- **GDPR** Art. 5, 25, 35 — minimisation, privacy by design, DPIA

---

## Key design principles (do not compromise)

1. Default deny everywhere — no policy = no access
2. ServiceHub is the sole data egress chokepoint — nothing bypasses it
3. DataHub owns all minimisation/redaction — Custom Service Modules never
   touch raw data
4. Every authz decision is audited with full evidence chain
5. Manifests are signed by the platform, not the module author
6. All tokens are short-lived; no cached authz decisions
7. Custom Modules call each other only through ServiceHub (manifest routes)
8. The policy graph and the audit graph are the same structure viewed from
   different directions — keep them consistent
