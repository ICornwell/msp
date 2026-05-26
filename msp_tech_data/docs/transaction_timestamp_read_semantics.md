# Transaction and Timestamp Read Semantics

This note captures the current docgraph behavior for transaction lifecycle, timestamped reads, and read-committed filtering.

## Model Summary

- A transaction is a vertex in `docgraph.vertices` with `__label = '__transaction'` and `id = transaction_id`.
- Writes carry `__transactionId` and `__timeStamp`.
- Commit is represented by inserting an edge in `docgraph.edges` with `__label = '__committed'` and `from_id = transaction_id`.
- Read paths treat data as committed when the corresponding transaction has that commit edge.

## Timestamp Behavior

- `process_update` resolves `effective_timestamp` from the transaction vertex timestamp when available.
- This keeps all rows in the same unit of work aligned to one transaction-start timestamp.
- Snapshot reads (`timeStamp > 0`) query at or before the requested timestamp.
- Latest reads (`timeStamp <= 0`) use latest-version logic plus read-committed fallback checks.

## Read-Committed vs Read-Uncommitted

Code path: `src/db/graph_query.rs`.

- `read_uncommitted = true`: returns raw in-flight results (used so a writer can read its own uncommitted writes).
- `read_uncommitted = false`:
  - query graph data,
  - collect transaction IDs from returned vertices/edges,
  - check commit state of each transaction,
  - if any transaction is uncommitted, fallback to `transaction_timestamp - 1` and retry,
  - repeat until result only references committed transactions.

This is the key safeguard for cases where latest-version SQL still allows uncommitted newly-created rows to appear.

## Rollback Behavior (Current)

Code path: `src/db/graph_transaction.rs`.

- Rollback runs inside one DB transaction.
- It inserts a `__rolledBack` edge and then deletes staged rows for that `__transactionid`,
  excluding the transaction vertex itself.
- It also preserves the self-referencing rollback marker edge, leaving an explicit
  audit/debug trace that the transaction was rolled back.

Implication:

- `rollback_transaction` returns a rolled-back response to the caller.
- Later state detection by marker lookup can rely on a durable `__rolledBack` edge for that transaction.

## Known Debugging Focus

When debugging intermittent committed/uncommitted test failures, verify these together:

- transaction lifecycle ordering: begin -> update -> commit/rollback,
- timestamp assignment consistency (`effective_timestamp`),
- read mode in the caller (`read_uncommitted` vs committed path),
- fallback loop behavior in `read_data`,
- assumptions about rollback marker persistence.

## High-Signal Tests

- `tests/integration_tests.rs` `test_query_snapshot_at_timestamp`
- `tests/integration_tests.rs` `test_query_read_committed_fallback_when_latest_uncommitted`

These cover timestamped snapshots and committed fallback when latest visible data includes uncommitted writes.
