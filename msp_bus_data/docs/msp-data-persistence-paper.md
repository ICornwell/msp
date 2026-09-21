# MSP Data Persistence

## A graph-backed, view-driven approach to enterprise data

## Abstract

The MSP data platform is designed for enterprise information that is shared, contextual, historical, and connected across domains. Its persistence model is not a conventional object-relational mapping of tables into classes. It is a transactional graph-backed document system in which application-facing Views describe finite projections of a graph, BusData translates those Views into graph operations, and TechData stores versioned vertices and edges.

This paper explains the design from first principles. It describes how to model identity, Entities, Value Objects, relationships, Assertions, history, transactions, and Views. It compares the approach with traditional Entity-Relationship Diagrams (ERDs), ORMs, and ERM-style domain frameworks. It also documents current implementation behavior and distinguishes it from planned capabilities such as ISR data transport, recursive View execution, and broader identity preparation.

The central proposition is:

> Persist enterprise understanding as independently addressable, historically meaningful graph facts, and produce purpose-specific Views over that understanding rather than treating each document or screen as an isolated data model.

---

## 1. First Principles

### 1.1 The workshop decision

The design originated in a workshop with a deliberate constraint: temporarily put aside what we already knew about implementing databases and enterprise applications, and ask a more fundamental question:

> From a purely informational point of view, how should enterprise information be modelled across a complete, changing business lifecycle?

The lifecycle considered was not a single transaction or screen. It extended across:

```text
submission -> quote -> bind -> mid-term adjustment -> renewal -> ... -> expiry
```

The model also had to preserve continuity through changes in:

- products and product versions;
- brokers and broker relationships;
- insured risks and risk characteristics;
- underwriting decisions and their audit trail;
- contractual history;
- claims experience;
- manual adjustments, discounts, overrides, and the reasons or authority supporting them;
- multi-layer programmes;
- split paper and distributed participation.

The workshop conclusion was that these should not be treated as unrelated application records joined only by implementation-specific keys. They are changing views of connected information whose identities, relationships, evidence, context, and history need to remain meaningful across the lifecycle.

That decision led to the central MSP design direction:

```text
model connected information first
  -> preserve identity and relationships across lifecycle changes
  -> produce purpose-specific Views for each business activity
  -> apply contextual integrity rules through governed business modules
```

Database tables, service boundaries, ORM classes, and user interfaces remain important implementation tools, but they are not the starting point for deciding what the information means.

### 1.2 Enterprise data is connected

Enterprise facts rarely stand alone. A policy is related to a product, a product is operated by a team, a process uses a tool, a control governs a process, and a source document supports a claim. These relationships are not decoration. They are part of the meaning.

A traditional record-oriented design often begins with a record and adds relationships later through foreign keys, join tables, or application conventions. MSP begins with the assumption that meaningful relationships are first-class persistence concerns.

### 1.3 Enterprise understanding changes over time

A current value is not always enough. For audit, governance, operational analysis, and explanation, the platform may need to answer:

- What did we understand at a particular time?
- Which version of an object was visible in a transaction?
- Which source or context supported a claim?
- What changed, and why?
- Which relationships were removed, rather than which objects disappeared from one View?

MSP therefore treats versioning, transaction context, and historical state as part of the persistence model rather than as an afterthought.

### 1.4 One object may appear in many Views

A broker, policy, tool, process, or Assertion may appear in many application Views. A View is a projection, not ownership of the underlying identity.

Removing an object from one View does not necessarily mean that the object has ended its life. This distinction is central to Entity lifecycle handling.

### 1.5 Persistence should preserve useful uncertainty

Enterprise sources can disagree. Different teams may use different classifications or names. A source may be incomplete or context-specific. A persistence layer that forces every fact into one canonical interpretation can destroy useful evidence.

MSP can retain competing or contextual Assertions and allow later correction, supersession, or qualification.

### 1.6 Technical storage and business meaning are separate layers

TechData should not need to understand products, policies, people, or PAMELA. It stores technical vertices, edges, transactions, versions, and content. BusData understands View semantics and converts business-facing projections into technical graph operations.

This separation keeps the storage engine reusable while allowing richer domain modelling above it.

---

## 2. The MSP Persistence Model

### 2.1 The layers

The persistence path is deliberately layered:

```text
Application module
  -> MSP data activity
  -> DataHub
  -> BusData
  -> TechData
```

#### Application module

A module defines its schemas, domain objects, relations, Views, and data activities. It should not handcraft graph mutations or manage database transactions directly.

#### Data activity

The module’s data activity receives a domain-oriented request and invokes the shared DataCommon or server SDK.

#### DataHub

DataHub routes data activities, applies data-feature registration, mediates View reads and writes, and provides a boundary for policy and access decisions.

#### BusData

BusData interprets the View definition and data document. It performs identity-aware diffing, maps document structures to vertices and edges, handles relationship removal, and prepares abstract graph updates.

#### TechData

TechData applies the technical graph transaction. It stores versioned vertices and edges, enforces technical consistency, manages locks, and maintains transaction/lifecycle metadata.

### 2.2 Vertices and edges

A vertex represents an addressable or contained object in the graph. An edge represents a relationship between vertices.

At the TechData boundary, the model is deliberately abstract:

```text
Vertex:
  entity/version identity
  label
  content
  transaction metadata
  business key

Edge:
  source vertex
  target vertex
  label
  transaction metadata
  content
```

TechData does not need to know that a vertex represents a Policy, an Assertion, or a Tool. Those meanings belong to the View and domain layers above it.

### 2.3 Content and structure

The platform separates:

- vertex content, which is diffed as object state;
- graph structure, which is diffed as relationships;
- technical lifecycle, which records transactions, versions, locks, and supersession.

This separation allows a relationship to be removed without deleting either endpoint, and allows an endpoint’s content to remain unchanged while its relationships change.

---

## 3. Identity: Entities and Value Objects

MSP borrows useful distinctions from Domain-Driven Design (DDD), while applying them to a graph-backed persistence system.

### 3.1 Entity

An Entity has an identity that remains meaningful across versions and appearances in different Views. It can be referenced independently and has its own lifecycle.

In the technical graph:

- `__entityId` is the stable lifecycle identity;
- `id` identifies the current persisted version;
- `__originalId` carries the first version identity through later versions.

An Entity may appear in many Views. Its absence from one View is not evidence that it should be deleted.

Examples include:

- an enterprise;
- a person;
- an organisation;
- a policy;
- an Assertion;
- a tool;
- a product;
- a process.

### 3.2 Value Object

A Value Object is meaningful as part of an owning Entity and does not have an independent lifecycle. It is normally represented and updated through its owner.

A Value Object may carry the owning Entity’s `__entityId` as lifecycle context, while using its own `id` for the current version/object representation.

Examples might include:

- a contained address representation;
- a bounded configuration fragment;
- a value-bearing child structure;
- a representation detail whose identity is not useful outside its owner.

### 3.3 One lifecycle owner

A Value Object should have one lifecycle-owning Entity. It may appear in more than one Entity subgraph, but multiple appearances do not automatically create multiple lifecycle owners.

This distinction matters when a View removes a Value Object:

- if it is only owned by the current parent, default lifecycle cleanup is reasonable;
- if the value is intentionally shared, relationship-only removal may be required.

### 3.4 Entity removal from a View

Entities are always delinked rather than deleted merely because they disappear from a View. A View describes a projection and does not define the complete life of every Entity it contains.

This protects heavily shared objects from accidental deletion when a narrower View is updated.

### 3.5 Value Object removal from a View

Value Objects are normally soft-deleted when removed from their owning ViewData, avoiding accumulation of orphaned Value Objects.

A View sub-element may opt into relationship-only removal with `delinkOnRemoval`. This is appropriate when the Value Object is intentionally attached to more than one parent.

The current policy is deliberately conservative:

```text
Entity removed from View:
  preserve Entity, remove View-managed relationship

Value Object removed from View:
  default: remove relationship and soft-delete value
  delinkOnRemoval: remove relationship only
```

A future declaration such as `isShareableBetweenEntities` may help reduce ambiguity, but it should wait for real use cases.

---

## 4. Graphs, Views, and Subgraphs

### 4.1 A View is a finite projection

A View describes how to traverse and shape a portion of the graph for a particular read or write operation.

A View defines:

- View identity and version;
- root key strategy;
- root object;
- nested document paths;
- collection versus single-value cardinality;
- relation direction and names;
- Entity versus Value Object semantics;
- removal behavior;
- schema and relation declarations.

A View is not the graph itself and does not own the identities it exposes.

### 4.2 View subgraphs

A View subgraph is a bounded graph projection. It may include:

- a root Entity;
- contained Value Objects;
- related Entities;
- Assertions;
- relationships in one or both directions;
- finite nested paths.

The same underlying vertex can appear through multiple View branches. This is where internally shared references (ISR data) become useful.

### 4.3 Rich View declarations

Runtime View declarations may contain rich DomainObject metadata, including schemas, business-key definitions, and relation declarations. Before the Node-to-Go boundary, DataCommon projects the View into an acyclic declarative transport form:

- retain schemas and relation metadata;
- retain `relatedObjectId`;
- remove live `relatedObject` pointers;
- remove runtime functions and TypeScript-only values.

This gives BusData enough information for strict View compliance checks without sending a circular in-memory declaration graph.

### 4.4 Recursive View declarations

The View builder can express recursive chains, but fully executing recursive Views requires recursive CTE support and recursive graph/document walkers. Until that work is complete, finite static Views provide a predictable implementation path.

A five- or six-level View can be explicit and useful without requiring unrestricted recursive execution.

---

## 5. PAMELA as a Graph Domain

### 5.1 Artefacts and Assertions

PAMELA’s two foundational semantic primitives are:

- **Artefact:** anything sufficiently identifiable that PAMELA may make Assertions about;
- **Assertion:** a directional claim from a subject Artefact through a predicate to an object Artefact.

Assertions are themselves Artefacts. This enables:

```text
Artefact -> Assertion -> Artefact
Assertion -> Assertion
Assertion -> Context
Assertion -> Source
```

### 5.2 Assertion endpoints

A mature PAMELA model should represent assertion subjects and objects as proper Artefact endpoints rather than only scalar strings. Literal values may be represented as `literal` Artefacts or another explicitly defined terminal reference type.

This gives a uniform semantic shape:

```text
Subject Artefact -> Predicate -> Object Artefact
```

It also permits in-memory cycles. JavaScript-only platform transport can preserve those cycles with `flatted`; the Node-to-Go boundary uses ISR reference stubs rather than rebuilding cyclic Go maps.

### 5.3 Core taxonomy

PAMELA’s initial core categories include:

```text
literal, context, person, organisation, role, team,
process, policy, control, product, system, tool,
data, information, event, document, source, location, asset
```

These are open classifier starting points, not a closed TypeScript union or heavyweight ontology.

The important distinctions include:

- `system`: an abstract or composite arrangement of Artefacts;
- `tool`: a concrete means, including hardware and software;
- `information`: meaningful content in any form;
- `data`: information digitised or structured by a Tool;
- presentation by a Tool may turn data into information again.

### 5.4 Foundation predicates

The initial predicate vocabulary includes:

```text
hasName
isA
partOf
relatedTo
represents
derivedFrom
applicableIn
sameAs
supports
owns
withInContext
```

`applicableIn` describes contextual usefulness of an Artefact or concept. `withInContext` primarily qualifies an Assertion whose meaning is context-dependent.

---

## 6. Best Practices for Business Data Modelling

### 6.1 Model stable things as Entities

Use an Entity when the business needs to:

- refer to the object independently;
- assert something about it;
- retain provenance or history for it;
- update it independently;
- share it across multiple Views;
- reconcile it with another identity.

Do not downgrade an object merely to reduce technical graph size. Identity and lifecycle meaning come first.

### 6.2 Use Value Objects for truly bound detail

Use a Value Object when its lifecycle is wholly determined by its owning Entity and it has no useful independent references or Assertions.

Ask:

> Could a future user need to refer to this object, assert something about it, or change it independently?

If yes, it probably deserves Entity status.

### 6.3 Do not infer ownership from appearance

An object appearing inside a View does not mean the View owns its entire lifecycle. A shared Broker or Tool may appear in many Views without being owned by any one of them.

The View defines the current relationship or projection, not necessarily the object’s lifecycle.

### 6.4 Use precise predicates

Prefer a supported specific predicate over `relatedTo`. Avoid inferring `owns` from participation, or `sameAs` from similarity.

When evidence is insufficient, preserve the broad or uncertain meaning rather than inventing precision.

### 6.5 Preserve provenance and context

Assertions should remain connected to the source and context that justify them. Context should be as wide as it can be and as narrow as it must be to preserve consistency.

### 6.6 Model transformation, not just endpoints

The information/data distinction is directional:

```text
Information -> digitised or structured by Tool -> Data
Data -> presented or interpreted by Tool -> Information
```

Representing these transformations allows PAMELA to explain how a fact arose and how it is used.

### 6.7 Prefer aggregate writes where lifecycle is shared

Fine-grained Entity locking is valuable where shared Entities are changed independently. Bulk writes may later use an aggregate/root lock where contained objects have a common lifecycle.

This is an optimization decision to be learned from domain usage, not imposed globally.

---

## 7. History, Reinstatement, and Retrospective Forking

### 7.1 History is not merely audit text

A versioned graph can answer both what was stored and how understanding changed. Each update produces a new version while preserving historical identity relationships.

The current technical identity distinction is:

```text
__entityId: stable lifecycle identity
id: current version identity
__originalId: first version identity
```

### 7.2 Reinstating a historic position

A future reinstatement operation should not silently erase history. It should create a new current version whose content and relationships are derived from a selected historic position.

Conceptually:

```text
historic snapshot at T
  -> new transaction
  -> new current versions
  -> explicit provenance: reinstated from T
```

The old history remains queryable.

### 7.3 Subgraph copies

A subgraph copy should distinguish between:

- copying a representation of existing identities;
- creating new independent Entities;
- copying Value Objects under a new lifecycle owner;
- retaining references to shared external Entities.

The operation should state its identity policy explicitly. A copy that silently duplicates shared identities can create false parallel realities; a copy that silently shares all identities can make later changes unexpectedly coupled.

### 7.4 Retrospective forking

Retrospective forking means creating a new branch of understanding from a historic position and applying new changes from that point.

A safe implementation should preserve:

- source historical timestamp or version;
- new branch transaction identity;
- relationship changes;
- provenance explaining the fork;
- conflict decisions where the branch diverges from the current graph.

This is a future capability, not a current guarantee of the BusData/TechData implementation.

---

## 8. Platform Implementation Details

### 8.1 DataCommon to BusData

DataCommon prepares a request using the View and data. The View is projected into an acyclic declarative transport form. Rich runtime DomainObject pointers do not cross into Go.

For future ISR data:

- first object occurrence is full;
- repeated occurrence is a reference stub;
- references affect edge processing, not vertex content;
- unresolved references fail explicitly.

### 8.2 BusData diffing

BusData:

1. loads the current View state;
2. assigns temporary IDs to new full objects;
3. compares new and current document structures;
4. prepares add/update/delete vertices;
5. prepares add/update/delete relationship effects;
6. deduplicates new vertices by label and business key;
7. sends abstract graph operations to TechData.

ISR-aware diffing is being introduced incrementally. The core rule is that reference stubs are structural terminals, not content candidates.

### 8.3 Delinking and Value Object cleanup

When a child disappears from a View, `handleRemoval` determines whether the relationship should be delinked or the child should be deleted/soft-deleted.

For Entity children, delinking is always required.

For Value Objects:

- `delinkOnRemoval=true`: relationship-only removal;
- otherwise: relationship removal plus Value Object deletion behavior.

If the parent itself has no content update, BusData creates a technical parent update carrying the affected raw edge IDs in `ViewManagedEdges`.

If the parent already has an update, the managed edge IDs are added to that update rather than creating a duplicate update.

### 8.4 TechData transactions

TechData applies the prepared graph update inside a database transaction. It stores versioned vertices and edges and links inserted versions to transaction metadata.

The current implementation also acquires advisory write locks for touched Entity IDs and records lock vertices and transaction relationships as technical audit structures. This is intentionally correct and observable, though bulk Entity-heavy writes create substantial housekeeping overhead.

### 8.5 Locking strategy

The current fine-grained strategy is useful when independently shared Entities commonly change separately. A later implementation may use:

- aggregate/root locks for tightly bound Value Object groups;
- RDBMS joins for transaction membership instead of graph edges;
- database mutations for lock release rather than durable release edges.

These changes must preserve business lifecycle semantics and remain below the application model.

### 8.6 Errors and boundaries

The platform should preserve the real failure boundary:

```text
handler failure -> DataHub result -> BusData error -> TechData error
```

Activity dispatch must not relabel a handler failure as `ACTIVITY_NOT_FOUND`. Transport and activity runners should preserve messages, error codes, and logs.

### 8.7 Technical graph versus business graph

The graph includes both semantic business structures and technical transaction/lifecycle structures. Counts of vertices and edges therefore include:

- domain vertices;
- semantic edges;
- transaction links;
- lock vertices and release history;
- supersession structures.

This is useful for audit and correctness but may require later internal compaction or alternative representations for high-volume workloads.

---

## 9. Comparison with ERD, ORM, and ERM Designs

### 9.1 Traditional ERD designs

An ERD is excellent for making relational structure explicit:

- tables and columns;
- primary and foreign keys;
- cardinalities;
- constraints;
- relational integrity.

However, an ERD often encourages each bounded application capability to own a local model. Cross-domain identity, context, provenance, and historical graph structure may then be reconstructed through joins and conventions.

MSP does not reject relational storage. TechData uses an RDBMS implementation. The difference is the application-facing persistence contract: MSP treats graph identity, relationships, View projection, and history as first-class concerns rather than deriving them from table shape alone.

### 9.1.1 First-class schemas versus first-class relationships

Traditional ERD modelling usually makes object or table schemas primary. The detailed fields of a Customer, Policy, Product, or Document are carefully specified, while relationships are represented as foreign keys, join tables, and cardinality constraints. The relationship is important, but it is often structurally secondary to the records being related.

MSP reverses that emphasis where the business problem is fundamentally connected. It treats relationships as first-class business information and schemas as supporting descriptions of the objects at each endpoint.

This does not make schemas unimportant. Fields still describe the content, shape, validation hints, labels, keys, and presentation of an Artefact. But the relationship can carry the greater business meaning:

```text
Policy Package -> includes -> Cover
Team -> supports -> Process
Control -> governs -> Process
Assertion -> derivedFrom -> Source
Representation -> represents -> Enterprise Concept
```

The relationship answers how packages of information fit together, why they matter to each other, and what changes may be consequential. A field schema answers what can be said about one package in isolation.

The practical business question is:

> In this business, is the priority the detail of fields, or the relationships between packages of information?

For many enterprise activities, the answer is the relationships. A sparse description of a Policy can still be useful if its connections to products, people, processes, controls, systems, evidence, and representations are preserved. A richly detailed isolated record may be less useful if its place in the operating model is lost.

MSP therefore makes it possible to evolve the field schema without losing the surrounding graph of meaning. It also makes relationship policy explicit: which relations are allowed, in which directions, with which lifecycle behavior, and under which View or business rule.

### 9.1.2 Business integrity is not split across storage conventions

In a conventional RDBMS application, business integrity is often divided among table design, foreign keys, ORM configuration, service code, UI conventions, and developer discipline. MSP aims to place business integrity rules in business integrity rule modules, with the persistence platform executing them consistently.

The separation is:

```text
Business integrity rules
  -> business integrity rule modules

Persistence platform
  -> executes and enforces those rules

TechData
  -> technical identity, transaction, locking, versioning, and storage guarantees
```

This allows relationship-centric and contextual rules to be versioned, governed, and changed without rewriting database schemas or relying on every feature implementation to remember the same convention.

### 9.1.3 Localised ownership of change

The platform’s separation of concerns is also a separation of ownership.

Feature modules own the business-facing data dictionary and provide Views bound to that vocabulary. A feature View selects the schemas, fields, and relationships appropriate to its business context, department, process, or workflow. It may introduce additional relationships when the business capability requires them without forcing every other feature to adopt those relationships.

The platform layers then have distinct responsibilities:

```text
Feature module
  -> business vocabulary, schemas, contextual Views, relationship intent

DataHub
  -> data policy, access policy, redaction, routing, and feature governance

BusData
  -> business relational integrity, View compliance, identity-aware diffing,
     lifecycle-aware relationship handling, and per-View integrity

TechData
  -> technical integrity only: storage, transactions, versions, locks,
     graph consistency, and persistence mechanics
```

TechData remains deliberately indifferent to whether the data represents a Policy, Claim, Tool, Process, or Assertion. BusData enforces the business-facing relationship and View rules supplied by the feature layer. DataHub governs which data may be accessed and how it may be presented. The feature module owns the meaning.

This means a change to a business area should remain local to that area wherever possible:

- a department can evolve its data dictionary;
- a process can add or refine relationships in its own Views;
- a policy module can change contextual integrity rules;
- DataHub can apply the corresponding access or redaction policy;
- BusData can enforce the resulting relational behavior;
- TechData should not require business-specific schema changes merely to persist it.

This is not isolation for its own sake. Shared identities and relationships can still be deliberately reused across feature modules. The point is that reuse is expressed in the business model and governed View, rather than emerging accidentally from a database table dependency or a feature’s implementation convention.

### 9.2 ORM designs

An ORM provides productivity by mapping rows to objects and object relationships to database operations. It is effective when:

- aggregates are well understood;
- object graphs are bounded;
- relationships are relatively stable;
- lifecycle ownership is clear;
- history and context do not require unusual treatment.

For enterprise knowledge graphs, ORM object graphs can become problematic:

- large eager or lazy loading graphs;
- accidental cascade deletes;
- identity confusion across contexts;
- difficult historical reconstruction;
- object graph cycles during serialization;
- changes to one relationship producing broad persistence side effects.

MSP uses explicit finite Views instead of pretending that every graph traversal is one ordinary object load. Its serializers and transport boundaries make cycles deliberate rather than accidental.

### 9.3 ERM and domain frameworks

ERM-style frameworks often provide rich domain modelling, validation, workflow, and lifecycle conventions. They can be powerful, but they may assume that the framework’s aggregate boundaries or type hierarchy are the primary source of truth.

MSP aims to keep the persistence substrate generic. Domain modules define their Views, schemas, and relation policies, while BusData and TechData provide reusable graph persistence mechanics.

### 9.4 Advantages of MSP’s approach

MSP is particularly strong where the business needs:

- shared identity across many representations;
- first-class relationships;
- Assertions about Assertions;
- contextual and competing claims;
- source and provenance preservation;
- finite purpose-specific Views;
- historical versions and reinstatement opportunities;
- explicit Entity versus Value Object lifecycle policy;
- module-specific models over a common persistence substrate;
- technical storage that remains ignorant of business definitions.

### 9.5 Costs and tradeoffs

The approach is not free. It introduces:

- more explicit identity decisions;
- richer View declarations;
- graph diffing and relationship lifecycle logic;
- more technical transaction and lock structures;
- a need for clear transport projections and ISR handling;
- more care around partial Views and shared entities;
- higher write overhead when every object is an Entity.

These are acceptable only when the domain benefits from the preserved meaning. MSP should not be used to turn every simple CRUD table into a graph unnecessarily.

---

## 10. Practical Decision Checklist

When designing a new MSP model, ask:

1. Does this object require independent identity?
2. Could another View or Assertion refer to it?
3. Does it need independent provenance or history?
4. Is it an Entity or a Value Object?
5. Who owns its lifecycle?
6. What happens when it disappears from a View?
7. Is the relationship semantic, contextual, representational, or merely technical?
8. Which foundation predicate best preserves the source meaning?
9. What is the stable Entity identity, and what is the current version ID?
10. Should the object be shared through ISR references?
11. Does the View need an additional explicit edge outside its nested object tree?
12. Which history, context, and transaction information must remain explainable?
13. Is the proposed locking unit aligned with the actual change boundary?
14. Does the model need a business read model or event projection rather than a direct graph query?

The best MSP model is not the most elaborate model. It is the smallest model that preserves the identities, relationships, contexts, lifecycles, and history that the business actually needs.
