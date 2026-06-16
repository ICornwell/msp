# Identifier Governance One-Pager

## Purpose
This note defines why the platform uses both domain-based and namespace-based identifiers, and how they work together without being conflated.

## Core Principle
The platform intentionally separates:
1. Governance identity (ownership and accountability)
2. Runtime identity (operational grouping and routing)

This prevents platform instability during business reorganizations while preserving clear business ownership.

## Two Identifier Systems

### 1) Governance Identity: Domain/Product Resource IDs
Use for business ownership, policy alignment, and lifecycle governance.

Characteristics:
- Versioned resource identifiers
- Optional variant names for jurisdiction/compliance/customer-sector differences
- Explicitly tied to ownership boundaries and authority

Primary hierarchy:
- Business Product -> Business Service -> Business Information

What changes over time:
- Domain and product structures may change during business restructuring
- Versions and variants capture those changes deliberately

### 2) Runtime Identity: Namespace Taxonomy
Use for service discovery, operational grouping, and dispatch/routing.

Characteristics:
- Lightweight categorization utility
- Not versioned as an ownership unit
- Intended to remain stable through business org changes

Primary hierarchy:
- Operational Product -> Operational Service -> Operational Feature -> Operational Data

What changes over time:
- Namespace classification can evolve for technical organization
- Should not be used as a proxy for business accountability

## Decision Rules
Apply these rules consistently:

1. Use domain/product identifiers when the concern is ownership, governance, compliance accountability, or business lineage.
2. Use namespace when the concern is runtime grouping, routing, discovery, execution, or platform operability.
3. Do not use namespace to imply ownership.
4. Do not require namespace changes because a business domain restructured.
5. Do not require operational service rewrites because product ownership changed.

## Mapping Strategy (Business to Operations)
Business capability realization is handled by explicit mappings, not identifier overloading.

Mapping model:
- Business Product/Service -> matching rules -> Operational Product/Service/Feature/Data

Matching inputs:
- Resource/version ranges
- Variant names
- Policy/context constraints

Resolution goal:
- Select the right operational capability for the business product version/variant
- Reuse existing operational capabilities where possible
- Introduce new operational capabilities only when necessary

## Why This Matters
This design addresses a common real-world failure mode:

- If IT mirrors org charts directly, reorganizations cause expensive system churn.
- If IT ignores business structure entirely, ownership accountability becomes unclear.

This platform approach provides both:
- Stable technical runtime architecture
- Traceable business ownership and governance

## Practical Guidance for Teams
Before introducing or changing an identifier, ask:

1. Is this about ownership/governance or runtime execution?
2. If ownership/governance: use versioned domain/product resources.
3. If runtime execution: use namespace-based operational taxonomy.
4. If both are needed: keep both fields and connect them via mapping metadata.

## Current Platform Status
Business-product governance structures are emerging and not yet fully represented everywhere.

Near-term expectation:
- Continue strengthening mapping/version/variant resolution so new business products (or versions/variants) can compose existing operational capabilities.
- Keep operational services/features/data decoupled from business-org mutations.
- Re-align business ownership via versioned mapping changes instead of technical rewrites.
