# PAMELA Prototype Context

**Status:** Prototype guidance  
**Audience:** GitHub Copilot / coding agents / developers working inside the MSP codebase  
**Purpose:** Keep implementation decisions aligned with the current PAMELA experiment without prematurely designing the eventual product.

---

## 1. What PAMELA Is

PAMELA — **Progressive and Adaptive Modeller of Enterprise Library of Artefacts and Relationships** — is intended to provide a persistent, multi-perspective map of the operational enterprise.

Its purpose is sustainable productivity and consistency in describing how products, organisations, people, processes, information, systems, assets, controls, policies, costs and other operational things fit together.

PAMELA is not primarily an inventory or catalogue.

Many enterprise tools catalogue **Objects** and treat relationships as secondary metadata. PAMELA deliberately puts the emphasis on **Assertions and dependencies between things**, including relationships that cross business, operational, organisational, governance, financial and technical domains.

The core proposition is:

> Maintain shared operational understanding once, continuously improve it from evidence and use, and derive useful representations from that shared understanding rather than repeatedly reconstructing the enterprise from memory and disconnected documents.

PAMELA is therefore best thought of, at this stage, as an **enterprise dependency engine**.

---

## 2. Why We Are Prototyping It This Way

The current objective is not to build the final PAMELA product.

The objective is to create the smallest useful implementation that lets us **experience the graph**, discover what feels like too much or too little, and learn what retrieval, filtering and visualisation need to become.

The prototype should make unknowns observable.

Do not solve future problems unless the current experiment requires them.

The governing rule is:

> **Build only enough PAMELA to make the next unknown observable.**

The prototype should favour:

- explicit, inspectable data;
- simple replaceable components;
- reversible implementation choices;
- deterministic test data;
- visible intermediate results;
- minimal abstractions;
- manual judgement where automation would hide what we are trying to learn.

Avoid premature sophistication.

---

## 3. Core Semantic Model

The prototype should begin with only two semantic primitives.

### Artefact

An Artefact is anything sufficiently identifiable that PAMELA may make Assertions about it.

Examples include organisations, products, processes, roles, systems, services, APIs, business information, policies, controls, costs, contexts, sources, principles and concepts.

An Artefact has a stable identity.

A display label is a convenience, not identity.

### Assertion

An Assertion is a claimed directional relationship:

> **Subject Artefact → Predicate → Object**

Assertions are themselves Artefacts.

This is essential.

It allows PAMELA to make assertions about assertions, for example:

> `Rating Engine → supports → Calculate Premium`

and then:

> `[that Assertion] → derivedFrom → Application Architecture`

> `[that Assertion] → withInContext → Renewal`

Assertions must therefore be independently addressable by stable ID.

---

## 4. Context and Provenance Are First-Class

PAMELA must not flatten all claims into universal truth.

Different sources may contain different or apparently contradictory understandings.

PAMELA should preserve what the evidence supports without judging one source to be universally right.

A useful contextual rule is:

> **Context should be as wide as it can be and as narrow as it must be to preserve consistency.**

If no broader context can safely be inferred, the source document itself is a valid context.

Later evidence may justify widening that context to an author, team, department, product, system version, period of time, or another meaningful envelope.

The same principle applies to provenance.

A claim should remain connected to the evidence from which it arose.

For the prototype, the important mechanisms are therefore:

- Assertions about ordinary Artefacts;
- Assertions about Assertions;
- `derivedFrom`;
- `withInContext`;
- stable identity;
- append-only/history-friendly persistence through MSP.

Do not introduce a heavyweight epistemic model yet.

---

## 5. No Canon

PAMELA does not attempt to force the enterprise into one canonical model.

Different perspectives may classify or decompose the same underlying identities differently.

The useful test is not universal correctness.

The useful tests are:

- **Adequate** — enough to support the purpose;
- **Appropriate** — suitable to the context;
- **Proportionate** — no more structure/detail than the purpose justifies.

The prototype should therefore preserve ambiguity, contextual disagreement and relational density rather than cleaning them up for convenience.

---

## 6. Collection Versus Presentation

Do not conform or constrain original understanding merely to make presentation easier.

The principle is:

> **Conform and constrain only on demand and only for a specific purpose.**

Collection should preserve identities, assertions, context, provenance, ambiguity, competing claims and dense relationships.

Filtering, grouping, hiding, ranking and simplification belong at retrieval/presentation time.

If the graph looks messy, that is useful experimental material.

Do not remove complexity simply to produce a neat picture.

---

# 7. Prototype Build Sequence

The stages below are intentionally ordered.

Each stage should produce something inspectable and useful before the next layer is added.

---

## Stage 1 — Smallest Persistent Semantic Core

Implement the minimum domain and persistence model required to store and retrieve Artefacts and Assertions.

### Artefact

Minimum useful fields:

- stable ID;
- preferred/display label;
- minimal type/kind only where useful to the prototype;
- MSP-required lifecycle/system metadata.

### Assertion

Minimum useful fields:

- stable ID;
- subject reference;
- predicate;
- object reference or literal;
- polarity if retained;
- append-only/system timestamps through MSP.

Assertions must be able to reference Artefacts or Assertions as subjects, Artefacts or Assertions as objects where needed, and literals where useful.

Do not introduce a large ontology. Do not create separate domain classes for every business concept.

### Why this stage exists

We need to validate that the tiny semantic core is comfortable before adding intelligence.

The first question is:

> Can PAMELA naturally store connected understanding, including assertions about assertions?

If this is awkward, fix the core before proceeding.

### Acceptance signal

We can manually create and retrieve small graphs such as:

`A → supports → B`

`[that Assertion] → withInContext → C`

`[that Assertion] → derivedFrom → Source`

without special-case code.

---

## Stage 2 — Load a Dense, Recognisable Test Fixture

Use the fixture:

`pamela_brightstar_fixture_v0_1.json`

This is a fictional but recognisable SME commercial insurance estate.

It intentionally contains roughly 60 operational landmark Artefacts, contexts, sources, classifiers, nearly 2,000 Assertions, more than 1,000 Assertions about Assertions, aliases, dense hubs, cross-domain dependencies, contextual qualification, corroborating sources and a deliberate context-separated apparent contradiction.

The fixture is intentionally **messy and assertion-heavy**.

That is a feature.

### Why this stage exists

A sparse graph would make almost any visualisation look successful.

Real enterprise understanding is dense, overlapping and partially known.

We want to experience:

- too much;
- not enough;
- surprising traversal;
- useful density;
- noisy hubs;
- contextual filtering problems.

Do not simplify the fixture to make the UI look good.

### Important fixture hubs

Expect especially dense neighbourhoods around:

- Policy;
- Policy Administration System;
- SME Commercial Package.

If clicking PAS creates a horrible visual mess, that is a successful experiment.

---

## Stage 3 — Simple Graph Retrieval Views

Implement deliberately simple retrieval first.

Do not design a sophisticated query language or relevance model yet.

### Neighbourhood

Given Artefact X:

- return Assertions where X is subject;
- return Assertions where X is object;
- return connected Artefacts;
- retain direction and predicate.

### Traversal

Given one or more starting Artefacts:

- traverse outward through Assertions;
- support configurable maximum depth;
- prevent infinite recursion;
- retain every distinct route/path where practical.

Return enough route evidence to inspect:

- starting/root Artefact;
- depth;
- path;
- predicate;
- direction;
- intermediate Artefacts/Assertions.

Do not rank relevance yet. Do not hide hubs yet. Do not automatically collapse duplicate paths yet.

### Why this stage exists

We do not yet know what a PAMELA query should be.

We want use of the graph to teach us.

A bad result should be diagnosable as either:

- the relevant understanding is not present; or
- the understanding is present but retrieval/presentation failed to surface it usefully.

---

## Stage 4 — Assertion Browser UI

Build the first UI as a deliberately plain debugging instrument.

For a selected/filtered set of ordinary Artefacts, show Assertions in a list/table-like view.

Useful columns/details:

- Subject;
- Predicate;
- Object;
- Polarity;
- Context;
- Source/provenance;
- Assertion ID.

Allow selecting an Artefact, selecting an Assertion, inspecting Assertions about that Assertion, and basic filtering by Artefact kind and predicate.

### Why this stage exists

We need a transparent way to inspect exactly what PAMELA believes before visual layout obscures the data.

This UI is expected to remain useful even after richer visualisation exists.

---

## Stage 5 — ReactFlow Relationship Visualiser

Use ReactFlow to visualise the same retrieval result spatially.

Initial behaviour should be intentionally basic.

Suggested capabilities:

- ordinary Artefacts as nodes;
- Assertions as edges where that is visually adequate;
- Assertion Artefacts rendered as nodes where assertion-on-assertion structure needs to be shown;
- click a node to inspect or expand;
- click an edge/assertion to inspect;
- filter by predicate;
- expand one additional hop;
- collapse/hide manually;
- filter by broad Artefact kind.

Do not build formal Perspective models yet.

Do not persist diagram coordinates as PAMELA semantics yet.

Do not build the speculative zoomable UI yet.

### Why this stage exists

We need to discover where ordinary graph visualisation becomes unusable.

The important questions are experiential:

- How many Assertions around one object is too many?
- Which predicates do we naturally want to group?
- Which contexts do we immediately want to filter?
- What kinds of nodes behave like hubs?
- When do assertion-on-assertion relationships help or overwhelm?
- What information do we instinctively suppress?
- What do we regret not seeing?

The mess is the experimental material.

---

## Stage 6 — First Document Extraction Prototype

Only after we can inspect and experience the graph should we add LLM ingestion.

The extraction service should initially perform only:

> `Source document → Candidate Artefacts + Candidate Assertions`

The output must be inspectable before persistence.

Do not let the extractor directly mutate accepted PAMELA state.

Preserve candidate identity, source evidence, candidate names, descriptions, candidate Assertions, inferred context where supportable, and provenance.

### Why this stage exists

The LLM is proposing understanding, not declaring enterprise truth.

We want to compare extracted candidates with the graph we already understand.

Keep extraction separate from reconciliation.

Prompt design is an experiment at the edge, not part of the core domain model.

---

## Stage 7 — Embedding / Semantic Candidate Engine

Introduce embeddings as a replaceable semantic index.

Likely initial implementation:

- TypeScript;
- Transformers.js;
- pgvector/Postgres or another replaceable vector store.

Vectorise candidate/existing Artefacts using separate useful textual representations, for example:

- name / aliases;
- broad semantic description;
- broad + local/source context description.

Preserve similarity observations separately.

Do not combine them into an authoritative relevance or identity score.

### Semantic seam

Aim for a replaceable interface conceptually similar to:

`semanticCandidates(text, context) -> candidate Artefact IDs + similarity observations`

### Why this stage exists

Embeddings are useful for candidate retrieval: possible duplicate identity, semantically related Artefacts, naming assistance, and later query/context assembly.

They are not truth. They are not identity. They are not authority.

The rule is:

> **Vector proximity proposes candidates; it never deduplicates automatically.**

---

## Stage 8 — Soft Identity / Reconciliation Experiment

Do not implement destructive deduplication.

Treat similarity as **identity candidate detection**.

Given a new candidate Artefact, PAMELA may surface existing Artefacts that appear semantically close.

Possible human outcomes may later include:

- this is a new Artefact;
- this is the same Artefact;
- these are related but distinct;
- unresolved;
- the candidate needs a different name/context.

If identity equivalence is asserted, preserve both historical identities and use a relationship such as `sameAs`.

Do not delete history.

### Why this stage exists

Identity resolution is contextual and evidence-dependent.

The prototype should help us discover what evidence a human actually needs before building automation around identity.

Keep this highly manual initially.

---

# 8. First Prototype Milestones

## Milestone A — PAMELA Exists

We can persist the fixture, retrieve connected understanding, inspect Assertions, navigate the graph, and visualise dense neighbourhoods.

No AI is required.

This validates or challenges the semantic core.

## Milestone B — PAMELA Can Listen

We can give PAMELA a document, extract inspectable candidate Artefacts and Assertions, and compare them with known graph state.

No automatic reconciliation is required.

## Milestone C — PAMELA Can Remember

We can compare extracted candidate understanding with existing understanding, use embeddings to propose semantically close existing Artefacts, and manually reconcile candidate understanding into PAMELA.

At this point the useful loop begins to exist:

> **Evidence → Candidate Understanding → Existing Understanding → Reconciliation → Changed PAMELA State**

---

# 9. Important Prototype Non-Goals

Do **not** build these unless a current experiment proves they are necessary:

- complete enterprise ontology;
- canonical taxonomy;
- sophisticated Perspective model;
- representational/layout persistence;
- 3D/zoomable semantic UI;
- automatic context generalisation;
- automatic conflict resolution;
- automatic identity merging;
- relevance scoring framework;
- comprehensive query language;
- sophisticated graph ranking;
- workflow/assignment engine;
- governance approval workflow;
- production-scale document ingestion;
- autonomous agents modifying accepted graph state.

These are possible future capabilities, not prototype requirements.

---

# 10. Code / Module Boundaries

These are conceptual code boundaries, not necessarily separate deployable services.

Prefer one MSP Functional Module initially unless there is a concrete reason to separate deployment.

### PAMELA Core

Responsible for Artefacts, Assertions, stable references and persistence semantics.

### PAMELA Retrieval

Responsible for neighbourhood retrieval, traversal, route/path evidence and later query/relevance experiments.

### PAMELA Ingestion

Responsible for document/source input, candidate Artefact extraction, candidate Assertion extraction and preservation of source evidence.

### PAMELA Semantic Index

Responsible for embeddings, vector storage and semantic candidate retrieval.

This component must remain replaceable.

### PAMELA Presentation

Responsible for the assertion browser, ReactFlow visualisation and later presentation experiments.

Presentation requirements must not distort the core semantic model.

---

# 11. How to Treat the Northstar Fixture

The fixture is not intended to model insurance perfectly.

It is intended to provide a highly recognisable dependency fabric.

Important characteristics are deliberate.

### Dense relationships

Many ordinary Artefacts have dozens of Assertions.

This is expected.

### Cross-domain paths

A technical thing should be traversable through processes and business products into teams, policies, controls, costs, information and other systems.

For example, the Rating Engine should lead through pricing activity into the SME product, external data cost, policies and other technology.

### Hubs

Some Artefacts are intentionally connected to very large parts of the graph.

Do not suppress them in storage.

Learn how retrieval/presentation should tame them.

### Aliases

Examples such as Policy Administration System, PAS and Policy Platform refer to one fixture identity.

Other semantically similar terms such as Policy, Policy Bound Event and Policy Platform are deliberately distinct.

This will later test embedding-based candidate matching.

### Contextual contradiction

At least one pair of apparently contradictory Assertions is deliberately retained under different contexts.

Do not "fix" it by choosing one.

The purpose is to ensure context can preserve multiple locally adequate understandings.

---

# 12. Suggested First Visual Experiments

## Policy neighbourhood

Start at `info_policy`.

Observe information relationships, processes, applications, billing, claims, documents, events and product context.

Question:

> How quickly does a central business object become visually overwhelming?

## Policy Administration System neighbourhood

Start at `app_pas`.

Observe process support, information management, event publication, integrations, resilience, ownership and contextual variants.

Question:

> What filtering/grouping do we instinctively want when a real hub is shown honestly?

## Rating Engine dependency journey

Start at `app_rating`.

Try to traverse:

technology → process → business product → policy/cost/team → technology.

Question:

> Does the graph expose useful cross-domain dependency chains?

## Claims journey

Start at `app_claims`.

Traverse claims process → Claim → Policy → Product, and claims process → Payment → Payment Provider → Finance / GL.

Question:

> Can one starting point reveal operational, financial, organisational and technical consequences without changing repositories?

## Application / Integration slice

Starting from the SME product, filter visible Artefacts to Application or Service, Integration Artefact and Business Event.

Question:

> Does a simple filter already behave like the beginning of a useful perspective without designing a Perspective framework?

---

# 13. Guidance for Coding Agents

When implementing prototype work:

1. Prefer the simplest implementation satisfying the current acceptance criteria.
2. Do not infer future requirements from the broader PAMELA vision unless explicitly requested.
3. Do not introduce new domain abstractions merely to make code look architecturally complete.
4. Preserve append-only/history-friendly semantics.
5. Preserve stable identity.
6. Treat Assertions as first-class addressable entities.
7. Do not silently merge or overwrite competing understanding.
8. Do not let embeddings or LLM outputs directly assert accepted truth.
9. Keep intermediate outputs inspectable.
10. Keep clever components replaceable.
11. Never simplify stored understanding merely because the visualiser is messy.
12. Put conformance and filtering at retrieval/presentation boundaries, not ingestion.
13. Prefer explicit code over generalized frameworks during discovery.
14. If a design choice cannot yet be justified by a current experiment, defer it.

When uncertain, choose the option that is easiest to inspect, easiest to reverse, easiest to replace, and least likely to constrain later learning.

---

# 14. Prototype Success Criterion

The prototype does not succeed because it produces an attractive graph.

It succeeds when it teaches us useful things about working with dense enterprise understanding.

The key test is:

> **Can we start from a recognisable Artefact and traverse far enough across domains to learn something useful about what it depends on, what depends on it, and why those relationships are believed?**

The next test is:

> **Can we learn, through use, which subset of that understanding is adequate, appropriate and proportionate to show for a particular purpose?**

Do not optimise away the difficulty before we have learned from it.

---

# 15. Governing Prototype Principle

> **PAMELA should preserve the messy relational fabric of the operational enterprise and let purpose-specific retrieval and presentation make it usable.**

Or, operationally:

> **Collect broadly. Preserve faithfully. Traverse simply. Present selectively. Learn before generalising.**
