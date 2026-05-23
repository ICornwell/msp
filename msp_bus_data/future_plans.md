# Future Plans

## Direction

The graph-backed document store is now doing something very different from a normal ORM or ERM system.
It is optimized for transactional graph updates, immutable history, snapshot reads, and auditability.

That gives the application layer strong capabilities, but it also means the primary store is not intended to be the friendly reporting surface for SQL-heavy consumers.

## Planned Route: get_object_history

We plan to add a `get_object_history` route that returns all historic versions for a single `originalId`.

Primary goal:

- allow UI screens to show how an individual object changed over time
- allow field-level history views for audit and explainability
- support investigation of who changed what and when

Expected behavior:

- input will identify a single `originalId`
- response will return the ordered historic values for that object
- the UI can then derive per-field history timelines from the returned versions
- transaction purpose values should be available alongside the historical versions so the UI can show why a change happened, not just what changed

This route is meant for operational history and traceability, not bulk analytics.

## Transaction Purpose

When a client begins a transaction, it should provide a `purpose` string.

This will usually be generated automatically by the application, but it should also allow user-authored notes where that makes sense.

Planned behavior:

- `begin_transaction` accepts a required `purpose` string
- the purpose is stored in the transaction vertex `content` JSON
- history views can show the purpose next to the values changed under that transaction
- transaction purpose becomes part of the audit and explainability model

This is small in code footprint but high value in practice because it gives transaction history human meaning.

## Future Work Context

The next major contextual model is `Work`.

MSP ties most permissions to a user's relationship with work, so work context should become a first-class part of service-to-service interaction.

Planned direction:

- work context will be signed or tokenized
- work context will be included in service-to-service call headers
- once the Work service is in place, transactions should also store the resolved work context
- transaction history should eventually show both purpose and work context together

That will allow transaction history to answer both:

- why this happened
- under which work relationship or authority it happened

## Reporting Strategy

The graph database should remain the operational system of record for document and relationship state.
It should not become the direct reporting model for every downstream use case.

That is intentional.

Report writers and SQL-first consumers will usually want:

- flattened business facts
- stable reporting schemas
- denormalized summary views
- analytics-friendly time series and aggregates

Those needs are better served by business events and derived read models than by querying the transactional graph store directly.

## Business Events

Applications using this platform should emit business events describing meaningful domain actions.

Examples:

- customer created
- policy updated
- address changed
- document approved
- workflow completed

These events should become the input stream for downstream reporting and analysis projections.

## Role of msp_bus_data

`msp_bus_data` will be the initial receiver of business events.

It will also understand transaction tokens so events can be associated with the same logical transaction as the graph writes.

Planned flow:

1. client begins a transaction and receives a transaction token
2. client sends writes and business events referencing that token
3. `msp_bus_data` validates the token and caches the events as pending
4. if the transaction rolls back, pending events are discarded
5. if the transaction commits, pending events are released to the configured pub/sub system
6. downstream subscribers build reporting and analysis views from that committed event stream

This keeps reporting consumers aligned with committed business truth rather than in-flight transactional state.

## Why This Matters

This separation gives us:

- strong transactional behavior in the graph store
- a clear audit trail for object history
- safer client interaction through opaque transaction tokens
- reporting pipelines based on committed business meaning
- freedom to evolve reporting models without distorting the operational data model

## Follow-on Work

- add `purpose` to `begin_transaction` and store it in transaction vertex content
- include transaction purpose in object-history responses
- define the signed/header-based Work context contract
- store Work context against transactions once the Work service exists
- add `get_object_history` route in the graph-facing application layer
- define the event envelope shape for `msp_bus_data`
- add pending-event storage keyed by transaction token
- release cached events only on confirmed commit
- discard cached events on rollback or expiry
- connect committed events to the chosen pub/sub transport
- build subscriber-side projection services for reporting and analytics