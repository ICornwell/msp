# MSP Indexing Strategy

## Purpose

MSP should use indexing to make useful questions fast without turning derived indexes into a second source of business truth.

The authoritative model remains the platform’s transactional, versioned graph of identities, relationships, content, context, and history. Indexes are derived structures that accelerate particular questions and may be deliberately stale when the business purpose allows it.

```text
Authoritative graph and history
  -> derived technical and business indexes
  -> fast discovery, worklists, threshold lists, and curiosity searches
```

This strategy supports incremental delivery: build only the indexes justified by real query patterns, with a clear freshness contract and an authoritative fallback.

## The Core Distinction

There are two broad classes of indexes.

### System indexes

System indexes support fixed platform mechanics and may be highly specialized in PostgreSQL or other TechData-owned structures.

Examples include:

- current-version / non-superseded Entity lookup;
- `supersededBy` lifecycle state;
- Entity write locks;
- edge locks;
- transaction membership and transaction state;
- Actor identity and membership;
- Work context and access-policy lookup;
- technical lineage and audit correlation.

These are not ordinary business relationships merely because they may be represented as technical vertices or edges in history. Their semantics are fixed enough to justify dedicated tables, partial indexes, joins, or mutable current-state projections.

### Business indexes

Business indexes are requested by higher-level feature or business-integrity modules for particular purposes.

Examples include:

- worklists;
- threshold-breach lists;
- candidate identity matches;
- related Artefact discovery;
- policy/risk intersections;
- contextual Assertion retrieval;
- full-text search;
- similarity or embedding search;
- domain-specific operational projections.

Business indexes should be derived from committed authoritative data and should declare their intended query purpose and freshness tolerance.

## Query Purposes

An index is acceptable only relative to the purpose for which it is used.

### Curiosity and discovery

The user is exploring, finding candidates, or asking what might be relevant.

Examples:

- similar risks;
- related policies or products;
- prior cases with comparable characteristics;
- Assertions that may support or contradict a position;
- connected processes, tools, controls, and owners.

These searches can usually tolerate bounded staleness. A result that was correct ten seconds ago may remain useful as a candidate, provided the interface makes its projection status clear.

### Worklists and threshold-breach lists

A worklist is a derived operational projection, not necessarily an authoritative current-state report.

It may show:

- a new breach slightly late;
- a resolved breach briefly after resolution;
- a recently assigned item after the index catches up.

That is acceptable when the user is being given a candidate workload and the authoritative record is checked before consequential action.

### Operational dashboards

Dashboards may use bounded staleness when the freshness timestamp is visible and the purpose does not require transaction-perfect state.

### Policy evaluation and transaction mutation

A stale index may be used to find candidates, but it must not silently authorize a mutation.

The platform should:

1. use the index to find candidates;
2. read authoritative current state;
3. re-evaluate the applicable business-integrity rules;
4. commit only if the authoritative state still permits the operation.

### Audit and compliance

Audit, regulatory, and historical answers require an authoritative snapshot or historical query. A convenience index must not be treated as the evidence source unless its provenance and source watermark are explicitly sufficient for that purpose.

## Freshness Contracts

Every business index request should declare a freshness policy, conceptually similar to:

```ts
type FreshnessPolicy = {
  maxStalenessMs: number;
  requireAuthoritativeCheck?: boolean;
  fallbackToAuthoritative?: boolean;
  snapshotTimestamp?: number;
};
```

The policy belongs with the business query or integrity rule, not as an accidental property of the index implementation.

An index should expose metadata such as:

```text
index definition and version
source watermark
last indexed vertex/transaction timestamp
last successful maintenance time
status
last error
isAuthoritative: false
```

The basic freshness test is:

```text
now - index.lastMaintainedAt <= policy.maxStalenessMs
```

For stronger consistency, compare the query’s required snapshot or source watermark with the index watermark.

If an index is too stale:

- use an authoritative fallback;
- return a clear degraded/freshness result;
- or reject the query if its purpose requires current state.

Never silently use a stale index for a correctness-sensitive decision.

## Build and Maintenance Lifecycle

Business indexes should have an explicit lifecycle:

```text
requested
  -> building
  -> complete at source watermark W
  -> maintained asynchronously
  -> stale or invalidated
  -> rebuilding
```

A newly requested index should not be used until its initial build is complete and its source watermark is recorded.

After completion, asynchronous maintenance can process committed changes. A failed maintenance run should mark the index stale or degraded rather than pretending it is current.

The authoritative graph remains usable while an index is building, stale, or unavailable.

## Synchronous and Asynchronous Work

### Synchronous system structures

Structures required for correctness-sensitive platform operations should be maintained synchronously with the authoritative transaction, or within the same technical transaction where appropriate.

Examples:

- current Entity/version state needed to prevent invalid writes;
- lock state;
- transaction state;
- security and Actor/Work lookups required for an access decision.

### Asynchronous business indexes

Derived discovery and operational indexes should normally be built or maintained asynchronously after committed writes.

Examples:

- worklists;
- threshold projections;
- full-text indexes;
- embedding/vector indexes;
- expensive intersection projections.

This keeps the main write path predictable and allows large indexes to be rebuilt or reprocessed independently.

## Ownership by Platform Layer

```text
Feature modules
  -> request business indexes and define query purpose

DataHub
  -> enforce data-access policy, redaction, and query authorization

BusData
  -> interpret business Views, identity, relationships, and integrity rules

TechData
  -> maintain technical current-state structures and execute optimized storage queries
```

TechData should not need to understand whether an index represents a policy, risk, claim, tool, or Assertion. It provides the technical index machinery; feature and business-integrity modules define what the index means.

Actor and Work are an important platform exception in implementation terms: their access-policy role is fixed and central enough to justify specialized technical indexes and lookup paths. Their business meaning remains governed by the platform’s security and work models.

## PostgreSQL as the Indexing Substrate

MSP can exploit PostgreSQL directly rather than introducing a separate general-purpose index product for every intersectional query.

Possible technical structures include:

- dedicated current-version tables or projections for non-superseded Entities;
- indexes on lifecycle identity, label, version, and business key;
- dedicated `supersededBy` structures rather than repeated anti-joins over ordinary business edges;
- technical lock and transaction tables or joins;
- partial indexes over current/active rows;
- property indexes for selected label/property-path combinations;
- materialized views for expensive intersection queries;
- full-text indexes;
- vector support if embeddings prove valuable.

A technical index should never become an unverified alternate source of business truth. It must carry a source watermark and retain a reliable authoritative fallback.

## Business Index Requests

A higher layer should request an index with enough information to make its purpose explicit:

```text
business owner
feature/domain
query purpose
source View or projection
fields/relationships used
freshness policy
security classification
rebuild strategy
retention policy
```

This prevents an uncontrolled collection of indexes built merely because a field exists. It also makes ownership and change impact clear when a business dictionary or View evolves.

## Intersectional Search

Many business-property searches are not exact-key lookups. They ask:

- What might be relevant?
- What else resembles this?
- What changed around this risk?
- Which connected Artefacts should be reviewed?
- Which work items may breach a threshold?

These are discovery questions and are good candidates for bounded-staleness indexes, full-text search, similarity search, and relationship projections.

The authoritative recheck boundary remains essential:

```text
index candidate selection
  -> authoritative read
  -> policy and integrity evaluation
  -> transaction mutation if still valid
```

## Security and Policy

Indexes may contain sensitive derived information. DataHub must apply access and redaction policy before returning index results. An index should not become a side channel around the Views, Actor rules, Work context, or data policies that protect the authoritative graph.

Index queries should therefore carry:

- user/service identity;
- Work context where applicable;
- requested purpose;
- freshness policy;
- data policy context.

The result should make clear whether it is authoritative or derived, and when it was last maintained.

## Vector and Embedding Indexes

Embeddings are derived search indexes, not identity mechanisms.

A vector projection should retain:

```text
Entity or Assertion identity
current version identity
business key
kind
context and provenance
source representation text
embedding model and version
embedding dimensions
indexed timestamp
source watermark
```

Similarity can find candidates, related Assertions, or useful context. It cannot decide that two Artefacts are the same, and it cannot replace business-integrity evaluation.

If vector search is introduced, it should be exposed through governed DataHub activities and maintained from committed authoritative changes.

## Failure and Recovery

Index failures should be observable and classified:

- building;
- complete;
- stale;
- degraded;
- failed;
- invalidated;
- rebuilding.

Recovery should be idempotent. A failed or stale index should either fall back to authoritative traversal or be rejected according to the freshness contract. It must never silently return old results as though they were current.

## Summary

The MSP indexing strategy is:

```text
Keep authoritative identity, relationships, history, and integrity in the platform data model.

Use specialized system indexes for fixed technical mechanics.

Let higher business layers request derived indexes for real query purposes.

Build business indexes asynchronously and record source watermarks.

Allow bounded staleness for discovery and worklists.

Recheck authoritative state before policy decisions or mutations.

Use PostgreSQL’s integrated optimizer and indexing capabilities before adding another search product.
```
