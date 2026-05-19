# MSP Platform — Work Domain Model

_April 2026_

This is the canonical reference for the MSP work domain.
All other documents (UX, security, dev) reference this one.

---

## Work Hierarchy

```
File
 └─ Case  (one Primary File; may reference additional Files via Participations)
     └─ Task  (one Primary Case + one Primary File; may link to related Files)
```

### File

A long-lived, enduring record of a business entity. Equivalent to a DDD
aggregate root. Examples: Insurance Policy, Customer, Claim, Broker, Partner.

- Has a nominal **owner** (User, Team, or System Actor)
- Persists indefinitely — the "filing cabinet" record
- Data classification is set at File level and inherited by Cases and Tasks
  unless explicitly overridden

### Case

A unit of purposeful work seeking a defined outcome.
Examples: New Policy, Create TOBA, Process Claim, Organise Service Partner.

- Has exactly one **Primary File**
- May reference additional Files via Participations (Activity code's discretion)
- Has a **Case Owner** Actor
- Lifecycle: open → fulfilment | cancellation | termination
- Closing a Case requires all associated Tasks to be closed;
  Activities may refuse to close until Tasks are cleared, or may auto-close them —
  both patterns are supported and determined by the Activity implementation
- A Case may be created before its Primary File exists (e.g. a new-entity case
  creates the File as one of its Tasks)

### Task

An atomic unit of work that progresses a Case.
May also attach directly to a File without a Case in simple scenarios.

- Has exactly one **Primary Case** (or no Case for direct File tasks)
- Has exactly one **Primary File**
- May link to additional Files (Activity code's discretion, not formal data model)
- Has exactly one **current assignee** at a time
- Multiple Tasks can be open and assigned simultaneously within a Case
- Has SLAs and post-SLA deadlines
- Lifecycle: open → complete | cancelled

---

## Actor Types

All five Actor types are first-class participants in the system. Any Actor type
can have Participations with any other Actor type or with any Work entity.

| Type | Description |
|---|---|
| **User** | Human actor with a single identity (typically OIDC-authenticated) |
| **System** | Automated system actor with a single identity (service account) |
| **Agent** | AI/LLM actor with a single identity; carries a set of pre-prompts and context definitions per agent instance |
| **Team** | Grouping actor used for organisational hierarchy: divisions, branches, functions, departments, operational teams |
| **Organisation** | Special group representing a legal corporate entity |

---

## Participations

Participations are the primary mechanism for expressing relationships and
carrying permissions. They exist in three categories:

### Actor → Work Participations

The primary ReBAC edge. An Actor's rights to access or act on a Work item
are derived from their Participation *type* with that Work item — not from
their Actor type or general role.

Examples:
- User A holds `case-owner` Participation on Case X → full case management rights
- User B holds `reviewer` Participation on Case X → read + comment rights
- Team C holds `assigned-team` Participation on Task Y → task visibility for team members

### Work → Work Participations

Express relationships between Files, Cases, and Tasks.
Example: Case relates to a "secondary Policy" File via a `related-file` Participation.

Permissions can flow through Work → Work relationships at Activity code's discretion.

### Actor → Actor Participations

Express organisational and delegated relationships.
Example: User A delegates rights to User B with additional constraints (scope, time window).

Permissions can flow and be constrained as they are delegated.

---

## Ownership and Defaults

The **File Owner** is the primary accountability holder for a File.
The **Case Owner** is the primary accountability holder for a Case;
if the Case Owner differs from the File Owner, they will typically hold
a related Participation with the File Owner (or their Team/Organisation).

Ownership is an Actor → Work Participation with a specific type (`owner`);
ownership can be transferred by re-assigning that Participation.

---

## What is NOT in the data model

The following are at Activity (server code) discretion and are not formally
constrained by the domain model:

- Which specific related Files a Case or Task links to beyond the Primary
- Cascading behaviour when a Case closes (auto-close Tasks or refuse)
- Permission inheritance rules between Work → Work relationships
- Organisational hierarchy depth and delegation chain limits

These are implemented as Activity logic and can vary per use case without
requiring data model changes.
