# PAMELA Core Taxonomy

PAMELA is a Progressive and Adaptive Modeller of an Enterprise Library of Artefacts and Relationships. This document defines its initial shared vocabulary. It is a practical baseline, not a closed ontology: enterprise-specific classifications can be added as classifier Artefacts when they become useful.

## Semantic Primitives

### Artefact

An Artefact is anything sufficiently identifiable that PAMELA may make Assertions about. An Artefact has a stable identity; a display label is a convenience, not identity.

Artefacts are independently addressable where they require independent provenance, context, lifecycle, or relationships. A tightly bound representation or semantic variant may later be modelled as a value object when its lifecycle is wholly owned by a prime Artefact.

### Assertion

An Assertion is a claimed directional relationship:

> Subject Artefact -> Predicate -> Object Artefact

Assertions are themselves Artefacts. This permits Assertions about Assertions, including contextual qualification, provenance, support, and disagreement. Assertions should therefore be independently addressable where those capabilities are required.

## Core Artefact Categories

The following categories are suitable initial classifier Artefacts. `kind` remains open: these are common starting points rather than an exhaustive or exclusive type system.

- `literal`: a value or expression, including text, number, date, identifier, amount, code, or boolean.
- `context`: an envelope within which an Artefact or Assertion should be understood.
- `person`: an individual human being.
- `organisation`: a legal, commercial, public, or other organised body.
- `role`: a set of responsibilities or authority that may be performed by a person, team, or organisation.
- `team`: a group of people acting together for a purpose.
- `process`: a purposeful sequence or pattern of work.
- `policy`: a statement of intent, rule, or guiding principle.
- `control`: a mechanism intended to manage risk, assure behaviour, or demonstrate compliance.
- `product`: something the enterprise offers, manages, or delivers as a coherent outcome.
- `system`: an abstract or composite arrangement of Artefacts, which may include processes, roles, tools, information, policies, and other systems.
- `tool`: a concrete means used to achieve work, including hardware, software, applications, APIs, services, platforms, equipment, and infrastructure components.
- `data`: information digitised or structured by a tool into machine-processable form.
- `information`: meaningful content in any form, including human knowledge, documents, spoken statements, records, and conceptual descriptions.
- `event`: something that occurs or is recorded as occurring.
- `document`: a bounded representation of information.
- `source`: an origin of evidence, including documents, interviews, APIs, datasets, observations, or event streams.
- `location`: a physical, logical, organisational, or operational place.
- `asset`: something of value that is owned, managed, protected, or used.

`tool` and `system` have deliberately different meanings. A tool is a concrete means, whether physical or digital. A system is a meaningful composite or abstraction that can include tools and other Artefacts.

### Information and Data

Information and data are contextually distinct forms of meaningful content:

```text
Information
  -- digitised or structured by Tool -->
Data
  -- presented or interpreted by Tool -->
Information
```

Neither is permanently one thing. A paper instruction is information; structured extraction from it is data; a human-readable presentation of that data becomes information again.

## Foundation Predicate Vocabulary

Prefer the following predicates wherever they adequately preserve the meaning of the source.

### 1. `hasName`

A possible name by which an Artefact is known.

Example:

`Artefact A -> hasName -> "Claims"`

Names do not establish identity. An Artefact may have multiple names.

### 2. `isA`

Classification or specialisation.

Examples:

`Cyber SME -> isA -> Business Product`

`Operational Product -> isA -> Product`

Do not assume that an Artefact may have only one classification.

### 3. `partOf`

Composition, containment, or membership where the source supports that interpretation.

Example:

`Claims Handling -> partOf -> Claims`

### 4. `relatedTo`

A deliberately broad relationship indicating that two Artefacts are meaningfully connected when the source does not support a more precise foundation predicate.

Do not use `relatedTo` merely to avoid thinking about a more precise predicate.

### 5. `represents`

A representation Artefact represents another conceptual Artefact.

Example:

`Representation R17 -> represents -> Claims`

### 6. `derivedFrom`

An Artefact or Assertion was derived from another Artefact, Assertion, source, or representation.

Example:

`Assertion A -> derivedFrom -> Source Section B`

### 7. `applicableIn`

An Artefact, classification, representation, or other concept is useful or applicable within a particular Context Artefact.

Example:

`Operational Product -> applicableIn -> Operational Design`

Use this where contextual applicability belongs primarily to the Artefact or concept itself.

### 8. `sameAs`

The current understanding is that two Artefacts identify the same thing.

Use this when the source supports actual identity equivalence.

Do not weaken a supported identity assertion merely because later evidence might prove it wrong. PAMELA supports subsequent correction and supersession.

Do not use `sameAs` merely because two concepts are similar.

### 9. `supports`

One Artefact enables, supports, or materially contributes to another.

Example:

`Salesforce Platform -> supports -> Underwriting`

Use only where "support" adequately represents the source meaning.

### 10. `owns`

Accountability or ownership where the source genuinely supports ownership rather than mere participation, operation, or involvement.

Example:

`Claims Director -> owns -> Claims Product`

Do not infer ownership merely because a person or team performs work.

### 11. `withInContext`

A special contextual Assertion used primarily between an Assertion Artefact and a Context Artefact to narrow the scope within which that Assertion should be understood.

Examples:

`[X sameAs Y] -> withInContext -> Board Planning`

`[Claims isA Operational Product] -> withInContext -> Claims Operating Model`

Use `withInContext` where the Assertion itself is context-dependent.

This differs from `applicableIn`, which may express that an Artefact or concept is generally useful or applicable in a context.
