# AWS Configuration Wizard Implementation Slice

## Scope

This document turns the design into an implementation-ready first slice.

In scope now:

1. Right-hand blade wizard shell with stepper navigation.
2. Durable setup state in graph artifacts (setup case + setup run + plan artifacts).
3. Initial step set:
- Platform Intent
- Trust and Identity
- Network Shape
- Resource Identity and Naming
- Review and Create
4. Rerunnable behavior with first-run and later-run defaults.
5. Create-now and final batch Create and Save Resources execution flow.

Deferred:

1. Storage and Data Controls step.
2. Full provider-specific provisioning strategy expansion.
3. Advanced policy graph authoring UI.

## UX Shell

### Blade host

The wizard runs in the right-hand blade and can be reopened without losing state.

Required shell behavior:

1. Open by setup work item or explicit admin action.
2. Restore most recent draft run for the target setup case.
3. Support close/reopen with no state loss.
4. Show unsaved changes indicator when local edits differ from persisted draft.

### Stepper behavior

1. Linear by default.
2. Back allowed always.
3. Forward allowed only when current step validates.
4. Direct jump enabled only to completed steps.
5. Review step can navigate back to each section.

## Component Breakdown

Suggested component map:

1. AwsSetupWizardBlade
- Blade container and lifecycle
- setup case/run bootstrap

2. AwsSetupWizardStepper
- step list, active step, completed markers

3. AwsSetupStepPlatformIntent
4. AwsSetupStepTrustIdentity
5. AwsSetupStepNetworkShape
6. AwsSetupStepResourceNaming
7. AwsSetupStepReviewCreate

8. Shared subcomponents
- UseExistingOrCreateNewControl
- UseSameAsControl
- AdvancedSection
- CreateNowActionCard
- ValidationBanner

## Step Definitions (first slice)

### Step 1: Platform Intent

Fields:

1. environmentName
2. platformPurpose
3. setupMode (fresh platform or extend existing)
4. serviceFocus (core, functional, data, mixed)

Defaulting:

1. infer environmentName from module context if available
2. set setupMode to fresh on first run
3. preserve saved values on rerun

Validation:

1. environmentName required
2. platformPurpose required

### Step 2: Trust and Identity

Fields:

1. iamMode for each required identity area:
- accountOwnerIdentity
- deploymentIdentity
- workloadIdentity
- serviceIdentity
2. per-area choice:
- createNew
- useExisting
3. selected existing IDs/names when useExisting
4. sharedIdentityRules (Use Same As options where allowed)

Defaulting rules:

1. first run (no relevant artifacts): default createNew
2. rerun with saved identity artifacts: default useExisting and prefill names/ids
3. show Use Same As only when policy permits the share pattern
4. do not show Use Same As where isolation would be weakened

Validation:

1. each identity area must resolve to a concrete plan
2. useExisting requires selected existing reference

### Step 3: Network Shape

Fields:

1. useStandardSixZoneShape (yes or no)
2. zone map and names (editable in advanced mode)
3. dmzDirectAccessPolicy
4. proxyViaPlatformServicesPolicy (servicehub/datahub mediation)
5. securityRingFenceLevel for msp_security

Defaulting:

1. default useStandardSixZoneShape to yes
2. default zones:
- MSP Core
- Functional Services
- Data Services
- Browser DMZ
- API DMZ
- Agents DMZ
3. default msp_security ring-fence to stricter-than-core when policy profile says so

Conditional behavior:

1. if useStandardSixZoneShape is yes, no separate service placement page
2. if no, advanced network mapping controls are required

Validation:

1. at least one core/internal zone exists
2. DMZ policy cannot directly expose restricted services

### Step 4: Resource Identity and Naming

Fields:

1. accountSetName
2. clusterName
3. namespace names
4. subnet names
5. role names
6. repository names
7. namingConventionMode (default or advanced)

Defaulting:

1. short purpose-first names
2. append environment suffix when needed
3. preserve saved names on rerun

Validation:

1. required resource names present
2. no duplicate names in same namespace scope

### Step 5: Review and Create

Shows:

1. full plan summary
2. new vs existing resource intent
3. create-now completed items
4. pending create items
5. warnings and policy notes

Actions:

1. Save draft only
2. Create and Save Resources (batch all pending)
3. per-section Create now action shortcuts

## Persistence Model (graph artifacts)

### Required object types

1. AwsSetupCase
- setupCaseId
- tenantId
- moduleId
- status
- currentStep
- createdAt
- updatedAt
- latestRunId

2. AwsSetupRun
- setupRunId
- setupCaseId
- runStatus
- startedAt
- completedAt
- activeStep
- isDraft

3. AwsPlatformIntentPlan
4. AwsIdentityPlan
5. AwsNetworkPlan
6. AwsResourceNamingPlan
7. AwsCreateActionPlan
8. AwsSetupSummary

### Relationship sketch

1. AwsSetupCase hasMany AwsSetupRun
2. AwsSetupRun hasOne each plan object for the slice
3. AwsSetupRun hasOne AwsSetupSummary
4. AwsSetupCase pointsTo latest successful run and latest draft run

## Read Views

Required views for UI:

1. AwsSetupCaseView
- list/open wizard targets

2. AwsSetupRunDraftView
- hydrate current wizard draft

3. AwsSetupSummaryView
- review page data and prior run comparison

4. AwsIdentityArtifactLookupView
- determine first-run vs existing defaults

## Service Activity Contracts

Minimal service activity set for this slice:

1. aws/getOrCreateSetupCase/1.0.0
Input:
- moduleId
- tenantId
- workItemId optional
Output:
- setupCase metadata
- latest draft run if present

2. aws/loadSetupRunDraft/1.0.0
Input:
- setupCaseId
Output:
- draft run + plan objects

3. aws/saveSetupStepDraft/1.0.0
Input:
- setupCaseId
- setupRunId optional
- stepId
- step payload
Output:
- updated draft run state
- validation status

4. aws/createPlannedResourceNow/1.0.0
Input:
- setupCaseId
- setupRunId
- planItemId
Output:
- create result
- persisted artifact references

5. aws/createAndSaveResources/1.0.0
Input:
- setupCaseId
- setupRunId
Output:
- batch create results
- final summary
- run status

6. aws/completeSetupRun/1.0.0
Input:
- setupCaseId
- setupRunId
Output:
- run completion metadata
- setup case current status

## Rerun Rules

1. Opening wizard checks for active draft run.
2. If draft exists, resume from activeStep.
3. If no draft but prior completed run exists, create new draft seeded from last completed plans.
4. If no prior runs, create initial draft with first-run defaults.

## Defaulting Logic

### Identity defaults

1. Determine existence of relevant identity artifacts.
2. If none found, set createNew.
3. If found, set useExisting and prefill references.
4. If user switches to createNew on rerun, allow override and persist explicit choice.

### Network defaults

1. Set useStandardSixZoneShape to yes unless explicit prior override.
2. If prior run used custom shape, keep custom shape on rerun.

## Validation and policy checks

Validation layers:

1. Step-local validation in UI.
2. Server-side validation on each draft save.
3. Policy validation on create-now and final create.

Policy examples for this slice:

1. block unsafe direct DMZ access to restricted services.
2. block disallowed identity sharing patterns.
3. enforce module-specific secure profile usage for capability issuance.

## Idempotency and safety

1. Create-now calls must be idempotent by planItemId.
2. Final batch create must skip already-created plan items.
3. Persist create receipts to avoid duplicate provisioning.
4. Partial failures must leave run resumable.

## Telemetry and audit

Record:

1. step saves
2. create-now actions
3. final create action
4. policy denials
5. run completion

Include correlation fields:

1. setupCaseId
2. setupRunId
3. workItemId optional
4. actorId

## Immediate implementation checklist

1. Add wizard blade shell and stepper components.
2. Add setup draft activity contracts and stubs.
3. Add graph schema/object/view definitions for first-slice artifacts.
4. Implement first-run vs rerun default resolver.
5. Implement create-now and batch create orchestration with idempotency.
6. Add end-to-end happy-path test:
- first run create-new defaults
- rerun use-existing defaults from persisted artifacts
