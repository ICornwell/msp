# Reference Data Transport: TDD Plan

## Purpose

Allow a finite View payload to refer to the same Artefact or Assertion through multiple branches without duplicating the object content, creating duplicate vertices, or requiring cyclic Go object graphs.

This is a platform data-transport capability. It is needed by PAMELA soon, but must remain generic and understandable for all modules.

## Design Principles

- Keep the Node-to-Go transport ordinary JSON.
- Keep the `View` declaration rich but acyclic. It retains schemas and declared relation metadata, but never includes live `relatedObject` pointers or runtime functions.
- Do not rebuild cyclic object identity inside BusData.
- A first full occurrence is the only occurrence whose content is diffed.
- Later appearances are explicit references. They are used to build or compare edges, not to create, update, or delete vertices.
- Keep the protocol small, reserved, and self-describing.
- Fail descriptively on an unresolvable reference. Never silently create a new vertex from a reference.

## Transport Contract

A full object is sent normally. Every later occurrence of the same object in the outgoing View data is a reference stub:

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

Not every field is required in every state:

- `object` is required. It identifies the declared View object type.
- `tmpId` resolves a first full occurrence in the same request.
- `entityId` resolves an existing persisted entity.
- `businessKey` provides a stable identity where the caller or prepare-data step has not resolved an entity ID.

Resolution precedence is:

1. `entityId`
2. `tmpId`
3. `(object, businessKey)` through the existing-entity resolution path

A reference stub is not an object occurrence for content-diff purposes and must not receive a generated `__tmpId`.

## Responsibilities

### DataCommon

1. Walk outgoing View data with an identity map.
2. Emit the first appearance of each object as a normal full object.
3. Emit later appearances as `__mspReference` stubs.
4. Preserve the first object unchanged for ordinary View processing.
5. Perform this only on the DataCommon-to-BusData request boundary.

### BusData

1. Recognise `__mspReference` before calling normal object traversal or temporary-ID generation.
2. Resolve the stub using the precedence rules above.
3. Skip vertex addition, update, and delete processing for the reference itself.
4. Process the View relation from the parent to the resolved target as an edge operation.
5. Use normal edge-diff/removal behaviour so an omitted reference-derived edge can be removed without deleting the referenced entity.

### TechData

No changes. It continues to receive only abstract add/update/delete vertices and edges.

## Test-First Delivery Plan

### Phase 1: Define and Test DataCommon Encoding

Add isolated TypeScript tests for a transport preparation helper.

1. A tree with no repeated object references is unchanged.
2. A shared object appears in full at its first location and as an `__mspReference` stub at its second location.
3. A self-cycle is reduced to one full object plus one reference stub without recursion failure.
4. Existing entities preserve `entityId` in their reference stubs.
5. New entities preserve the first occurrence `tmpId` in later reference stubs.
6. The outgoing structure can be passed to ordinary `JSON.stringify`.
7. The helper does not mutate the caller's original view data.

Acceptance: DataCommon can produce finite, ordinary JSON for cyclic/shared in-memory data.

### Phase 2: Teach BusData to Recognise References

Add Go tests before production changes in the document-to-graph conversion path.

1. A reference stub is recognised and is not assigned a `__tmpId`.
2. A reference with a known request-local `tmpId` resolves to the first full object.
3. A reference with a known persisted `entityId` resolves to that existing graph vertex.
4. A reference with no usable identity returns a descriptive `UNRESOLVED_REFERENCE` error.
5. A reference to a different object type than the declared View element returns a descriptive validation error.

Acceptance: references are safe traversal terminals, not malformed data objects.

### Phase 3: Generate Edges for References

Extend the existing `docToGraph` tests.

1. Repeated new object: one added vertex and edges from both parents to the retained temporary ID.
2. Repeated existing object: no added vertex and every expected edge targets its persisted entity ID.
3. Forward relation uses the resolved reference target as `to`.
4. Back relation uses the resolved reference target as `from`.
5. Both declared directions produce both expected edges.
6. A cycle such as `A -> B -> A` produces two vertices and two edges, then terminates.

Acceptance: shared/cyclic View data produces correct graph connectivity without duplicate vertices.

### Phase 4: Diff and Removal Semantics

Exercise the first/full occurrence and later/reference occurrences across an existing graph.

1. Changed first occurrence plus later references results in exactly one vertex update and all required edges.
2. Unchanged first occurrence plus later references results in no vertex update and all required edges.
3. A new relationship to an existing reference produces only an edge add.
4. Removing a reference-derived relationship removes only the view-managed edge.
5. Removing a reference never deletes the referenced entity.
6. A duplicated reference does not create duplicate edge operations.

Acceptance: vertex identity/content and relationship presence remain independent concerns.

### Phase 5: Read-Side Deduplication

Keep BusData graph-to-document output tree-shaped for compatibility. Add an optional DataCommon/client helper for graph-oriented callers.

1. Repeated output copies with the same persisted `id` or `__entityId` can be rehydrated into shared JavaScript object references.
2. The helper is opt-in; plain render-tree callers retain ordinary duplicated output objects.
3. Cycles rehydrated by the helper can be carried through JavaScript-only transport using `flatted`.
4. The helper does not alter data with no repeated identity.

Acceptance: UI or module code can opt into object identity without requiring Go to create cyclic maps.

## Implementation Boundaries

Keep the production code limited to:

- one DataCommon transport-preparation helper
- one BusData reference recogniser/resolver
- a small extension to the existing document-to-graph edge generation path
- one optional DataCommon read-side identity rehydrator

Do not add per-module reference code, special PAMELA branches, global mutable identity registries, or recursive Go object reconstruction.

## Deferred Work

This work is independent from, and must not be conflated with:

- platform-wide `prepareData` lookup/conflict policies for apparent-new entities
- recursive View declaration execution using recursive CTEs
- recursive graph-to-document walkers
- external OpenAPI/API Experience Factory projections

The protocol must work with the present finite View declarations first. Recursive View execution can use the same reference contract later.
