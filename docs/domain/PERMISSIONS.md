# MSP Platform — Permission Model

_April 2026_

This document describes how permissions work in MSP. It is a companion to
[WORK_MODEL.md](WORK_MODEL.md) (the domain model) and refines the security
design described in [../security/RGAM.md](../security/RGAM.md).

---

## Core principle

**Rights derive from relationships, not identity.**

An Actor's right to access a resource or execute an activity is derived from
their current, verifiable Participation in the Work that justifies that access.
Static roles, job titles, and group memberships are not sufficient on their own.

Default: **DENY**. Every allow decision requires a valid path through the
permission graph.

---

## Three stacked layers

All three layers must allow. Any layer's denial is a hard deny.

```
CBAC  ← signed context assertions (time, geo, device posture, domain facts)
  └─ ABAC  ← Actor attributes × Work attributes × Resource classification
       └─ ReBAC  ← Actor → Participation → Work → Resource graph traversal
```

### ReBAC — Relationship-Based Access Control

The foundation layer. On every request the PDP asks:
> Does a valid, continuous graph path exist from this Actor to this Resource,
> through current active Participations?

```
Actor ──[hasParticipation]──► Participation ──[inWork]──► Work
                                                              │
                                                   [accessesResource]
                                                              │
                                                              ▼
                                                         Resource
                                                              │
                                              [governedBy]   │
                                                              ▼
                                                          Policy
                                                              │
                                            [requiresMinimisation]
                                                              │
                                                              ▼
                                               MinimisationPolicy
```

No path → no access. The path is the audit justification.

### ABAC — Attribute-Based Access Control

Evaluates attribute combinations:
- Actor attributes (type, status, verified properties)
- Work attributes (classification, status, sensitivity)
- Resource classification (declared in the module manifest)

For example: `reviewer` Participation type + Work `sensitivity:high` +
Work status `in-review` — the policy evaluates the combination without
needing a dedicated role.

### CBAC — Context-Based Access Control

Signed, time-bounded assertions from registered Context Authorities:
- Time server: "current time is within permitted window"
- Geo service: "request is from permitted jurisdiction"
- Custom domain: any assertion registered by the platform operator

Context Authorities are themselves admitted via the module signing/approval
flow. An assertion from an unregistered authority is treated as absent → deny
if the policy requires it.

---

## Participation types and permission flow

### Actor → Work

Direct rights on a Work item. Examples:

| Participation type | Typical rights |
|---|---|
| `owner` | Full management, transfer of ownership, closure |
| `case-owner` | Case management, task assignment, case closure |
| `reviewer` | Read, comment, approve/reject |
| `assigned` | Execute task, update task state |
| `participant` | Read access, limited update |

### Work → Work

Relationships between Files, Cases, and Tasks. Permissions may flow through
these edges at Activity code's discretion. The platform does not enforce
specific flow rules — those are Activity-level policies.

### Actor → Actor

Delegation relationships. Delegated rights carry the delegating Actor's
Participation rights, optionally with additional constraints (scope, time
window, sub-set of Work types). Constraints can only restrict, never expand
beyond the delegator's own rights.

---

## PDP evaluation sequence

On every ServiceHub request:

1. Identify Actor from validated token
2. Resolve Work context from request
3. Traverse Actor → Participation → Work → Resource graph
4. Evaluate ABAC: attribute match
5. Evaluate CBAC: signed context assertions
6. Manifest check: Activity declared in the active signed manifest
7. **Allow** or **Deny** — always write structured audit event

---

## What this means for module authors

- **Do not implement your own access checks.** All enforcement is at the
  ServiceHub/DataHub boundary.
- **Declare resources in your manifest.** Resources not declared cannot
  be reached.
- **Participations are created by platform Activities**, not by modules
  directly. A module should request Participation changes via platform
  Activities, not manipulate them directly.
- **Data minimisation happens at DataHub**, not in your Service Module.
  Never assume you will receive un-minimised data.

See [../platform/MODULE_AUTHORING.md](../platform/MODULE_AUTHORING.md) for
how to declare resources in your manifest.
