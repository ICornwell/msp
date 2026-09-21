# Internally Shared References (ISR) Data Helper

## What ISR Means

ISR means **internally shared references**. It is not conventional reference data such as pick-list values, code tables, or enumerations.

ISR allows one View payload to mention the same Artefact or Assertion through multiple branches without repeating its full content or creating duplicate graph vertices.

## Transport Shape

The first occurrence of an object is sent in full. Later occurrences use a reference stub:

```json
{
  "__mspReference": {
    "object": "pamelaAssertion",
    "tmpId": "new-object-temporary-id",
    "entityId": "existing-entity-id",
    "businessKey": "stable-business-key"
  }
}
```

The fields have distinct meanings:

- `object`: the declared View object type; required for validation.
- `id`: the current persisted version ID when a version-specific reference is required.
- `tmpId`: identifies a first full occurrence in the same request.
- `entityId`: identifies an existing persisted entity.
- `businessKey`: supports explicit identity resolution when an entity ID is not yet available.

Identity is not the same as version. For an Entity, `__entityId` is stable across versions; `id` identifies the current version; and `__originalId` carries the first version ID through the lifecycle. A Value Object normally has its own `id` but carries the owning Entity's `__entityId` as lifecycle context.

Resolution precedence is:

1. Entity `entityId` / `__entityId`
2. Value-object `id`
3. request-local `tmpId`
4. explicitly resolved `(object, businessKey)`

An ISR stub is a reference, never a new object. It must not receive a generated `__tmpId`.

## Layer Responsibilities

### DataCommon

DataCommon prepares the Node-to-Go request:

- walks the finite View data with an identity map;
- emits the first occurrence in full;
- emits later occurrences as ISR stubs;
- preserves ordinary JSON transport;
- does not send live JavaScript object pointers or runtime DomainObject functions to BusData.

### BusData

BusData receives ordinary JSON and uses the View declaration plus ISR identities to build graph operations:

- the first full occurrence is eligible for vertex diffing;
- an ISR stub is a traversal terminal;
- an ISR stub is resolved to a request-local or persisted target;
- the stub itself produces no vertex add, update, or delete;
- the parent-to-target relationship is still processed as an edge;
- unresolved or ambiguous references must fail explicitly.

### TechData

TechData does not know about ISR, Views, schemas, or business definitions. It receives only abstract vertices, edges, transactions, and technical metadata.

## Diff Semantics

ISR affects structure, not object content.

| New occurrence | Current occurrence | Behavior |
|---|---|---|
| full object | full object | compare content and structure |
| full object | ISR reference | compare the full object to the known identity; do not compare reference metadata as content |
| ISR reference | full object | do not create a vertex-content update; reconcile the relationship |
| ISR reference | ISR reference | compare identity and reconcile the relationship |

For arrays, matching uses the object identity available in the occurrence: persisted ID, request-local temporary ID, or resolved business key with object type.

## Edge Semantics

If an ISR reference appears in the new View structure, its declared parent relation must be represented as an edge to the resolved target.

If a previously present relationship disappears:

- for an Entity, or when `delinkOnRemoval` is true, create or reuse an update for the ViewData parent and add the raw graph edge ID to `ViewManagedEdges`;
- for a value object with `delinkOnRemoval` false, add the old value object to the delete set;
- never delete an existing referenced Entity merely because one View branch no longer includes its edge.

The existing `handleRemoval` path is the intended home for parent updates, managed-edge removal, and value-object deletion. ISR should feed it identity-resolved objects rather than introduce a parallel removal mechanism.

## Examples

### Repeated New Object

```text
A -> B (full, tmpId=B-1)
C -> B (ISR, tmpId=B-1)
```

Result:

- one new vertex for `B`;
- an edge from `A` to `B`;
- an edge from `C` to `B`.

### Existing Entity

```text
A -> B (ISR, entityId=B-existing)
```

Result:

- no new vertex for `B`;
- an edge from `A` to the existing `B` entity.

### Cycle

```text
A -> B (full, tmpId=B-1)
B -> A (ISR, tmpId=A-1)
```

Result:

- finite vertex processing;
- no recursive Go object reconstruction;
- both graph edges are emitted.

## Implementation Boundaries

Keep production logic small and centralised:

- one DataCommon ISR preparation helper;
- identity helpers in BusData JSON handling;
- one ISR terminal branch in document-to-graph traversal;
- existing diff and removal paths reused for content and edge lifecycle.

Do not add PAMELA-specific ISR branches, global mutable identity registries, or cyclic Go maps.

## Testing Expectations

Tests should cover:

- ordinary repeated full objects;
- repeated new objects using `tmpId`;
- references to existing entities using `entityId`;
- full/reference and reference/full transitions;
- cycles;
- parent updates with multiple managed-edge removals;
- Entity and value-object removal behavior;
- unresolved and ambiguous references;
- no duplicate vertices, updates, deletes, or edge operations.

The canonical TDD plan is [isr_data_transport_tdd_plan.md](../isr_data_transport_tdd_plan.md).
