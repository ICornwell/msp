# AWS MVP Actor/Work + Access Model

This document plans the first AWS slice across two tracks in parallel:

1. Product interaction track: how actors use AWS activities.
2. Security and purpose track: how access is requested, approved, and constrained.

It is intentionally MVP-first and assumes payload internals can evolve through learning iterations.

## First Activity (MVP)

Selected first activity:

- aws/listEksClusters/1.0.0

Why this one first:

- Read-only and low blast radius.
- Immediately useful for platform visibility.
- Validates identity, account scoping, region scoping, logging, and result shaping.
- Creates a clean pattern for later activities like listEcrRepositories and describeRdsInstances.

MVP interaction contract:

- Input: account context, optional region filters.
- Output: normalized EKS cluster snapshot rows for views and policy checks.
- Behavior: no mutation of AWS resources.

## Parallel Track A: Actor Interaction Model

## MVP actor set

Human actors:

- Platform Engineer
- Application Team Engineer
- Security Reviewer
- Service Owner

System actors:

- MSP AWS Service (activity runtime)
- CI/CD Pipeline
- Drift Scanner Job

Org actors:

- Team
- Business Unit
- Organization

## MVP work set

- Define AWS connection profile
- Request inventory run
- Approve inventory scope
- Execute inventory run
- Review inventory findings
- Approve expanded access (future write paths)

## Actor/work role bindings

These are links between actors and work.

- Platform Engineer -> Request inventory run
- Security Reviewer -> Approve inventory scope
- MSP AWS Service -> Execute inventory run
- Service Owner -> Review inventory findings
- Team -> Own inventory scope for account/region set
- CI/CD Pipeline -> Execute scheduled inventory run (non-human)

## (actor/work)->(actor/work) role chain

This chain is the MVP governance flow:

1. Requester link creates work: Request inventory run.
2. Approver link validates scope and purpose.
3. Executor link performs listEksClusters with approved scope.
4. Reviewer link signs off findings or opens remediation work.

## Parallel Track B: Secure and Purposeful Access Model

## Purpose checks required before execution

- Why: declared operational purpose for this run.
- What: approved activity set (start with listEksClusters only).
- Where: allowed account and region scope.
- Who: actor identity and actor type.
- How: credential strategy (OIDC/role assumption), no static keys.

## Access posture for MVP

- Read-only IAM policy for eks:ListClusters and eks:DescribeCluster.
- Role assumption constrained by account and environment tags.
- Every run linked to actor + work + approved scope.
- Execution log links activity result to access decision.

## Proposed schema set (MVP)

Schema names are proposed in domain style and map to current msp patterns.

1. awsActor

Core properties:

- actorId
- actorType (user, team, system, org)
- displayName
- identityProviderRef
- owningTeamId

2. awsWork

Core properties:

- workId
- workType (inventory_request, scope_approval, inventory_review)
- status
- purpose
- raisedOn
- deadline

3. awsLink

Core properties:

- linkId
- roleType (requester, approver, executor, reviewer)
- decision (approved, rejected, pending)
- decisionReason
- createdOn

4. awsConnectionProfile

Core properties:

- connectionProfileId
- accountId
- partition
- roleArn
- externalIdRef
- allowedRegions
- environment

5. awsAccessPolicyBinding

Core properties:

- bindingId
- actorId
- activityNamespace
- activityName
- allowedAccountIds
- allowedRegions
- allowedActions
- policyVersion

6. awsActivityRun

Core properties:

- activityRunId
- activityName
- version
- startedOn
- completedOn
- status
- requestHash
- resultCount
- errorSummary

7. eksClusterSnapshot

Core properties:

- snapshotId
- accountId
- region
- clusterArn
- clusterName
- status
- version
- endpoint
- observedAt

## Proposed objects and relationships (MVP)

Objects:

- actor (awsActor)
- work (awsWork)
- link (awsLink)
- connectionProfile (awsConnectionProfile)
- accessBinding (awsAccessPolicyBinding)
- activityRun (awsActivityRun)
- eksCluster (eksClusterSnapshot)

Relations:

- actor raises work
- actor linksTo work via link
- link isFor work
- actor authorizedBy accessBinding
- accessBinding permits activityRun
- activityRun uses connectionProfile
- activityRun observes eksCluster
- work references activityRun

## Proposed view set (MVP)

1. AwsAccessReadinessView

Root: actor
Includes:

- access bindings
- connection profiles in scope
- unresolved approvals for requested work

Purpose:

- show if a requester can run listEksClusters in a target account/region.

2. AwsInventoryExecutionView

Root: work
Includes:

- requester/approver/executor links
- linked activity runs
- execution status and errors

Purpose:

- show end-to-end trace from request through execution.

3. AwsEksInventoryView

Root: eksCluster
Includes:

- last activity run metadata
- owning account and region

Purpose:

- render normalized EKS inventory for operations and platform UI.

4. AwsAccessAuditView

Root: activityRun
Includes:

- actor identity
- work purpose
- approval references
- effective allowed scope

Purpose:

- prove each call was purposeful and authorized.

## SDK driving model

For listEksClusters, runtime selection and shaping should be:

1. Resolve actor and active work context.
2. Resolve approved accessBinding + connectionProfile.
3. Assume role and execute EKS list/describe APIs.
4. Normalize into eksClusterSnapshot records.
5. Persist activityRun + relation links.
6. Return view-friendly output.

This keeps SDK calls driven by model state (actors, work, access, scope), not ad-hoc request payloads.

## Suggested implementation order

1. Add minimal schemas for awsConnectionProfile, awsAccessPolicyBinding, awsActivityRun, eksClusterSnapshot.
2. Add relation model for actor/work/link linked to activityRun.
3. Upgrade listEksClusters handler to consume connection profile + scoped role.
4. Emit AwsInventoryExecutionView and AwsEksInventoryView data.
5. Add deny-by-default checks when actor/work/access links are missing.
6. Add test cases:
   - allowed read execution
   - denied due to missing approval
   - denied due to region outside scope
   - audit linkage exists for each successful run

## MVP completion criteria

- A user/team can request inventory run with explicit purpose.
- An approver can authorize account/region scope.
- Executor can run listEksClusters only within approved scope.
- Results are viewable as inventory and auditable as actor/work/access chain.
- No static credentials required for execution.

## Near-term next activity

After listEksClusters is fully governed and observable:

- aws/listEcrRepositories/1.0.0

Reuse the same actor/work/access objects and views so policy logic stays consistent across AWS services.
