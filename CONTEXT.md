# MSP — Platform Context & Documentation Index

_April 2026. Top-level orientation for developers, platform users, and LLM/Copilot sessions._

---

## What MSP Is

**Mighty-Small-Platform (MSP)** is a module-federated, micro-service platform
designed to host third-party "Custom Modules" — UI, Service, and Data layers —
inside a tightly governed runtime operated by a platform owner.

The platform's defining properties:

- **Custom Module code never directly touches production data.** All data access
  is mediated by platform-operated services under enforceable, signed policy.
- **All access decisions are auditable.** Every allow/deny is recorded with the
  full evidence chain used to reach it, in an immutable graph structure.
- **Continuous evaluation.** No cached authorisation decisions. Policy is applied
  per-request against the live state of the graph.
- **Runtime is composed from independently deployed modules.** Module Federation
  (Vite) is the delivery mechanism for both UI remotes and server-side Service
  Activity modules.
- **Behaviour-first UI model.** In-browser UI logic is expressed as a typed,
  fluent DSL that compiles to wiring rules — not imperative component code.

---

## Four Priority Use Cases

The sections below describe the four main areas of ongoing and planned work,
with pointers to the relevant documentation files for each.

---

## Use Case 1 — General Application Platform

**Focus:** UI generation, component composition, UX capabilities, and the
dynamic discovery mechanism that allows feature modules to self-register into
a host application at runtime.

### Core ideas

- The **FES** (Frontend Entry Service) is a Vite/React MF host that discovers
  UI features from Service modules via a pull-based discovery API.
- Discovered features are registered as MF remotes at runtime — no compile-time
  knowledge of what runs on the platform.
- UI logic is authored using the **Fluent Behaviour DSL**: a `When → Then` rule
  model that wires UIEvents to subsystem actions (activity calls, menu mutations,
  blade/tab navigation, data cache operations) without writing imperative event
  handlers in component code.
- Namespace isolation via remote-prefixed event/menu/blade IDs prevents
  collisions when multiple feature modules are loaded simultaneously.
- `msp_ui_common` provides the shared UI component library, provider tree,
  and Behaviour runtime; `msp_fes` is the host application.

### Key documentation

| File | What it covers |
|---|---|
| [ARCHITECTURE.md](ARCHITECTURE.md) | System topology, discovery flow, MF setup, namespace prefixing, Fluent DSL surface overview |
| [END_TO_END_FLOW.md](END_TO_END_FLOW.md) | Complete worked example: UserChanged event → service call → data load → menu item → blade open |
| [QUICK_START.md](QUICK_START.md) | How to start all services; curl test; current implementation status |
| [msp_ui_common/src/uiLib/copilotContext.md](msp_ui_common/src/uiLib/copilotContext.md) | **Primary UILib reference.** The four communication patterns (UIEvent / Dispatch / Private context / localEffect), provider tree order, subsystem provider contracts, common mistakes |
| [msp_ui_common/src/uiLib/behaviours/FluentBehaviours.md](msp_ui_common/src/uiLib/behaviours/FluentBehaviours.md) | Full DSL surface, `ActivityCallDefinition`, runtime execution in `Behaviour.ts`, chaining rules |
| [module-federation-vite/README.md](module-federation-vite/README.md) | MF Vite plugin public API and getting-started examples |
| [module-federation-vite/src/esmExportEnumerator/copilotContext.md](module-federation-vite/src/esmExportEnumerator/copilotContext.md) | MF plugin internals: ESM export enumeration, three-layer manifest pipeline, factory file pattern, known CJS interop constraints |
| [module-federation-vite/src/esmExportEnumerator/usage.md](module-federation-vite/src/esmExportEnumerator/usage.md) | CLI usage for auditing and updating the shared-ESM registry |

### What exists vs. what is planned

| Capability | Status |
|---|---|
| Pull-based feature discovery | Working |
| Dynamic MF remote registration at runtime | Working |
| Fluent Behaviour DSL (full surface) | Working |
| Shared singleton deps (React, MUI, MSAL) across host + remotes | Working (fixes documented in user memory) |
| Blade / tab / navigation subsystem | Partial |
| UI generation / AI-assisted layout composition | Not started |
| Platform-level design system and theming | Not started |

---

## Use Case 2 — Compute for a Data Platform

**Focus:** The Service Activity model, ServiceHub as orchestration chokepoint,
inter-service coordination, version lifecycle management, and the support
infrastructure for wide, automated processing pipelines.

### Core ideas

- **Service Activities** are the unit of work. Each one is named
  `namespace/activityName/version` and runs inside a Custom Service Module.
- **ServiceHub** is the sole internal routing point. All service-to-service
  calls are mediated through it; direct module-to-module paths do not exist.
- Activities are discovered and registered via module manifests at startup.
  ServiceHub maintains the activity registry and resolves routing per-request.
- **msp_semaphores** provides distributed coordination primitives (acquire /
  renew / release) used to sequence concurrent manifest registrations and
  guard shared operations.
- **Version compatibility** across multiple deployed module versions is handled
  by a plugin-selection model (`bestVersionMatch`) — SemVer matching picks the
  highest compatible implementation for a given data or request version, without
  branching in business logic.
- **DataHub** sits between Custom Service Modules and Custom Data Modules,
  applying signed minimisation and redaction policies — see Use Case 3.
- **AsyncLocalStorage** is used to propagate request-scoped context (token
  claims, request IDs, work context) through the Node async call graph without
  explicit parameter threading.

### Key documentation

| File | What it covers |
|---|---|
| [ARCHITECTURE.md](ARCHITECTURE.md) | ServiceHub routing, activity registry, namespace prefixing, discovery flow |
| [END_TO_END_FLOW.md](END_TO_END_FLOW.md) | End-to-end trace of an activity call from UI event through ServiceHub to a Custom Service Module and back |
| [QUICK_START.md](QUICK_START.md) | Starting ServiceHub, Actorwork, and FES; testing an activity call via curl |
| [msp_svr_common/src/als/README.md](msp_svr_common/src/als/README.md) | JWT validation, AsyncLocalStorage context management, claim helpers, service-to-service token propagation |
| [msp_svr_common/src/service-manager/VERSION_COMPATIBILITY_GUIDE.md](msp_svr_common/src/service-manager/VERSION_COMPATIBILITY_GUIDE.md) | Plugin-based version matching pattern; `bestVersionMatch`; avoiding conditional version branching |
| [msp_semaphores/README.md](msp_semaphores/README.md) | Semaphore service API, `createSemaphoreMiddleware`, `withSemaphore` helper |

### What exists vs. what is planned

| Capability | Status |
|---|---|
| ServiceHub manifest registration + activity routing | Working |
| Service Activity execution (`namespace/name/version`) | Working |
| JWT validation + ALS context propagation | Working |
| Semaphore coordination service | Working |
| Version-compatibility plugin selection | Working |
| Automated startup registration with retry | Working |
| DataHub minimisation pipeline | Partially designed; not fully implemented |
| Wide automated pipelines / workflow orchestration | Not started |
| Activity result streaming / long-running activities | Not started |

---

## Use Case 3 — Zero-Trust Architecture

**Focus:** Context-based access control, module signing, full provenance chain
recording, Policy Decision Points (PDPs) and Policy Enforcement Points (PEPs),
the access-control DSL, and the audit graph.

### Core ideas

- **Three stacked access control layers:** ReBAC (relationship graph traversal)
  → ABAC (attribute evaluation) → CBAC (signed context assertions). All must
  allow. Default is always deny.
- **Rights derive from relationships, not identity.** An actor's right to a
  resource is derived from their current Participation in a Work item, not from
  a static role or group. This eliminates role explosion and makes every allow
  decision self-documenting.
- **Continuous evaluation.** Authorisation is re-evaluated on every request
  against the live policy graph — no session-cached decisions.
- **Module admission** requires a platform-signed manifest. The admission gate
  includes automated AST scanning (network calls, `eval`, `process.env` in
  policy DSL blocks) and a human review step before the platform signs.
- **RGAM** (Reasonably Good Access Management) — the design philosophy
  underpinning the audit model. The key insight: the historical audit record
  and the live enforcement graph are the **same structure**. A gap found in
  history can be queried against the current policy graph immediately.
- **DataHub** enforces minimisation/redaction as a topological guarantee —
  Custom Service Modules receive minimised data regardless of what they request.
- **Platform Graph DB** stores actors, works, participations, policies, module
  manifests, and audit events as a unified graph — policy versioning via
  immutable nodes with `supersededBy` edges.

### Key documentation

| File | What it covers |
|---|---|
| [docs/security/copilotContext.md](docs/security/copilotContext.md) | **Primary security working context.** Trust tiers, network topology, three-layer access model, module admission lifecycle, audit graph schema, CBAC context authorities, phased build-out status |
| [docs/security/RGAM.md](docs/security/RGAM.md) | Full design paper on RGAM: forensic reproducibility, five core intentions, architecture in service of intentions, regulatory use cases (DSAR, DPIA, post-incident gap analysis, module admission impact analysis), known limitations |
| [SECURITY_ARCHITECTURE.md](SECURITY_ARCHITECTURE.md) | Detailed technical design: component inventory, K8s network segmentation policy, token model (user / service / agent / context assertion), full access control model, PDP evaluation sequence |
| [SECURITY_APPRAISAL.md](SECURITY_APPRAISAL.md) | Independent appraisal of the planned architecture: structural strengths, real risks (SSRF on ServiceHub, reviewer fatigue in admission, vm.Context sandbox limits, CBAC trust chain, policy introspection at scale), recommended mitigations |
| [msp_svr_common/src/als/README.md](msp_svr_common/src/als/README.md) | JWT / OIDC validation, trusted issuer verification, JWKS caching, ALS-based claim propagation — the current production-ready token handling layer |

### What exists vs. what is planned

| Capability | Status |
|---|---|
| MSAL actor token propagation (UI → BFF → ServiceHub) | Working |
| JWT validation + trusted-issuer verification (server) | Working |
| ALS-based claim context per request | Working |
| ServiceHub manifest-based routing | Working |
| Manifest signing infrastructure | Not started |
| PDP implementation (ReBAC/ABAC evaluation) | Not started |
| PEP wiring in ServiceHub | Not started |
| CBAC context authority registration + assertion validation | Not started |
| DataHub minimisation/redaction DSL execution | Not started |
| Platform Graph DB (audit + policy nodes) | Not started |
| Access policy DSL + admission AST scanner | Not started |

---

## Use Case 4 — Deployment Tooling & Self-Owned Infrastructure

**Focus:** Service Activity modules that interact with the platform's own
CI/CD pipelines to manage the lifecycle of functional Service Activities —
including staged rollouts (alpha, beta, GA), restricted write permissions
to live resources during pre-GA phases, and platform-app-managed access
controls for module releases.

### Core ideas

- The platform's own CI/CD pipelines are exposed as Service Activities,
  meaning they are subject to the same manifest signing, routing, and access
  control model as any other activity. The platform manages its own
  infrastructure through the same governance layer it applies to Custom Modules.
- **Staged release model** (planned):
  - `alpha` — internal developer access only; write access scoped to
    synthetic/test resources.
  - `beta` — restricted production write access; explicit allowlist of live
    resources the activity may modify.
  - `GA` — full declared write access as per signed manifest.
- **Access controls on writes to live resources** are enforced by the PEP
  in ServiceHub + DataHub, not by pipeline scripts. A beta release of an
  activity genuinely cannot write to a resource outside its declared and
  platform-approved scope — this is a topological guarantee, not a convention.
- **Self-service lifecycle management** allows platform application operators
  (with appropriate Participation in a deployment Work item) to promote,
  rollback, or retire a module version via the same activity/behaviour model
  used by application features.
- This use case is the furthest from current implementation but is
  architecturally enabled by Use Cases 2 and 3 being in place.

### Key documentation (current)

| File | What it covers |
|---|---|
| [docs/security/copilotContext.md](docs/security/copilotContext.md) | Module admission lifecycle; signing + human review gate; phased build-out plan |
| [SECURITY_ARCHITECTURE.md](SECURITY_ARCHITECTURE.md) | Manifest signing model; platform vs. custom module trust tiers; network segmentation |
| [SECURITY_APPRAISAL.md](SECURITY_APPRAISAL.md) | Risks in the admission reviewer workflow; diff-based review recommendation; automated risk-scoring |
| [msp_svr_common/src/service-manager/VERSION_COMPATIBILITY_GUIDE.md](msp_svr_common/src/service-manager/VERSION_COMPATIBILITY_GUIDE.md) | Version plugin selection — the same model applies to selecting between alpha/beta/GA versions of a deployed activity |
| [msp_semaphores/README.md](msp_semaphores/README.md) | Sequencing concurrent manifest registrations — relevant to staged rollout coordination |

### What exists vs. what is planned

| Capability | Status |
|---|---|
| Activity-based manifest registration (module self-registers) | Working |
| Version-aware activity routing (`bestVersionMatch`) | Working |
| Staged release model (alpha/beta/GA designation) | Not started |
| PEP enforcement of write-access scope in pre-GA phases | Not started (depends on Use Case 3 PDP/PEP) |
| CI/CD pipeline activities (deploy, promote, rollback, retire) | Not started |
| Self-service lifecycle management UI | Not started |
| Module retirement + audit trail of version supersession | Not started |

---

## Master File Index

All documentation files in the project, in logical order.

### Platform-wide

| File | Scope |
|---|---|
| [CONTEXT.md](CONTEXT.md) | This file. Top-level orientation and use-case index |
| [ARCHITECTURE.md](ARCHITECTURE.md) | System topology, discovery flow, MF setup, Fluent DSL overview |
| [END_TO_END_FLOW.md](END_TO_END_FLOW.md) | Complete worked example of the event → service → UI round-trip |
| [QUICK_START.md](QUICK_START.md) | Starting the system; curl tests; current status |

### Security & Governance

| File | Scope |
|---|---|
| [SECURITY_ARCHITECTURE.md](SECURITY_ARCHITECTURE.md) | Full planned security architecture design |
| [SECURITY_APPRAISAL.md](SECURITY_APPRAISAL.md) | Appraisal of the architecture: strengths, risks, mitigations |
| [docs/security/copilotContext.md](docs/security/copilotContext.md) | Working context for security-related development sessions |
| [docs/security/RGAM.md](docs/security/RGAM.md) | RGAM design paper — the audit and policy graph philosophy |

### UI Layer

| File | Scope |
|---|---|
| [msp_ui_common/src/uiLib/copilotContext.md](msp_ui_common/src/uiLib/copilotContext.md) | UILib architecture: four patterns, provider tree, subsystem contracts |
| [msp_ui_common/src/uiLib/behaviours/FluentBehaviours.md](msp_ui_common/src/uiLib/behaviours/FluentBehaviours.md) | Fluent Behaviour DSL: full surface, runtime execution, chaining |

### Server / Service Layer

| File | Scope |
|---|---|
| [msp_svr_common/src/als/README.md](msp_svr_common/src/als/README.md) | JWT validation, ALS context propagation, claim helpers |
| [msp_svr_common/src/service-manager/VERSION_COMPATIBILITY_GUIDE.md](msp_svr_common/src/service-manager/VERSION_COMPATIBILITY_GUIDE.md) | Version-compatibility plugin selection pattern |
| [msp_semaphores/README.md](msp_semaphores/README.md) | Semaphore service for distributed coordination |

### Module Federation Plugin

| File | Scope |
|---|---|
| [module-federation-vite/README.md](module-federation-vite/README.md) | MF Vite plugin public API |
| [module-federation-vite/src/esmExportEnumerator/copilotContext.md](module-federation-vite/src/esmExportEnumerator/copilotContext.md) | Plugin internals: ESM export enumeration, factory files, manifest pipeline |
| [module-federation-vite/src/esmExportEnumerator/usage.md](module-federation-vite/src/esmExportEnumerator/usage.md) | CLI usage: audit, write, CI gate for shared-ESM registry |
| [module-federation-vite/scripts/generate-factory-files.usage.md](module-federation-vite/scripts/generate-factory-files.usage.md) | Factory file generator script usage |

---

## How to Use This File

### For LLMs / Copilot sessions

At the start of a session, state which use case you're working on.
Load this file plus the listed documentation for that use case.
The security working context (`docs/security/copilotContext.md`) contains the
most current phase status and should be loaded for any session touching
security, access control, or module admission.

### For human developers

- New to the project? Start with [ARCHITECTURE.md](ARCHITECTURE.md) and
  [END_TO_END_FLOW.md](END_TO_END_FLOW.md), then [QUICK_START.md](QUICK_START.md).
- Working on UI features or the Behaviour DSL? Read
  [msp_ui_common/src/uiLib/copilotContext.md](msp_ui_common/src/uiLib/copilotContext.md) first — it defines the rules
  that prevent the most common architectural mistakes.
- Working on security, access control, or policy? Read the security docs in
  order: [SECURITY_ARCHITECTURE.md](SECURITY_ARCHITECTURE.md) →
  [docs/security/RGAM.md](docs/security/RGAM.md) →
  [SECURITY_APPRAISAL.md](SECURITY_APPRAISAL.md).
- Working on service activities, routing, or DataHub? Start with
  [END_TO_END_FLOW.md](END_TO_END_FLOW.md) for the full request trace,
  then [msp_svr_common/src/als/README.md](msp_svr_common/src/als/README.md) for the server-side token layer.
- Working on the MF Vite plugin? Load
  [module-federation-vite/src/esmExportEnumerator/copilotContext.md](module-federation-vite/src/esmExportEnumerator/copilotContext.md)
  and consult user memory for the five root-cause fixes already applied.

---

_This document should be updated when new documentation files are added, or
when significant implementation phases complete and status entries change._
