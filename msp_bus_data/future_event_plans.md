# Future Event Plans

## Core Principle

Data change events are not business events.

The event stream should describe meaningful domain facts, not low-level persistence behavior.
That distinction is critical if downstream reporting, analytics, and integrations are going to remain understandable and stable.

Good business events describe things like:

- customer onboarded
- policy activated
- account status changed
- document approved
- workflow completed

Bad event shapes for the main stream include things like:

- vertex inserted
- edge deleted
- row updated
- field patched

Those may still be useful for internal diagnostics, but they should not become the core business event contract.

## Role of msp_bus_data

`msp_bus_data` should act as the initial receiver for business events emitted by applications.

Those events should be allowed to reference the same transaction token used for graph updates.
That makes it possible to coordinate event visibility with transaction outcome.

## Desired Flow

1. client begins a transaction with a purpose string and receives a transaction token
2. client sends graph updates with that token
3. client also sends business events with that same token
4. `msp_bus_data` validates the token and stores those events as a prepared batch
5. the graph transaction is committed or rolled back
6. after commit is confirmed, the prepared event batch is released to the pub/sub system
7. if rollback is confirmed, the prepared event batch is discarded

The important rule is that business events must not be externally published before the underlying transaction outcome is known.

## Transaction Metadata

Transactions should carry more than an opaque reference.

Planned metadata to associate with a transaction includes:

- `purpose`: a human-readable explanation of why the transaction was opened
- `workContext`: the signed or tokenized work identity once the Work service exists

The immediate next step is `purpose`.
That should be provided at begin-transaction time and stored with the transaction so event batches and history views can be explained later.

The later step is `workContext`.
That should arrive via signed service-to-service headers and be captured alongside the transaction once the Work service is available.

## Avoid Classic 2PC Thinking

Two-phase commit style coordination still has nasty failure modes.
The safer model here is closer to a transactional outbox with recovery-aware release logic.

That means:

- prepare events before DB commit
- do not publish yet
- commit the DB transaction
- after commit, mark the prepared batch eligible for release
- publish the batch
- if publish fails or the process crashes, recover and retry later

This gives durability and observability around the awkward middle state where the database may have committed but publication is uncertain.

## Batch State Model

Prepared event batches should have an explicit lifecycle.

Suggested states:

- `prepared`: accepted and stored, not yet safe to publish
- `committed_pending_release`: transaction commit confirmed, waiting to publish
- `released`: successfully handed to the pub/sub transport
- `discarded`: invalidated because rollback was confirmed or the batch was otherwise cancelled

Avoid vague implicit states.
Operational recovery depends on being able to inspect a batch and know exactly what the system believes should happen next.

## Recovery Model

Recovery logic should periodically inspect unreleased batches and reassess the authoritative transaction state.

Examples:

- if the batch is `prepared` and the transaction is still open, leave it alone
- if the batch is `prepared` and the transaction was rolled back, discard it
- if the batch is `prepared` and the transaction actually committed, promote it to `committed_pending_release`
- if the batch is `committed_pending_release`, retry release

This matters because failures can happen between any two steps.

The main dangerous case is:

- DB commit succeeds
- event release is attempted
- process crashes before success is recorded

The design must assume this can happen and make recovery deterministic.

## At-Least-Once Delivery

Consumers should explicitly be expected to handle at-least-once delivery.

That means duplicates are not a bug in the subscriber contract.
They are part of the delivery model.

Because of that, published events should carry stable identifiers and idempotency metadata.

Recommended envelope fields:

- `eventId`
- `batchId`
- `transactionId`
- `transactionPurpose`
- `workContext`
- `eventType`
- `schemaVersion`
- `occurredAt`
- `producer`
- `businessKeys`
- `payload`

Subscribers should de-duplicate using `eventId` or another stable idempotency key.

## Operational Expectations

The system should make stuck or uncertain batches visible.

Operators should be able to answer:

- which batches are still prepared
- which batches are waiting for release
- which batches were discarded
- which batches have been retried repeatedly
- which transaction each batch belongs to

If that visibility is missing, recovery becomes guesswork.

## Design Discipline

This only works well if event semantics remain disciplined.

Rules to keep:

- publish domain events, not storage implementation details
- do not leak internal graph mutation chatter into the business event stream
- keep event schemas versioned and explicit
- make retries normal and safe
- make duplicates acceptable to consumers
- make prepared-but-unreleased batches durable and inspectable

## Follow-on Work

- define the begin-transaction purpose contract
- persist purpose with transaction-linked event batches
- define how Work context headers are validated and attached to transactions
- define the business event envelope
- define the prepared batch persistence model
- define the batch state machine and allowed transitions
- add transaction-state reassessment logic for recovery
- define release retry policy and backoff rules
- define discard rules for rollback and expiry
- define subscriber idempotency expectations
- choose the pub/sub transport and release adapter shape