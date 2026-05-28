# Core Type and Link Matrix

This is the MVP platform core model owned by msp_actorwork.

Design intent:

- Keep core categories and link semantics stable and small.
- Allow domain modules to add named variants that extend core categories.
- Keep core semantics directional and enforceable.

## Core actor types

Entity actor types:

- user
- system

Group actor types:

- team
- group
- division
- branch
- organization

## Core work types by tier

Tier 1 (long-term enduring records):

- file
- resource

Tier 2 (long-running, many concurrent actors):

- case
- job
- process

Tier 3 (single-concurrent grouping/orchestration):

- taskGroup

Tier 4 (short-running, single-actor):

- task

## Core links

Actor-to-actor links:

- isMemberOf
- isSubsetOf
- underAuthorityOf

Actor-to-work links:

- creates
- changes
- closes

Work-to-work links:

- contributesTo

## Allowed link matrix

| Link | From | To | Purpose |
|---|---|---|---|
| isMemberOf | actor | actor | membership semantics |
| isSubsetOf | actor | actor | structural hierarchy semantics |
| underAuthorityOf | actor | actor | governance/authority semantics |
| creates | actor | work | work origination semantics |
| changes | actor | work | work mutation semantics |
| closes | actor | work | work completion semantics |
| contributesTo | work | work | dependency/progress semantics |

## Core invariants

1. Core types and core links are versioned and owned by msp_actorwork.
2. Link semantics are directional and cannot be treated as symmetric by default.
3. Tier meaning is semantic, not cosmetic:
   - Tier 1 outlives active work.
   - Tier 2 coordinates ongoing multi-actor effort.
   - Tier 3 handles grouped/sequential/approval-oriented steps.
   - Tier 4 is short-running and single-actor.
4. New platform behavior should prefer existing links before adding new link kinds.

## Domain variants

Domain modules add variants by declaring:

- namespace
- variant name
- which core type it extends
- optional extra rules and behavior

Namespace rules:

- module domain is required
- module product is optional
- together they form the variant namespace key

Rules:

1. Variants are additive.
2. Variants must not weaken core safety invariants.
3. Variant-specific rules are enforced in domain modules, while core validity is enforced centrally.
4. Only features in the declaring module may add, change, or remove instances using that module's declared type variants.

## Variant ownership rule

Every declared variant should carry an ownership rule:

- declaring module namespace
- optional product namespace
- actor or work category
- owning feature ids
- mutation rule: declaring-module-only

This gives the platform a clear answer to: who is allowed to create or mutate entities of this variant?

## Link prototypes

In addition to creating concrete actor/work to actor/work links, the platform should support prototype links declared against:

- actor/work-typeVariant -> actor/work
- actor/work -> actor/work-typeVariant
- actor/work-typeVariant -> actor/work-typeVariant

Purpose of link prototypes:

- predefine short and long names
- predefine icons and descriptions
- declare purpose
- attach feature-permissions and data-entitlements
- attach work-objectives
- optionally define static attributes to stamp onto concrete links
- optionally define activity hooks to run on link create, change, or remove

This means a domain module can declare not just a new variant, but the expected semantic links that instances of that variant will usually create.

## Prototype execution model

When a concrete link is created from a matching prototype:

1. Prototype metadata is resolved by namespace + link type + endpoint match.
2. Static attributes are copied into the persisted link record.
3. Any configured onCreate hooks may run.
4. Later changes/removals may invoke onChange/onRemove hooks.

Hooks may be:

- pure metadata declarations for later processing
- activity names that the platform invokes when the concrete link lifecycle event occurs

The important boundary is that hooks extend behavior, but should not bypass core link validity rules.

## AWS example variants

Actor variants:

- awsOperator extends user
- awsInventoryScheduler extends system
- awsPlatformTeam extends team

Work variants:

- awsAccountResource extends resource
- awsInventoryCase extends case
- awsInventoryTaskGroup extends taskGroup
- awsListEksClustersTask extends task

These variants still use core links such as creates, changes, closes, and contributesTo.

They may also declare prototype links, for example:

- awsOperator -> awsInventoryCase using creates
- awsSecurityReviewer -> awsAccessReviewProcess using changes/closes
- awsListEksClustersTask -> awsInventoryTaskGroup using contributesTo
