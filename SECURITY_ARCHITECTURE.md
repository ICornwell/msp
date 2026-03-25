# Mighty-Small-Platform — Security Architecture

_Version 0.1 — working design paper, March 2026_

---

## 1. Purpose & Scope

This document describes the planned security architecture for the
Mighty-Small-Platform (MSP): a module-federated, micro-service platform
designed to host third-party "Custom Modules" (UI, Service and Data layers)
within a tightly governed, zero-trust environment.

The security model must satisfy the following non-negotiable properties:

- **Custom module code never directly touches production data** — all data
  access is mediated by platform-operated services under enforceable policy.
- **All access decisions are auditable** — every allow or deny is recorded
  with the full evidence chain used to reach it.
- **The platform operator has continuous, queryable visibility** — a control
  panel can answer, for any resource, who could access it, under what
  circumstances, and with what minimisation applied.
- **Custom module authors cannot escalate their own privilege** — signing,
  admission review and manifest governance are enforced by the platform, not
  the module author.

Target compliance frameworks: NIST SP 800-207 (Zero Trust Architecture),
NIST SP 800-162 / 162 rev 1 (ABAC), NIST SP 800-204B (ABAC for
microservices), NIST SP 800-53 rev 5 (controls catalogue — particularly
AC-*, AU-*, SC-*, SI-* families), and GDPR Articles 5, 25, 35 (data
minimisation, privacy by design, DPIA).

---

## 2. Platform Component Inventory

### 2.1 Platform-Operated Services (trusted tier)

| Component | Role |
|---|---|
| **FES** (Frontend Entry Service) | Vite/React host; serves the UI shell; owns the browser-facing BFF |
| **ServiceHub** | Central policy enforcement point (PEP) and request router; the sole data egress boundary |
| **DataHub** | Sits between Custom Service Modules and Custom Data Modules; applies data minimisation and redaction policies |
| **msp_semaphors** | Distributed coordination and rate-limiting primitives |
| **msp_common** | Shared type system, message contracts, manifest definitions |
| **Platform Graph DB** | Stores actors, work, participations, policies, audit events as a graph |

### 2.2 Custom Module types (untrusted tier — installed by platform operators)

| Type | Runs in | DSL / Code form |
|---|---|---|
| **Custom UI Module** | Browser (MF remote, loaded by FES) | React components + UI configuration DSL |
| **Custom Service Module** | Node (MF remote, loaded by ServiceHub) | `/api/v1` service API + activity manifest |
| **Custom Data Module** | Node (MF remote, loaded by DataHub) | Data access layer + redaction policy DSL |

### 2.3 Platform Entry Points

| BFF | Inbound from | Forwards to |
|---|---|---|
| **UI BFF** | Browser (DMZ) | ServiceHub |
| **API BFF** | External API consumers | ServiceHub |
| **Agent BFF** | AI agent orchestration | ServiceHub |

---

## 3. Network Segmentation (Kubernetes)

Micro-segmentation is enforced via Kubernetes NetworkPolicy objects.
The principle: **no implicit connectivity exists; all allowed paths are
explicitly declared**.

```
Internet
   │
   ▼
[ DMZ ingress ]
   │
   ├──► UI BFF      ─────────────────────────────┐
   │                                             │
   ├──► API BFF     ─────────────────────────────┤
   │                                             │
   └──► Agent BFF   ─────────────────────────────┤
                                                 ▼
                                        [ ServiceHub ]
                                          │       │
                              ┌───────────┘       └──────────────┐
                              ▼                                   ▼
                     [ Custom Service          [ DataHub ]
                       Modules ]                  │
                              │                   ▼
                              └──────► [ Custom Data Modules ]
```

**ServiceHub allowed inbound:** UI BFF, API BFF, Agent BFF, itself
(service-to-service via manifest routing), DataHub alerts/events,
platform monitoring systems.

**All other inbound to ServiceHub:** denied at NetworkPolicy level.

**Custom Modules:** no direct inbound from any external source; no direct
outbound except back through ServiceHub via declared manifest routes.
They cannot call each other directly — all inter-module calls are
mediated by ServiceHub.

**DataHub:** inbound only from ServiceHub; outbound only to Custom Data
Modules. Returns results (with minimisation applied) back to ServiceHub,
never directly to the caller.

---

## 4. Identity & Token Model

Every request in the system carries a token. There is no anonymous
internal path.

### 4.1 Token types

| Token | Issued by | Carries |
|---|---|---|
| **User token** | IdP (MSAL/Azure AD or platform IdP) | Actor identity, claims |
| **Service token** | Platform internal CA | Service identity |
| **Agent token** | Agent BFF on behalf of an Actor+Work context | Scoped actor+work+participation set |
| **Context assertion token** | Signed context authority (time server, geo service, etc.) | CBAC context claims |

All tokens are short-lived. ServiceHub validates every token on every
request — there is no session-level caching of authorisation decisions.

### 4.2 Token lifetime & continuous evaluation

Consistent with NIST SP 800-207 §3.3 (continuous verification): the absence
of a valid token on any individual request is an immediate deny, regardless of
the state of any prior request from the same actor in the same session.

---

## 5. Access Control Model

### 5.1 Layered control architecture

```
CBAC  (Context-Based)     ← signed time, geo, custom context authorities
  │
  └─ ABAC  (Attribute-Based)  ← actor type, work attributes, data classification
       │
       └─ ReBAC  (Relationship-Based)  ← Actor → Participation → Work → Resource
```

All three layers must allow for a request to proceed. Any layer returning
deny terminates evaluation with no further processing.

### 5.2 Core domain entities

**Actor** — any agent in the system (human user, service account, external
system, AI agent). Actors have a type and a set of attributes.

**Work** — the unit of purposeful activity. Every data access must be
associated with a Work instance. Work has a type, status, and attributes
(including data classification tags that constrain which data can be accessed
under it).

**Participation** — the relationship between an Actor and a Work.
Participation has a type (e.g. `assignee`, `reviewer`, `supervisor`,
`auditor`) and is the primary relationship edge traversed by the policy engine.
Access rights derive from Participation type, not from Actor type directly.

**Resource** — any service endpoint, data entity, or processing capability
declared in a module manifest. Resources carry classification attributes that
are matched against Work and Participation attributes by the PDP.

### 5.3 Policy evaluation sequence (PDP)

For each request arriving at ServiceHub:

1. **Identify Actor** from token — extract claims, resolve Actor node in graph
2. **Resolve Work context** from request — from token scope or explicit request parameter
3. **Traverse Participation graph** — Actor → Participation(s) → Work → Resource
4. **Evaluate ABAC policies** — attribute match against Actor type × Work attributes × Resource classification
5. **Evaluate CBAC assertions** — validate signed context authority tokens against configured policy conditions
6. **Manifest check** — confirm the requested service/activity is declared in a currently-active, signed manifest
7. **Allow / Deny** — default is always DENY; explicit allow required from a matching policy at every layer
8. **Write audit event** — regardless of outcome, write structured audit node to graph

### 5.4 Data access: DataHub mediation

When a Custom Service Module's handler calls a Custom Data Module:

1. The call passes from Custom Service Module → ServiceHub → DataHub
2. DataHub resolves the applicable **minimisation policy** (from the signed,
   admitted policy DSL associated with the requesting module + work context)
3. DataHub resolves the applicable **redaction policy**
4. DataHub executes the data request against the Custom Data Module
5. DataHub applies minimisation and redaction to the result
6. The minimised/redacted result is returned via ServiceHub to the caller

**The Custom Service Module never receives un-minimised data.** The Custom
Data Module never receives policy instructions from the Custom Service Module —
it only receives the data query. All policy application is in DataHub.

---

## 6. Module Admission & Signing

### 6.1 Release gate (automated)

Any Custom Module submitted for admission is subjected to automated static
analysis before a human reviewer is involved:

- **DSL schema validation** — manifest and DSL config blocks must conform to
  platform-defined schemas; non-conformance is a hard reject
- **Dependency allow-list check** — all declared dependencies are checked against
  the platform allow-list; any unlisted dependency blocks admission
- **AST-level role-appropriateness scan**:
  - Data/redaction policy DSL: network call patterns, `process.env` reads,
    `eval` usage, dynamic `require`/`import` — all forbidden
  - Access policy DSL: same, plus any conditional logic that could produce
    non-boolean results
  - UI components: `fetch` / `XMLHttpRequest` to any origin not in the
    platform's declared BFF list — flagged
- **Manifest cross-reference** — declared activities must match what the
  container actually exposes; mismatches are rejected
- **Bundle integrity hash** — SHA-256 of the release artifact is recorded

If automated checks pass, a **work item** is created for an appropriate
security/platform reviewer to:

- Verify the release procedure and provenance
- Review the manifest intent
- Authorise — which signs the manifest with the platform's signing key

### 6.2 Signing

Only signed manifests are admitted. The signature covers:
- The manifest content (activities, dependencies, policy DSL references)
- The bundle artifact hash
- The signing actor's identity and the timestamp

At load time, ServiceHub verifies the signature against the platform's
public key before the module is permitted to register. An unsigned or
tampered manifest results in an immediate load failure and an alert.

### 6.3 Version & supersession

When a new version of a module is admitted, the previous version's manifest
node is linked with a `-[supersededBy]→` edge in the graph. Old versions
remain queryable for audit purposes. Rollback to a previous signed version
is possible without re-review (the prior signature is still valid) subject
to operator policy.

---

## 7. Audit Model

### 7.1 Audit event structure

Every PDP evaluation — allow or deny — produces a structured audit node
written to the Platform Graph DB:

```
AuditEvent {
  id, timestamp, outcome (allow|deny),
  requestId, correlationId
}
  -[forActor]→       Actor node
  -[onResource]→     Resource node
  -[inWorkContext]→  Work node
  -[viaParticipation]→ Participation node
  -[usedPolicy]→     Policy node (version-pinned)
  -[withEvidence]→   Evidence { attributes evaluated, context assertions used }
  -[appliedMinimisation]→ MinimisationPolicy node (on allow + data response)
  -[appliedRedaction]→    RedactionPolicy node (on allow + data response)
```

### 7.2 Non-repudiation

Audit events are append-only. The graph schema does not permit mutation of
admitted audit event nodes. The graph DB partition holding audit events is
accessible only to the platform's own audit writer service account.

### 7.3 DPIA / regulatory queries

Because audit events link directly to the policy nodes they used, a
point-in-time access report for any resource is a graph traversal, not a
multi-table join:

> "All AuditEvent nodes that point to Resource[R], in period [T1, T2],
>  with their Actor, Policy, and MinimisationPolicy nodes"

This satisfies the data access reporting requirement for GDPR Article 35 DPIA
and regulator audit.

### 7.4 Volume management

Audit events are a high-volume time-series append. The primary policy/actor/
work/resource graph topology is kept separate from audit event volume:

- Audit event nodes are written to a dedicated partition/store
- Only the *edges* back into the policy graph are retained in the primary graph
- Archive policy (e.g. retention period, cold storage migration) is configured
  per deployment without touching application code

---

## 8. Policy Introspection (Control Panel)

The platform's security control panel provides:

### 8.1 Forward query — "who can access R?"

> For Resource[R], enumerate all Actor types × Participation types × Work
> types that contain a policy path leading to allow, and state what
> minimisation/redaction would be applied.

Implemented as a graph traversal: `Resource ← Policy ← Participation type
← Work type ← Actor type`, with each hops's conditions projected as a
human-readable rule summary.

### 8.2 Reverse query — "what can Actor A access?"

> For Actor[A] in Work[W] with Participation[P], enumerate all Resources
> accessible, and with what minimisation.

Same graph, opposite traversal direction.

### 8.3 Historic access report

> All resources accessed by Actor[A] in period [T1, T2], via which policies.

Graph query over audit event nodes with time constraint.

### 8.4 Policy change impact analysis

> If Policy[P] is changed, which Actor × Resource paths are affected?

Graph query: all Actors with a reachable path to any Resource whose allow
evaluation uses Policy[P].

---

## 9. Context-Based Access Control (CBAC)

Context assertions are provided by **signed context authorities** — external
or platform-internal services that issue short-lived, signed tokens asserting
a specific context fact:

| Authority type | Asserts | Example use |
|---|---|---|
| Signed time server | Current time is within range R | "Access only during business hours" |
| Geo-location service | Request originates from jurisdiction J | "EU data subjects only accessible from EU nodes" |
| Custom context authority | Any signed domain-specific fact | "On-call rotation is active", "Incident declared" |

Context authorities are **registered in the Platform Graph DB** and must
themselves be admitted via the signing/approval flow. A context assertion
from an unregistered authority is treated as absent, not as a deny trigger —
the absence of a required assertion causes a deny at the CBAC layer.

---

## 10. Phased Build-Out

### Phase 1 — Foundation (current state / near term)

- [x] Module Federation Vite plugin with shared scope (singleton correctness)
- [x] ServiceHub routing from manifest-declared activities
- [x] Actor-based token propagation (MSAL)
- [ ] Manifest signing infrastructure (platform signing key, admission flow)
- [ ] Dependency allow-list gate (automated release check)
- [ ] Basic ReBAC: Actor → Participation → Work resolution in ServiceHub

### Phase 2 — Policy enforcement

- [ ] PDP implementation in ServiceHub (ReBAC + ABAC layers)
- [ ] Structured audit event writer (graph DB)
- [ ] DataHub minimisation/redaction pipeline
- [ ] DSL admission static analysis (AST scanner)
- [ ] Control panel: forward/reverse access queries

### Phase 3 — CBAC & full compliance

- [ ] Signed context authority framework
- [ ] CBAC layer in PDP
- [ ] Policy introspection: impact analysis, historic reports
- [ ] DPIA report generation
- [ ] Full NIST SP 800-207 mapping documentation

### Phase 4 — MF-Node & server-side DSL

- [ ] module-federation-node integration for server-side Custom Module loading
- [ ] vm.Context sandboxing for server-side DSL policy execution
- [ ] Native Neon addon sharing (fixed-point maths, etc.) via MF shared scope

---

## 11. NIST Control Mapping Summary

| NIST Publication | Relevant sections | Platform mechanism |
|---|---|---|
| SP 800-207 | §3 ZTA tenets, §3.3 continuous verification | Per-request token validation; no cached authz decisions |
| SP 800-207 | §4.2 enhanced identity governance | Actor graph; Participation-derived rights |
| SP 800-162 rev 1 | ABAC policy model | Attribute evaluation layer in PDP |
| SP 800-204B | ABAC for microservices | ServiceHub as PEP; graph DB as PAP |
| SP 800-53 rev 5 | AC-2, AC-3, AC-4, AC-6, AC-17, AC-24 | Participation-based access; least privilege via Work context |
| SP 800-53 rev 5 | AU-2, AU-9, AU-12 | Structured audit events; append-only; actor/policy linkage |
| SP 800-53 rev 5 | SC-7, SC-8 | K8s NetworkPolicy micro-segmentation; TLS everywhere |
| SP 800-53 rev 5 | SI-7 | Manifest signing; bundle hash verification at load time |
| GDPR Art. 5, 25 | Data minimisation, privacy by design | DataHub redaction/minimisation pipeline |
| GDPR Art. 35 | DPIA | Graph-queryable audit + policy history |

---

_This is a living design document. Update as phases complete and as design
decisions are confirmed in implementation._
