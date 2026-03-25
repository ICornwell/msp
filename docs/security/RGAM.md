# Reasonably Good Access Management (RGAM)
## A Design Paper for the Mighty-Small-Platform

_March 2026_

---

## Abstract

Most access management systems are designed to answer one question at admission
time: "should this actor be allowed in?" The Mighty-Small-Platform's Reasonably
Good Access Management system is designed to answer a harder, retrospective
question: "given that a piece of sensitive data appeared somewhere it shouldn't
have, can we show a regulator — precisely, reproducibly, and completely — who
saw it, why we believed they were entitled to see it, exactly what form it was
in when they saw it, and whether the same gap could exist today?"

RGAM is not a claim to perfection. The name is deliberate. It is a claim to
rigour, transparency, continuous improvement, and demonstrable due diligence —
the properties that regulators, data subjects, and competent security reviewers
actually look for, and that most systems cannot credibly offer.

---

## 1. The Premise

### 1.1 The question that conventional IAM cannot answer

In most access management systems, an audit log records that access occurred.
It records who authenticated, what they requested, and whether it was permitted.
What it typically cannot record — and therefore cannot reconstruct — is:

- **Which version of which policy** authorised the access
- **What the authorising relationship was** between the accessor and the resource
  at the moment of access (as opposed to their general role at the time)
- **What minimisation and redaction was actually applied** to the data before
  it was returned — not which policy existed, but what that policy produced
  with that data
- **Whether the combination of those factors** can be deterministically
  reproduced from the stored record

When a data subject identifies your organisation as the source of a
potential breach, these are the exact questions a regulator will ask. An
audit log that records "access granted" is not an answer to any of them.

### 1.2 The improvement gap

Equally important: when an organisation discovers a data protection gap after
the fact, most audit systems can establish that access occurred but cannot
establish whether the same gap persists in the current state of the system.
The historical record and the current state are held separately, often in
incompatible forms, by different teams. Gap remediation and current-state
verification require manual cross-referencing across systems that were not
designed to talk to each other.

RGAM is designed so that the historical record and the current state are the
**same graph**, extended over time. A gap found in history is a query that can
be re-run against current policy nodes immediately.

### 1.3 Why "Reasonably Good"

The name acknowledges three honest constraints:

1. **No system prevents all breaches.** RGAM's goal is not to make breaches
   impossible but to make their causes discoverable, their scope definitively
   bounded, and the organisation's response credible and complete.

2. **Perfection is an enemy of deployment.** An access management system
   that is never finished because it is always being perfected provides less
   actual protection than one that is implemented incrementally, with each
   phase providing real improvement over the previous one.

3. **Demonstrable due diligence is a realistic compliance target.** GDPR
   Article 5(2) requires accountability — the ability to demonstrate compliance,
   not a guarantee of zero incidents. RGAM is designed to satisfy that
   requirement thoroughly and honestly.

---

## 2. Core Intentions

RGAM has five intentions, stated in order of priority:

### Intention 1: Forensic reproducibility

Every access event must be reconstructible from first principles:
who accessed what, under which policy version, via which authorising
relationship, and with what transformation applied to the data before
it was returned. The reconstruction must be deterministic — running
the same policy version against the same input must produce the same
output, always.

This is the hardest intention to satisfy and the one most systems abandon
without realising they have done so. It requires:
- Policy versions to be immutable once applied (not "the current policy at
  the time" but "the signed, hash-identified policy node that was active")
- Redaction and minimisation to be deterministic functions, not
  probabilistic or stateful processes
- Audit events to link directly to all of the above, not to names or
  identifiers that might be reused or reassigned

### Intention 2: Rights derive from relationships, not identity

An actor's right to access a resource must be derived from their current,
verifiable relationship to the work that justifies that access — not from
their static role, job title, or group membership.

This is the central architectural decision that makes RGAM tractable at
scale. It eliminates role explosion (the tendency of RBAC systems to
accumulate hundreds of roles to express contextual access requirements)
and makes the access model self-documenting: every allow decision has a
business-level explanation ("Actor A accessed Resource R because they held
Participation type P in Work W, which satisfies Policy Q").

### Intention 3: The platform owns the relationship graph

Even where actors and work items are sourced from external systems (HR
platforms, project management tools, identity providers), the platform
is the authoritative source for the relationships between them and the
lifecycle states of those relationships. No external system can grant
access by asserting a relationship — it can inform the platform's graph,
but the platform adjudicates the policy consequences.

This means a deprovisioned participation is deprovisioned in the platform
graph, effective immediately on the next request, regardless of what any
upstream identity system says about the actor's general status.

### Intention 4: Continuous evaluation, no cached decisions

Authorisation is evaluated on every request against the current state of
the graph. A token that was valid at session start does not authorise a
request made after the actor's participation was revoked, the work was
closed, or a policy was superseded. There is no window between a policy
change and its enforcement.

### Intention 5: Historical record enables forward assurance

The immutable audit record and the live policy graph are the same data
structure. A gap identified in a historical access event can be queried
against the current graph immediately, to determine whether the same gap
exists now. Remediation is verifiable, not just assertable.

---

## 3. Architecture in Service of Intentions

### 3.1 The Relationship-Based Access Control (ReBAC) model

The core innovation of RGAM is the ReBAC trust model. Where traditional
RBAC assigns permissions to roles and roles to users, RGAM derives access
rights from graph relationships:

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

An access request is an attempt to traverse this graph. The PDP evaluates
whether a valid, continuous path exists from the requesting Actor to the
requested Resource, through current, active relationships, under a policy
that allows it. No path — no access. The path is the justification, and
the justification is recorded in the audit event.

**Why this eliminates role explosion:** Any contextual access requirement is
expressed as a new Participation type or a new Work attribute. There is no
need to create a new role to express "a person who is the assigned reviewer
of a high-sensitivity work item during its review stage." That is simply the
combination of Participation type `reviewer`, Work attribute `sensitivity:high`,
and Work status `in-review`. The policy evaluates the combination; the graph
records the justification.

### 3.2 Layered control: ReBAC + ABAC + CBAC

RGAM stacks three control layers. All must allow. The default is deny.

**ReBAC layer** — relationship traversal: does a valid graph path exist?

**ABAC layer** — attribute evaluation: do the Actor's attributes, Work
attributes, and Resource classification attributes satisfy the applicable policy
conditions?

**CBAC layer** — context assertions: are the required signed context facts
present and valid? (time of day, geographic jurisdiction, device posture,
incident state, or any domain-specific context registered by the platform
operator)

Context authorities (the issuers of CBAC assertions) are themselves admitted
through the platform's signing and approval flow. A context assertion from
an unregistered authority is treated as absent — if a policy requires it,
the result is deny. This prevents the CBAC layer from being widened by
introducing an unofficial authority.

### 3.3 DataHub: minimisation as a topological guarantee

The most important structural property of RGAM is that data minimisation and
redaction are not applied by the requestor, not applied by the data source,
and not applied by policy advisory — they are applied by the DataHub service,
which sits as a mandatory intermediary between every Custom Service Module and
every Custom Data Module.

This means:
- A Custom Service Module that attempts to retrieve more data than it should
  receives the minimised result regardless of what it requests
- A Custom Service Module whose redaction policy has a gap receives a result
  consistent with that gap — which is then visible in the audit record and
  queryable against current policy
- No amount of correct behaviour by the Custom Service Module improves the
  outcome; no amount of incorrect behaviour worsens it beyond what the
  minimisation policy permits

**The minimisation guarantee does not depend on trusting the module code.**
This is the property that makes it meaningful.

### 3.4 The graph database as unified truth

The Platform Graph DB holds:
- The live policy state (actor, work, participation, resource, policy nodes)
- Module manifests and their supersession chains
- Audit event nodes, linked to the policy state that was active when each
  event was recorded

Because policy versions are immutable nodes (never mutated; superseded by
new nodes with explicit `supersededBy` edges), an audit event recorded six
months ago still correctly references the policy that was active at that
moment. The historical record is not a snapshot — it is part of the same
continuous graph as the current state.

---

## 4. Use Cases and Benefit Analysis

### Use Case 1: Regulatory investigation — potential data breach

**Scenario:** A data subject reports that highly sensitive personal information
about them has appeared in a public context. They identify the platform operator
as the most likely source. The relevant data protection authority opens an
investigation.

**What RGAM provides:**

The platform can produce, from a single graph query:
- Every actor who accessed any resource touching the data subject's record,
  for any time period
- The participation and work context active for each access
- The policy version that authorised each access
- The minimisation and redaction policy applied for each access
- A deterministic reconstruction of the exact data returned for each access
  (by replaying the version-pinned policy against a copy of the source data)

The platform can further state, from the same graph:
- Whether any of those access events occurred outside the scope of a currently
  active participation or work item (which would indicate the access was
  anomalous even if it was permitted at the time)
- Whether any of those policy versions have since been identified as having
  gaps and been superseded, and whether the current state has closed those gaps

**Benefit:** The organisation can demonstrate not just that controls existed but
that they were active and correctly applied at every recorded access event. Where
a gap is identified, the response is evidence-based and immediately paired with
a current-state verification.

---

### Use Case 2: Access policy review — "who could access this?"

**Scenario:** A data protection officer wants to understand, for a given category
of sensitive data, who in the organisation (across all actor types and work
contexts) could access it and under what circumstances. This is required for
a Data Protection Impact Assessment (DPIA) under GDPR Article 35.

**What RGAM provides:**

A reverse graph traversal from the resource:

```
Resource ← Policy ← Participation type ← Work type ← Actor type
```

This produces a structured answer: "Actor type X holding Participation type P in
a Work of type W with attribute A can access this resource, and would receive it
with minimisation policy M applied."

The answer is not a list of individual actors (which would be unbounded and
change constantly) but a description of the structural conditions under which
access is possible. This is precisely what a DPIA requires — the policy space,
not the instance enumeration.

**Benefit:** DPIA production becomes a supported workflow rather than a manual
reconstruction exercise. The answer is always current, because it queries the
live graph.

---

### Use Case 3: Post-incident improvement — gap identification and verification

**Scenario:** An internal review identifies that a redaction policy active
six months ago did not cover a field that has since been classified as sensitive.
Accesses during that period may have returned un-redacted values for that field.

**What RGAM provides:**

Step 1 — **Historical scope:** Query all audit events that used the affected
policy version and returned results from resources containing the sensitive field.
This gives the definitive set of accesses that may have been affected.

Step 2 — **Current state verification:** Query the current policy graph to
confirm that the sensitive field is now covered under all active policies that
touch resources containing it. This is a live query, not an assertion.

Step 3 — **Forward assurance:** Where the current query confirms coverage,
the remediation is verifiable. Where it does not, the gap query produces the
list of specific policies that need updating, and the verification query can
be re-run after each update.

**Benefit:** The organisation can demonstrate to regulators that it not only
identified the gap but verified its closure — completely, not by assertion.
The verification is a graph query result, not a human-written statement.

---

### Use Case 4: Module admission review — access impact analysis

**Scenario:** A new version of a Custom Service Module is submitted for
admission. It declares access to a data resource it did not previously access.

**What RGAM provides:**

The admission gate static analysis identifies the new resource access
declaration. The reviewer can query:
- Which actors, under which participation types and work contexts, will be
  able to invoke this new access path (given current participation and work
  type policies)
- What minimisation policy will be applied
- Whether any comparable access path exists in a currently-admitted module
  (to assess whether this is an expansion of existing surface or genuinely new)

**Benefit:** Reviewers are not evaluating a manifest in isolation — they are
evaluating the access policy implications against the live graph. An inadvertent
over-permission in the manifest is flagged not as "this looks wrong" but as
"this would allow Actor type X in Work context Y to access data class Z, which
is not currently accessible via any admitted module."

---

### Use Case 5: Data subject access request (DSAR)

**Scenario:** A data subject submits a DSAR, requesting to know what personal
data the platform holds about them and who has accessed it.

**What RGAM provides:**

The audit graph, queried by data subject identifier, returns:
- Every resource access touching that subject's data, with actor, work context,
  participation, and policy for each event
- The minimisation applied (demonstrating that the accessor did not receive
  fields they were not entitled to)
- The current retention state (whether data has been archived, and under
  what policy)

**Benefit:** The DSAR response is produced from structured data, not assembled
from logs. It is complete (every access event is in the graph) and can be
produced consistently regardless of how long ago the subject's data was first
processed.

---

## 5. The Continuous Improvement Loop

RGAM's most distinctive property — one that distinguishes it from compliance-
as-checkpoint approaches — is that the historical record and the current
enforcement state are the same structure. This creates a natural improvement
loop:

```
Incident / gap identified
        │
        ▼
Query: what was the policy state at time T?
        │
        ▼
Query: does the same gap exist in current policy?
        │
   ┌────┴────┐
   │         │
  Yes        No
   │         │
   ▼         ▼
Remediate  Verify + record
   │         │
   └────┬────┘
        │
        ▼
Audit: verified closure linked to original gap finding
```

Each iteration of this loop produces a permanent record: the original gap,
the remediation, and the verification query result. Over time, this produces
an organisational knowledge base of data protection decisions — not just "we
fixed it" but "here is the class of gap, here is the fix, here is the
verification, and here is how we would detect the same class of gap in a
future module."

This is the operational substance of GDPR Article 5(2) accountability and of
NIST SP 800-53 rev 5 control PM-31 (continuous monitoring strategy). It is
also, practically speaking, what separates organisations that are genuinely
improving their data protection posture from those that are performing it.

---

## 6. Known Limitations and Honest Scope

### 6.1 What RGAM does not protect against

RGAM assumes that the signing and admission process has not been compromised.
If the platform's signing key is compromised, or if the human reviewer in the
admission process approves a malicious manifest, the downstream controls remain
intact (DataHub minimisation still applies, audit still records, continuous
evaluation still runs) but the initial admission guarantee is broken. Key
management and reviewer accountability are therefore prerequisites, not components.

RGAM also assumes that audit event writes are integrity-protected. The append-
only, single-writer model ensures this architecturally, but the security of
the audit writer service account is outside RGAM's own scope.

### 6.2 What RGAM cannot reproduce

RGAM can reconstruct what data was returned by replaying the version-pinned
policy against source data. It cannot reconstruct what the recipient did with
that data after it was received. The minimisation guarantee ends at the platform
boundary. What happens beyond that boundary is outside RGAM's scope — and is
the appropriate scope of endpoint security, DLP controls, and (ultimately) the
data recipient's own accountability obligations.

### 6.3 The interpreted-vs-executed policy decision

RGAM permits data and access policies to be expressed as executable DSL code.
This provides expressive power but introduces a sandbox boundary that requires
careful engineering (worker thread isolation, memory and CPU limits, input
sanitisation). For future policy types where the required expressiveness is
lower, an interpreted-data model (JSON policy objects evaluated by the platform
rather than executed) is worth considering, as it eliminates the sandbox surface
entirely at the cost of expressiveness.

---

## 7. Conclusion

RGAM is not novel in any single component. Relationship-based access control,
attribute-based policy evaluation, append-only audit logs, and graph databases
are all established. What is distinctive is the combination — and specifically
the design decision that these components are not separate systems that need to
be correlated after the fact, but a single unified graph that can be queried
from multiple directions to serve enforcement, audit, introspection, DPIA, and
improvement purposes simultaneously.

The driving design question — "if sensitive data appeared publicly and the
regulator pointed to us, could we account for every access, show every guard
that was in place, and demonstrate it was there when the access was made?" —
is one that most platforms at any scale could not answer affirmatively today.
RGAM is designed so that MSP can, not as a special reporting exercise, but as
a routine graph query.

That is what "Reasonably Good" means in practice: not perfect, not overclaimed,
but thorough, honest, and demonstrably continuous.

---

_This paper is a living design document. Sections should be updated as
implementation phases complete and as practical experience informs the design._
