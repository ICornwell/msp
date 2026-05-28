# AWS Variant Mapping to ActorWork Core Types

This document maps msp_aws concepts onto msp_actorwork core types and links.

Reference core model:

- msp_actorwork/docs/core-type-and-link-matrix.md
- msp_actorwork/src/data/core/coreTypeAndLinkModel.ts

## Actor variants

| AWS Variant | Core Type | Notes |
|---|---|---|
| awsOperator | user | Human operator triggering or approving AWS work |
| awsSecurityReviewer | user | Human security approver |
| awsInventoryScheduler | system | Scheduled automation executor |
| awsPlatformTeam | team | Owning group for account/region scope |
| awsOrganization | organization | Top governance boundary |

## Work variants

| AWS Variant | Core Type | Tier | Notes |
|---|---|---|---|
| awsAccountResource | resource | 1 | Long-lived account boundary record |
| awsConnectionProfileFile | file | 1 | Enduring connection profile record |
| awsInventoryCase | case | 2 | Long-running discovery/review effort |
| awsAccessReviewProcess | process | 2 | Long-running approval process |
| awsInventoryTaskGroup | taskGroup | 3 | Grouping for sequential approvals and execution |
| awsListEksClustersTask | task | 4 | Single-actor short-lived execution task |
| awsListEcrRepositoriesTask | task | 4 | Same pattern for ECR inventory |

## Link mapping

Actor-to-actor:

- awsOperator isMemberOf awsPlatformTeam
- awsPlatformTeam underAuthorityOf awsOrganization

Actor-to-work:

- awsOperator creates awsInventoryCase
- awsSecurityReviewer changes awsAccessReviewProcess
- awsSecurityReviewer closes awsAccessReviewProcess
- awsInventoryScheduler creates awsListEksClustersTask

Work-to-work:

- awsListEksClustersTask contributesTo awsInventoryTaskGroup
- awsInventoryTaskGroup contributesTo awsInventoryCase
- awsAccessReviewProcess contributesTo awsInventoryCase

## Variant ownership

For AWS-declared variants:

- namespace is aws
- optional product may refine the namespace later
- only aws module features may add/change/remove entities using aws-declared variants

That keeps variant semantics owned by the declaring module, rather than allowing arbitrary cross-module mutation of aws-specific meanings.

## Prototype links

AWS should be able to declare prototype links either in manifests or via an AWS-owned feature.

Useful prototype examples:

1. awsOperator creates awsInventoryCase
Prototype metadata:
- shortName: Request inventory
- purpose: request a scoped read-only inventory run
- feature-permissions: aws.inventory.request

2. awsSecurityReviewer closes awsAccessReviewProcess
Prototype metadata:
- shortName: Approve scope
- purpose: approve account/region access scope
- data-entitlements: aws.account.read, aws.region.read

3. awsListEksClustersTask contributesTo awsInventoryTaskGroup
Prototype metadata:
- shortName: Cluster scan
- purpose: collect EKS inventory data
- work-objectives: discover clusters, normalize results, attach audit trace

Prototype hooks may also point at activities, for example:

- onCreate: aws/prepareInventoryExecution/1.0.0
- onChange: aws/reviewInventoryExecution/1.0.0
- onRemove: aws/revokeInventoryExecution/1.0.0

These should remain additive lifecycle behavior, not a way around the core actor/work/link rules.

## Runtime implications for aws/listEksClusters/1.0.0

1. Execution must be attached to a task variant (awsListEksClustersTask).
2. The task should contributeTo a taskGroup or case for traceability.
3. The creating/changing/closing actor links should be recorded for audit.
4. The target account/region should be represented by tier-1 resource/file variants.
5. If a matching prototype link exists, its metadata and hooks should be applied during concrete link lifecycle events.

## Minimal payload anchors (still flexible)

Payload shape can stay flexible, but these anchors should be present when possible:

- actorRef
- workRef
- parentWorkRef
- targetAccountId
- targetRegions
- purpose

Keeping these anchors allows model-driven behavior while retaining iteration freedom on full payload schema.
