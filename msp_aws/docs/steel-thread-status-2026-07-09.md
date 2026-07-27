# Steel Thread Status & Realignment Input — 2026-07-09

Standing input for the "where are we / what were we trying to do" realignment session.

## Framing: this has been discovery mode — deliberately

The work so far has been *pick a thing, try it end-to-end, see what we learned*: what was easy,
what was harder than expected, what looks provider-neutral vs AWS-specific, does the experience
"work", how do we track eventually-consistent state. The platform self-bootstrap was chosen as
the first discovery example because it is non-trivial, well understood, and **not throw-away**.

### True north (the outcomes discovery is in service of)

1. **Low-tech, provider-portable wizards** — configuration described in terms of *security,
   isolation, scale and resilience factors*, such that the same wizard (or a derived variant)
   answers broadly the same questions over AWS, Azure, GCP, minikube or other on-prem k8s —
   different internals, same questions.
2. **Task-driven templated resource sets** — the real-world exemplar: insurance submission
   detailed data analysis for property RI cases (full CAT + ground-up-losses stochastic
   modelling + layer burn). When an analyst receives the task (or early on the day it nears the
   top of their list): spin up templated resource sets (VM sets, SageMaker, Bedrock, etc.),
   stage data (copy for local availability, or establish connections/firewalls to shared data),
   preload the analyst's favourite toolsets — all resources tagged so cost is tracked against
   task → case → policy → account — and properly shut down when the work is done, with archives
   of evidence and results.

The current AWS setup/ECR wizards are the **prelude**: platform self-bootstrap resource managers
that discover the patterns the task-driven system will reuse.

## Steel thread: wizard → desired-state → dry-run reconcile → gated apply

### Stage 1: Wizard → desired-state config (~85%)

| Item | Status | Notes |
|---|---|---|
| Setup wizard 7 pages (intent → trust → network → security → data → naming → review) | ✅ | Rendering correctly post-dedup/framework fixes |
| ECR wizard 4 pages (scope → policies → integration → review-apply) | ✅ | `repositoryScopePage` is the typed reference example |
| Desired-state persistence (`write/readClusterSetupConfig`, ECR equivalents) | ✅ | Whole-config writes via graph views |
| Graph schemas/views (`awsClusterSetupDesiredState` + EKS/ECR/network children, `ecrSetupConfigView`) | ✅ | |
| `calculateSubnetPlan` | ✅ | Pure logic, wired to "Calculate Network Plan" |
| Credential vault flow (`connectAwsCredentials`, `awsValidateCredentials`) | ✅ | Via msp_security |
| SetupCase/SetupRun lifecycle (`getOrCreateSetupCase`, `completeSetupRun`, per-step drafts) | ❌ | Draft-save is whole-config; no case/run objects — "rerunnable with history" is partial |
| First-run create-new vs rerun use-existing defaulting | ⚠️ | Config reload exists; explicit first-run/rerun mode logic unverified |
| Review-page hardcoded context (`aws-cluster-setup-default`, eu-west-2, msp-dev-eks) | ⚠️ | De-hardcode before multi-setup |

### Stage 2: Dry-run reconcile (~25%)

| Item | Status | Notes |
|---|---|---|
| Reconcile plan from desired config (`reconcile*SetupConfig`) | ⚠️ half-built | Plans from desired state only — never reads actual AWS |
| Observed-state capture (`getObservedInfrastructureState`) | ❌ | Types exist (`AwsObservedResource`, `AwsObservedStateAggregate`); no handler |
| Real AWS reads behind data activities | ❌ | `awsResourceDataServices.ts` is still mock data |
| Drift detection / per-resource deltas with reason codes | ❌ | `AwsDeltaType` (`missingInAws`/`drifted`/…) defined, unused |
| Create → observe → noop round-trip (designed checkpoint) | ❌ | Blocked on the two above |

**Update, later 2026-07-09** — first real observed-state read landed as an exploratory account scan:
- `aws/awsAccountResources` (data): real SDK reads — EKS, ECR, VPC/subnets/security groups, ELBv2, plus a Resource Groups Tagging API sweep of everything tagged (tags visible per row → previews the cost-tag story). Per-source failures degrade gracefully.
- `aws/listAccountResources/1.0.0` (service): lines observed up against desired state from cluster + ECR setup configs → `match` / `desired only (missing)` / `observed only (unmanaged)` / `—`.
- UI: "Scan AWS Account" menu → "AWS Account Inventory" tab (Type / Name / Region / Status / Desired State / Tags).
- This is inventory + line-up, not yet reconcile input — the natural next step is feeding it into `reconcile*SetupConfig` and emitting `AwsReconcileDelta` rows with reason codes.

### Stage 3: Apply (~0%, typed skeleton only)

| Item | Status |
|---|---|
| `applyInfrastructure` (SDK or Terraform), gated behind dry-run | ❌ types only (`AwsApplyResult`, runMode `apply`) |
| Idempotent create-by-planItemId, batch "Create and Save Resources" | ❌ |
| Dependency graph edges (phase 2) | ❌ |

## Discovery findings so far (what the mode was for)

- **Factor vocabulary survives contact**: the pages are already provider-neutral in language
  (environment intent, topology mode, AZ count, security baseline toggles, t-shirt sizes).
  The portable layer is real, not aspirational.
- **Provider leakage is contained and identifiable**: Trust & Identity is the AWS-shaped page —
  correctly so; treat it as the *provider adapter page* that varies per target.
- **Desired-state schemas mix layers**: `awsClusterSetup*` records hold factor answers
  (isolation zones, resilience, sizes) and provider materializations (VPC CIDRs, subnet IDs)
  in one shape. Future-proofing move (design intent, not work item): factor answers as durable
  core, provider-derived values as a computed/attached layer — the same split the task-driven
  templates will need.
- **The DSL investment paid off**: progressive typing through fluent chains + page breakout
  (`withXPage(builder: typeof wizPages)`) keeps business intent readable and typing flowing
  with low boilerplate. Framework hardening (build-once, definition lock, single-registration)
  turned silent duplication bugs into immediate errors.
- **Eventually-consistent state tracking is the unexplored half**: everything so far is the
  synchronous, desired-state side. Observed-state capture, drift, and reconcile-against-reality
  are where the eventual-consistency questions actually live — deliberately still ahead of us.
- **Teardown reframe**: task teardown = reconcile toward an empty desired state. The steel
  thread's reconcile loop is the same machinery the task-driven lifecycle needs; nothing here
  is throw-away.

## Decisions for the realignment session

1. **Next milestone**: observed-state capture + real SDK reads → `reconcile*SetupConfig`
   compares desired-vs-observed → create → observe → noop round-trip. Both the steel-thread
   checkpoint and the prerequisite for task-driven spin-up/teardown.
2. **SetupCase/SetupRun lifecycle**: still wanted, or superseded by whole-config-with-status?
   (Matters for the task-scoped audit trail: spun up for a task, torn down after, evidence kept.)
3. **ECR wizard**: steel-thread scope or second thread? (Its review-apply page is furthest
   ahead in shape.)
4. **Park explicitly as design intents** (shape naming, not work items yet): factor/provider
   schema split; cost-tag templates on the naming page (task → case → policy → account chain).

## Deferred / watch list

- Leak & subscription audit for render-engine bindings (usually fixed by tightening
  `useEffect` execution filters) — parked, not forgotten.
- Steel-thread exclusions remain excluded: namespace sub-division, advanced CIDR overrides,
  Shield Advanced/Macie/Network Firewall, MemoryDB, EdgeDB provisioning, A/B mode, environment
  copy, PEP enforcement.
