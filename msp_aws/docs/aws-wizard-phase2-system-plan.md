# AWS Wizard Phase 2 System Plan

Date: 2026-06-08
Owner: Ian + Copilot
Status: Proposed implementation plan

## 1. Purpose

This plan defines the next phase of the AWS setup/configuration wizard as a complete system design across four layers:

1. AWS SDK data model (raw provider shape)
2. Middle-tier aggregation model (normalized domain shape)
3. Native persistence model (durable desired/observed/dependency graph state)
4. UI and Fluxor model (interactive editing, runtime status, dependency graph views)

The goal is to make the wizard rerunnable, explainable, and operationally useful, while keeping room for later temporary UI data mechanisms without implementing them prematurely.

## 2. Scope of This Phase

In scope:

1. Replace temporary wizard typing patches with explicit Fluxor/view models.
2. Define normalized resource, config, and dependency domain models.
3. Add durable persistence for:
- desired configuration
- observed AWS inventory snapshot
- reconciliation status
- dependency graph edges
4. Define activity contracts for load, save draft, validate, reconcile dry run, and apply.
5. Add UI pages for:
- config editing
- current runtime status
- dependency graph review

Out of scope:

1. New UI engine temporaryData framework implementation.
2. New page-local root DSL features.
3. Full production provisioning automation for all AWS services.

## 3. Architecture Layers

## 3.1 AWS SDK Layer (Provider Read/Write)

Primary SDK clients:

1. EKS client
2. ECR client
3. IAM client
4. EC2 client (VPC/subnet/security groups)
5. STS client
6. CloudWatch Logs client (read status/events)

SDK read contracts (raw collection shape):

1. ClusterSummaryRaw
- source: EKS list/describe cluster
- keys: arn, name, version, status, endpoint, roleArn, vpcConfig, tags

2. NodeGroupSummaryRaw
- source: EKS list/describe nodegroup
- keys: nodegroupName, clusterName, status, scalingConfig, amiType, instanceTypes

3. RepositorySummaryRaw
- source: ECR describe repositories
- keys: repositoryArn, repositoryName, repositoryUri, imageTagMutability, encryptionConfiguration, scanOnPush

4. RoleSummaryRaw
- source: IAM get role/list attached policies
- keys: roleName, arn, assumeRolePolicyDocument, attachedPolicies

5. NetworkSummaryRaw
- source: EC2 describe vpcs/subnets/route tables/security groups
- keys: vpcId, cidr, subnets, routeShape, securityGroups

Write operations in this phase:

1. Optional dry-run style plan generation only (no destructive changes by default).
2. Optional apply for selected operations where confidence is high.

## 3.2 Middle-tier Aggregation Layer

The middle tier converts multiple SDK payloads into one canonical model for UI and persistence.

Canonical entities:

1. AwsObservedResource
- resourceId
- resourceType
- providerArn
- name
- region
- state
- metadata
- discoveredAt

2. AwsDesiredResourceConfig
- resourceKey
- desiredState (typed per resource kind)
- ownershipMode (createNew, useExisting, managedExternally)
- namingIntent
- policyIntent

3. AwsReconcileDelta
- resourceKey
- deltaType (missingInAws, drifted, unmanagedInAws, configInvalid)
- currentValue
- desiredValue
- severity
- recommendation

4. AwsDependencyEdge
- fromResourceKey
- toResourceKey
- relationType (dependsOn, secures, routesThrough, assumedBy)
- criticality

Aggregation responsibilities:

1. Merge EKS/ECR/IAM/EC2 reads into one observed state snapshot.
2. Normalize naming and status labels used by UI tables and cards.
3. Compute drift and missing-resource deltas against desired config.
4. Build dependency graph edges from inferred relationships.
5. Return deterministic payloads for rerendering and persistence.

## 3.3 Native Persistence Layer

Persistence must store both intent and observations, with history by run.

Graph persistence assumptions (must hold for all model decisions):

1. Persistence is graph-native, not relational-first.
2. Every object is fully history-preserving by default (append-only revisions).
3. Queries can be evaluated at any timestamp and return:
- graph state valid at that timestamp
- latest revision of each queried object up to that timestamp

Root entities:

1. AwsSetupCase
- setupCaseId
- tenant or account scope
- regionScope
- currentStatus
- latestDraftRunId
- latestSuccessfulRunId

2. AwsSetupRun
- setupRunId
- setupCaseId
- runMode (draft, validate, dryRun, apply)
- wizardVersion
- startedAt
- completedAt
- runStatus

3. AwsDesiredConfigBundle
- setupRunId
- step payload sections
- desired resource configuration by resource key

4. AwsObservedSnapshot
- setupRunId
- sourceTimestamp
- normalized observed resources
- snapshotHash

5. AwsReconcilePlan
- setupRunId
- planSummary
- planSteps
- riskFlags

6. AwsDependencyGraph
- setupRunId
- nodes
- edges
- graphVersion

7. AwsApplyResult
- setupRunId
- attemptedOperations
- successOperations
- failedOperations
- diagnostics

Recommended view projections:

1. AwsSetupCaseView
- lightweight routing and status metadata

2. AwsSetupRunDraftView
- current editable desired values and completion state

3. AwsObservedStateView
- current normalized inventory for status pages

4. AwsReconcilePlanView
- computed deltas grouped by severity and step

5. AwsDependencyGraphView
- graph nodes/edges for visualization and drilldown

Historical policy:

1. Keep only latest draft mutable.
2. Keep successful runs immutable.
3. Keep observation snapshots by run for drift trend analysis.

## 3.4 UI and Fluxor Layer

The UI should expose three coordinated experiences:

1. Configuration editing (wizard steps)
2. Current runtime state (what AWS actually has now)
3. Dependency graph inspection (what depends on what)

Fluxor model groups:

1. Wizard step draft Fluxors
- AwsSetupPlatformIntentFluxor
- AwsSetupTrustIdentityFluxor
- AwsSetupNetworkShapeFluxor
- AwsSetupResourceNamingFluxor
- AwsSetupReviewFluxor

2. Runtime state Fluxors
- AwsObservedResourcesFluxor
- AwsResourceHealthFluxor
- AwsReconcileDeltaFluxor

3. Graph Fluxors
- AwsDependencyNodeFluxor
- AwsDependencyEdgeFluxor
- AwsDependencySummaryFluxor

UI page composition:

1. Wizard Blade
- stepper pages for draft editing
- validation and completion indicators

2. Runtime Tab/Page
- normalized observed inventory tables
- health and drift summaries

3. Dependency Tab/Page
- dependency edges and node details
- unresolved dependency warnings

## 4. End-to-End Data Flow

1. Open wizard.
2. Load or create setup case.
3. Load latest draft run (or seed first run defaults).
4. Render step pages from draft view model.
5. Save draft per step transition.
6. Run validation and reconciliation on demand.
7. Refresh observed snapshot from AWS.
8. Recompute deltas and dependency graph.
9. Present review summary.
10. Apply selected operations or close as draft.

## 5. Activity Contract Plan

Phase 2 activity set:

1. aws/getOrCreateSetupCase/1.0.0
2. aws/loadSetupRunDraft/1.0.0
3. aws/saveSetupStepDraft/1.0.0
4. aws/readObservedAwsState/1.0.0
5. aws/buildReconcilePlan/1.0.0
6. aws/readDependencyGraph/1.0.0
7. aws/applySetupPlan/1.0.0

Activity response envelope sections:

1. data
2. diagnostics
3. warnings
4. validation
5. correlation metadata

## 6. Gap Analysis: Where Temporary UI Data Will Be Needed

The current plan can proceed without temporary UI data for basic persistence-backed step editing.

Temporary data becomes high-value when these capabilities are added:

1. Unsaved local toggles that should not persist immediately
- advanced section expanded/collapsed
- local table filter and graph focus state

2. Multi-control staging before a single commit
- local edits in one step before pressing Save Step

3. Step guard navigation state
- attemptedNext count
- inline validation display mode

4. Interactive dependency graph controls
- highlighted node set
- temporary path traversal selections

Decision trigger:

1. Introduce temporary data support only when at least two wizard pages need non-persistent interactive state that materially harms UX without it.

Deferred low-impact enhancement candidate:

1. Optional component declaration `shareUnboundPropsUsingName(name)` to publish selected component props/indexes under `elementSharedProps.[name].[propName]`.
2. This would support cross-component bindings (for example button-driven page index changes) without changing existing fluent typing contracts.
3. Keep deferred until wizard interactions prove repeated cross-component unbound prop wiring pressure.

## 7. Implementation Sequence

Sprint A: Canonical models and activity contracts

1. Define normalized middle-tier model types.
2. Implement AWS read aggregation activity.
3. Implement desired config draft save/load activities.
4. Persist observed snapshot and reconcile plan objects.

Sprint B: Wizard and runtime UI stabilization

1. Replace temporary wizard type patch with proper Fluxor definitions.
2. Bind each wizard page to typed draft section models.
3. Add runtime observed-state page.
4. Add reconcile delta page.

Sprint C: Dependency graph and apply workflow

1. Build dependency graph persistence and read model.
2. Add graph page and edge drilldown.
3. Add apply activity and operation result projection.
4. Add audit and diagnostics display.

## 8. Acceptance Criteria

1. One setup case can be reopened and resumed with no data loss.
2. Desired config, observed state, reconcile plan, and dependency graph are each durably persisted and queryable.
3. UI pages are bound through explicit typed Fluxor/view models without temporary type shims.
4. Reconcile view clearly distinguishes desired vs observed differences.
5. Dependency graph view shows at least one real dependency chain from live observed data.
6. Build remains green across workspace and msp_aws package.

## 9. Risks and Mitigations

1. Risk: Over-coupling UI shapes to raw SDK payloads.
- Mitigation: strict canonical model boundary in middle tier.

2. Risk: Drift logic becomes opaque.
- Mitigation: persist per-resource delta records with reason codes.

3. Risk: Wizard state complexity grows before temp-data mechanisms exist.
- Mitigation: keep step state persistence-granular and defer transient UX features until clear pressure appears.

4. Risk: Graph model too broad too early.
- Mitigation: start with core node/edge types for EKS, ECR, IAM, VPC only.

## 10. Immediate Next Actions

1. Lock phase 2 canonical types and naming conventions.
2. Refactor existing wizard content binding to those types.
3. Add draft/run/case activity contracts to service layer.
4. Add observed-state aggregation activity using current AWS service activities as seed inputs.
5. Add dependency graph read projection and basic UI page.
