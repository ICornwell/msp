# MSP Security Architecture — Appraisal

_GitHub Copilot with Claude Sonnet 4.6 — March 2026_

---

## Summary judgement

The planned architecture is **well-conceived and structurally sound**. The
core insight — that the platform's enforcement points must be positioned such
that Custom Module code *cannot physically reach* data it isn't entitled to,
regardless of what that code does — is the right framing. This is defence by
**topology**, not by trusting behaviour, and it is the appropriate model for
a platform that hosts third-party code.

The NIST SP 800-207 / 800-162 / 800-53 targeting is appropriate and
achievable with the stated design. The graph DB choice as native backend is
particularly well-matched to the ReBAC + policy-introspection requirements.

What follows is an honest assessment of strengths, genuine risks, and areas
that will need careful design work as implementation proceeds.

---

## Strengths

### 1. Enforcement by topology, not behaviour trust

DataHub sitting between Custom Service Modules and Custom Data Modules means
a legitimately-signed but accidentally (or maliciously) over-returning service
module still cannot deliver un-minimised data to its caller. The constraint
doesn't depend on the module code being correct. This is the platform's
strongest structural guarantee.

### 2. The graph model fits the problem extremely well

Actor → Participation → Work → Resource is a naturally graph-shaped domain.
Using the same graph structure for both PDP evaluation (forward traversal)
and security introspection (reverse traversal) is elegant and avoids the
common failure mode of audit/compliance systems that are separate from the
enforcement model and inevitably diverge from it. Policy versioning as graph
nodes with supersededBy edges means historic audit events remain accurate
without requiring time-travel queries.

### 3. Default-deny with per-request evaluation

No cached authorisation decisions + per-request token validation is textbook
SP 800-207 §3.3 continuous verification. The operational cost of this is
real (latency on every call), but it is the only design that satisfies zero-
trust — anything else creates a window between decision and enforcement.

### 4. Admission signing closes the most dangerous gap

The finding that dev teams must not have production data access, and therefore
cannot embed data at build time, is sound. The signing model's work-item
review workflow is the right balance between hard security (manifests can't
run unsigned) and operational reality (automated rejection of everything
unexpected is impractical; human review of intent is necessary).

### 5. Audit trail as a first-class structured graph

Writing structured AuditEvent nodes with full evidence chains (not free-form
log text) makes compliance reporting a query, not a reconstruction exercise.
The DPIA and regulatory audit use cases become naturally supported rather
than requiring custom tooling to be built at compliance time.

---

## Genuine risks & areas requiring care

### 1. ServiceHub becomes the highest-value attack target

The architecture is correct that ServiceHub is the sole chokepoint — but this
means a compromise of ServiceHub is a compromise of the entire platform's
security guarantee. ServiceHub's own authentication, authorisation-of-callers,
and input handling must be treated as the most security-critical code in the
system. Particular attention needed:

- **SSRF vectors**: A Custom Service Module that can coerce ServiceHub into
  making an outbound call to an arbitrary URL (by crafting a manifest activity
  payload) could bypass network segmentation. ServiceHub must validate that
  every outbound call target is a registered, admitted module endpoint — not
  an arbitrary URL derived from request body content.
- **PDP bypass via manifest confusion**: If manifest routing logic can be
  confused (e.g. crafted activity names that collide with platform-internal
  routes), a module could call platform internals it shouldn't reach. Strict
  namespace separation between platform-internal and custom-module activity
  namespaces is essential.

### 2. The reviewer burden is the weakest link in admission

The automated gate is strong, but the human review step will face pressure
to become a rubber stamp — particularly for incremental module updates where
"nothing significant changed." Consider:

- **Diff-based review**: present reviewers with what changed between the
  previous signed version and the candidate, not the full manifest. Change
  review is more robust than whole-manifest review under time pressure.
- **Automated risk-scoring**: flag high-risk changes (new dependencies,
  new DSL policy conditions, new activities) for elevated scrutiny, so
  reviewers spend attention proportional to change risk.
- **Reviewer accountability**: the audit trail should record which human
  signed which admission decision, with what automated gate results attached.
  This makes negligent approval visible.

### 3. DataHub policy execution is a hard problem fully solved

Running redaction/minimisation DSL as code (even in vm.Context) is the
right answer for expressive policies, but the sandbox escapes in Node's vm
module are well-documented. `vm.Context` prevents global access but does not
prevent:

- CPU exhaustion (timeout alone isn't sufficient defence — a policy that
  creates a 10GB string before timing out has already caused damage)
- Memory exhaustion (no memory limit in vm.runInContext without worker threads)
- Prototype pollution attacks via crafted input objects

Mitigations:
- Run DSL policies in **worker threads** (real memory/CPU isolation, not just
  context isolation)
- Apply strict `timeout` + `memoryLimit` at the worker level (Node 22+ has
  `--max-old-space-size` per worker)
- Deeply freeze or structuredClone input objects before passing to DSL
- Consider whether the interpreted-data model (JSON policy objects that DataHub
  interprets rather than executes) is preferable for redaction/minimisation,
  reserving code execution for UI components only

### 4. CBAC context authority trust chain needs explicit design

"Signed context assertions from registered authorities" is the right model,
but the details matter significantly:

- What algorithm/format signs context tokens? (JWT with platform CA? Custom?)
- What is the maximum acceptable skew on time assertions?
- What happens if a context authority is compromised and needs to be revoked?
  The CRL/OCSP story for context authority certificates needs design.
- Geo-location as a security control (rather than a convenience signal) has
  known weaknesses (VPN, Tor, CDN exit nodes). Worth deciding whether geo
  assertions are a hard deny condition or a soft signal that can be combined
  with other attributes.

### 5. The policy introspection explosion problem at scale

The control panel query "who can access R?" is theoretically a graph traversal,
but as the number of Actors, Work items, and Policies grows, the enumeration
of all Actor × Participation × Work combinations that yield allow for a
given resource can become very large. For operational queries this is fine.
For **real-time control panel queries**, consider:

- Pre-computing and caching the access capability matrix on policy change
  events, rather than computing on demand
- Limiting the control panel query to "Actor types × Participation types"
  (the structural answer) rather than enumerating every individual Actor
  instance (the instance answer), which is both cheaper and more useful for
  policy review

### 6. MF-Node DSL modules and isolation in Phase 4

When DSL-generated modules execute in Node via module-federation-node
(Phase 4), the same topology guarantee (mediation via ServiceHub) must
hold. The risk is that MF-Node makes it easier to accidentally allow
in-process direct calls between a DSL module and a platform service that
shares the same process — bypassing the ServiceHub PEP. The process boundary
(separate container/pod per module type) is the correct mitigation, not
logical code separation alone.

---

## What is notably absent (and likely intentional at Phase 1)

- **Rate limiting / throttling** — not mentioned but clearly needed at
  ServiceHub for abuse prevention. msp_semaphors appears positioned for this.
- **Anomaly detection / SIEM integration** — the audit graph is the right
  foundation; feeding it to a SIEM for behavioural anomaly detection (actor
  accessing resources outside their normal pattern) would complete the
  SP 800-53 SI-4 (system monitoring) control. Noted as future work.
- **Multi-tenant isolation** — if the platform hosts modules for multiple
  independent tenants, the graph DB partitioning and NetworkPolicy topology
  will need explicit tenant isolation design. Worth thinking about before
  rather than after the first multi-tenant deployment.

---

## Overall assessment

The architecture as described would, when fully implemented, satisfy the
stated NIST targets. The design decisions are mutually consistent — the
graph backend, the ReBAC + ABAC + CBAC stacking, the topology-enforced
minimisation, and the audit model all reinforce each other rather than
working at cross-purposes.

The primary implementation risks are not architectural but operational:
reviewer fatigue in the admission process, and the gap between the
soundness of the vm.Context sandboxing theory and the practical detail
of memory/CPU isolation in Node. Both are solvable with the specific
mitigations described above.

The phased build-out approach is pragmatic. Phases 1-2 deliver meaningful
security improvement over no controls with achievable scope. Phase 3 (CBAC
and full compliance documentation) can be deferred without undermining the
Phase 2 security posture.

This is a significantly more rigorous approach to platform security than
most micro-frontend / micro-service platforms in production. It's worth
building deliberately and getting right.
