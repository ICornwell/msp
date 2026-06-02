# AWS Configuration Wizard Design

## Purpose

The configuration wizard is the guided, rerunnable onboarding flow for turning a plain AWS account into a platform-ready AWS module with durable configuration artifacts stored in the graph database.

It is designed around platform outcomes, not AWS prerequisites. The user should feel like they are setting up the platform operating model, while the wizard handles AWS details underneath.

## Design Goals

1. Rerunnable and resumable.
2. Creates durable artifacts in the graph database that can be read back and updated.
3. Encourages minimal default configuration.
4. Supports advanced settings where organizations commonly already have established conventions.
5. Defaults to safe, low-friction values on first run.
6. Prefers reusing prior artifacts on later runs.
7. Lets users create resources during the wizard when appropriate, but also supports a final bulk "Create & Save Resources" action.
8. Keeps direct AWS technical setup behind platform-oriented pages and language.

## Core UX Principles

1. Lead with the platform story:
- environment shape
- trust boundaries
- service placement
- identity and access
- data and network posture

2. Hide AWS jargon until the user opens advanced sections.

3. Use sensible defaults:
- minimal names
- conventional groups
- conservative permissions
- fewer manual choices

4. Make reuse easy but explicit:
- "Create new"
- "Use existing"
- "Use same as <X>" only where the pattern is safe and common

5. Allow progressive disclosure:
- basic path first
- advanced path only when the organization has an existing convention or non-default requirement

## Wizard State Model

The wizard should be rerunnable against an existing setup graph.

Recommended top-level concepts:

1. Setup Case
- the durable root record for a given AWS module onboarding attempt
- has identity, status, version, timestamps, owner, and current step

2. Setup Run
- one execution of the wizard
- can be restarted many times against the same Setup Case
- records step-level answers, validations, and side effects

3. Setup Artifacts
- graph entities representing the durable configuration produced by the wizard
- examples:
- account configuration
- IAM profile selections
- network shape
- namespace and subnet plan
- gateway/DMZ layout
- service access policy selections

4. Draft State
- editable state that reflects the current wizard session
- derived from persisted artifacts when they exist
- saved at each step or on explicit save

This supports:
- resume after refresh
- resume after browser close
- re-run against existing setup
- read-back and update of prior choices

## Graph Database Artifacts

The wizard should create graph artifacts via Schemas, Objects, and Views so the setup is queryable and editable.

Recommended artifact layers:

1. Schema layer
- defines the setup record types and relationships
- versioned
- controlled by migration/release process

2. Object layer
- individual persisted records, such as:
- setup case
- setup run
- named resource plan
- IAM selection
- cluster plan
- network plan
- service placement plan

3. View layer
- read models for UI and workflow logic
- supports step re-entry and summary pages
- supports reading current state plus historical run history

The wizard should never depend on transient React state as the only source of truth.

## Run Modes

1. First run with no saved artifacts:
- default to "Create new" for IAM and related resources
- create minimal sensible names
- create a new Setup Case
- save draft artifacts as they are created

2. Later run with saved artifacts present:
- default to "Use existing"
- pre-fill previous names/IDs
- highlight what already exists vs what can be changed
- allow updating current records rather than creating duplicates

3. Re-run after partial completion:
- resume at the last incomplete step
- preserve prior completed choices unless explicitly overridden

## Page Journey

The page sequence should reflect how an operator thinks about the platform, not how AWS APIs are arranged.

### 1. Platform Intent

Ask:
- what environment this is for
- what the platform is meant to support
- whether the setup is for a fresh platform or an additional environment
- whether this setup is for core services, functional services, data services, or a special boundary case

Default values:
- environment name inferred from module context
- minimal naming convention
- default to a standard platform shape

### 2. Trust and Identity

Ask:
- which IAM model to use
- whether to create new or use existing IAM accounts/roles/policies
- whether shared identities are acceptable between resources
- whether the organization wants a stricter ring-fence for msp_security or platform core

Default values:
- first run: create new
- later run: use existing if artifacts are present
- if shared usage is safe and common, offer "Use Same As <X>"
- if not safe or not recommended, do not offer it

This page should avoid AWS-role vocabulary until the advanced section, where the same controls can be exposed as:
- account owner
- deployment role
- workload role
- service role
- trust boundary

### 3. Network Shape

Ask:
- what subnet/ring layout is required
- whether the platform should use standard six-zone segmentation
- whether some components should not receive direct DMZ access
- whether platform services should be reached through servicehub/datahub instead of direct inbound access
- whether service placement should be inferred from the network shape rather than configured on a separate page

Default cluster/network layout:
- MSP Core
- Functional Services
- Data Services
- Browser DMZ
- API DMZ
- Agents DMZ

Advanced policy considerations:
- msp_security may require stricter ring-fencing than MSP Core
- DMZ components may be blocked from direct access to sensitive services
- functional/data flows may be proxied through servicehub/datahub rather than directly exposed

At this stage, service placement is treated as a consequence of the chosen network shape and proxy posture rather than a separate wizard page.

### 4. Resource Identity and Naming

Ask for names for:
- account set
- cluster
- namespaces
- subnets
- roles
- repositories
- service plans

Defaults should be short, predictable, and derived from platform purpose.

Suggested convention:
- use the platform purpose first, then environment
- avoid long AWS-specific technical names unless the user enters advanced mode

### 5. Storage and Data Controls (Deferred)

This is intentionally deferred for the first implementation slice.

Future questions will likely include:

- what data classes the platform will store or access
- whether there are existing organization data conventions
- whether any data paths must remain internal through datahub

When we do add this page, defaults should be:

- conservative storage exposure
- private-by-default data posture

### 6. Review and Create

The final page should show:
- summary of all selected values
- which values were created new vs reused
- which values are pending creation
- any warnings or policy notes

Actions:
- create resources as they are completed during the wizard
- or use a single "Create & Save Resources" action to complete all pending work at the end

## Create Now vs Final Create

Some steps should offer a "Create now" action.

Use it when:
- the user wants immediate creation of a sub-resource
- a resource is needed before proceeding
- early feedback helps validate the setup

If the user does not create during the wizard:
- the final "Create & Save Resources" button should perform all pending creations

This keeps the wizard flexible for both iterative and batch workflows.

## Create New vs Use Existing

For IAM and similar resources:

1. First run with no artifacts:
- default to create new

2. Later run with matching artifacts present:
- default to use existing

3. If there are established conventions:
- allow advanced selection of existing shared resources
- permit "Use Same As <X>" only where the pattern is safe and not a bad practice

Rules:
- do not suggest reuse when it weakens isolation
- prefer duplication over unsafe sharing
- when in doubt, hide the reuse option and force explicit selection

## Advanced Mode

Advanced mode should be available, but not forced.

Use it for:
- orgs with existing naming schemes
- orgs with pre-existing IAM structures
- orgs with pre-created VPC or subnet standards
- orgs that already have role-sharing conventions
- special network edge cases

Advanced mode should:
- reveal more technical fields
- preserve the basic path behavior
- never override safe defaults without user intent

## Reuse and "Use Same As X" Rules

This option should only appear when:
- the referenced resource is truly safe to share
- the isolation boundary is still preserved
- the platform policy explicitly permits sharing

Do not offer it when:
- it creates unnecessary trust coupling
- it would expose sensitive boundaries
- it would make troubleshooting or rollback harder

## Recommended Artifact Set

The wizard should persist a minimal but complete setup artifact set.

Suggested records:
- SetupCase
- SetupRun
- PlatformIntent
- IdentityPlan
- NetworkPlan
- ServicePlacementPlan
- ResourceNamingPlan
- SecurityBoundaryPlan
- CreateActionPlan
- FinalizedSetupSummary

Each should be queryable and updatable through views.

## Suggested Default Cluster / Boundary Shape

Default page-level pattern:
- MSP Core
- Functional Services
- Data Services
- Browser DMZ
- API DMZ
- Agents DMZ

Suggested policy default:
- keep msp_security more tightly ring-fenced than MSP Core if the platform requires it
- prefer proxy access through servicehub/datahub for Functional Services and Data Services where practical
- avoid direct DMZ access to highly sensitive services unless explicitly permitted

## Implementation Notes

1. Build the wizard as a right-hand blade flow so it can be rerun without disrupting the main workspace.
2. Back the wizard with graph artifacts, not local component state.
3. Drive page order from platform lifecycle, not AWS API sequence.
4. Keep the basic path short and opinionated.
5. Make advanced options explicit and opt-in.
6. Make defaults visible so the user can accept them quickly.

## Immediate Next Slice

The first useful implementation slice should be:

1. Wizard shell and stepper/blade container.
2. SetupCase / SetupRun graph schema.
3. IdentityPlan step with create-new/use-existing behavior.
4. NetworkPlan step with the default six-zone boundary layout.
5. Final review/create flow that can batch-create pending artifacts.

## Summary

This wizard should behave like a platform setup guide with durable state, not like an AWS console clone.

Its job is to guide the operator toward a safe platform shape, persist the decisions as queryable graph artifacts, and allow the setup to be rerun and refined over time.
