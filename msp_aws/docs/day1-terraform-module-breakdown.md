# Day 1 Terraform Module Breakdown

This document turns the readiness strategy into an actionable Terraform implementation plan.

It is intentionally opinionated for speed and safety:

- Multi-account aware.
- IAM-first.
- EKS + ECR + Postgres baseline.
- CI OIDC federation.
- Minimal but production-safe module boundaries.

## Objectives

1. Stand up secure, repeatable infra for `dev` first.
2. Preserve a clean path to `staging` and `prod` with minimal rework.
3. Keep IAM policy blast radius small via module and role decomposition.

## Recommended Repository Structure

Use one infra repo (or `msp_aws/infra`) with clear layers:

```text
infra/
  modules/
    org_baseline/
    account_baseline/
    network_vpc/
    security_baseline/
    kms_keys/
    ecr_repositories/
    rds_postgres/
    eks_cluster/
    eks_irsa_role/
    eks_addons/
    ci_oidc_provider/
    ci_deploy_role/
    app_service_account_roles/
    observability_baseline/
  environments/
    dev/
      backend.tf
      providers.tf
      versions.tf
      main.tf
      variables.tf
      terraform.tfvars
    staging/
    prod/
```

## State and Workspace Model

1. Prefer separate state per environment directory, not one monolithic state.
2. Use remote state backend (S3 + DynamoDB lock table).
3. Encrypt state bucket with KMS.
4. Restrict state bucket access to infra roles only.

## Module-by-Module Plan

## 1) org_baseline (optional if org already managed elsewhere)

Purpose:

- Create core OUs and baseline SCP attachments.

Inputs:

- `ou_names`
- `scp_policy_arns`

Outputs:

- `ou_ids`

Apply target:

- Management/security account only.

## 2) account_baseline

Purpose:

- Per-account baseline IAM settings and guardrail attachments.

Responsibilities:

1. Password/account policy.
2. Optional break-glass role scaffolding.
3. Baseline tags and IAM access analyzer enablement hooks.

## 3) security_baseline

Purpose:

- Turn on mandatory detective controls in each workload account.

Resources:

1. CloudTrail (or org integration wiring).
2. Config recorder and delivery channel.
3. GuardDuty enablement.
4. Security Hub enablement.

## 4) network_vpc

Purpose:

- VPC with app and data isolation.

Resources:

1. VPC + DNS hostnames support.
2. Public/private/data subnets across 2-3 AZs.
3. NAT strategy (cost-aware in dev, HA in prod).
4. Route tables and NACL defaults.
5. VPC endpoints:
   - ECR API
   - ECR DKR
   - S3
   - STS
   - CloudWatch Logs
   - Secrets Manager
   - KMS

Outputs:

- `vpc_id`
- `private_subnet_ids`
- `data_subnet_ids`
- endpoint/security group IDs

## 5) kms_keys

Purpose:

- Centralize KMS keys for EKS secrets, ECR, RDS, and logs.

Resources:

1. `kms/eks`
2. `kms/rds`
3. `kms/logs`
4. `kms/secrets`

Note:

- Use key policies that allow service principals and specific infra/app roles only.

## 6) ecr_repositories

Purpose:

- Create hardened private ECR repos per service.

Resources per repo:

1. Repository with immutable tags.
2. Scan on push enabled.
3. Lifecycle policy.
4. Optional repository policy for cross-account pulls.

Inputs:

- `repositories = ["actorwork/dev", "aws-control/dev", ...]`

Outputs:

- map of repository URLs/ARNs.

## 7) rds_postgres

Purpose:

- Secure managed Postgres baseline.

Resources:

1. DB subnet group (data subnets only).
2. Security group (ingress from app SG only).
3. RDS PostgreSQL or Aurora cluster.
4. KMS encryption.
5. Automated backups + retention.
6. Parameter group with sane defaults.
7. Secrets Manager secret for admin/bootstrap user.

Optional:

- IAM database authentication enabled.

Outputs:

- endpoint/port
- secret ARN
- SG ID

## 8) eks_cluster

Purpose:

- Provision EKS control plane + managed node groups.

Resources:

1. EKS cluster role.
2. Cluster.
3. Node role(s).
4. Managed node group(s).
5. OIDC provider for IRSA.

Inputs:

- cluster version
- subnet IDs
- node sizing

Outputs:

- cluster name/endpoint/CA
- oidc provider ARN/URL
- node role ARNs

## 9) eks_addons

Purpose:

- Install core add-ons and bind dedicated IAM roles.

Recommended Day-1 add-ons:

1. VPC CNI
2. CoreDNS
3. kube-proxy
4. EBS CSI driver
5. AWS Load Balancer Controller

This module should consume IRSA role ARNs from `eks_irsa_role`.

## 10) eks_irsa_role

Purpose:

- Reusable module to create one IRSA role per service account.

Inputs:

- `role_name`
- `oidc_provider_arn`
- `oidc_issuer_url`
- `namespace`
- `service_account_name`
- `policy_json` or `policy_arns`

Trust policy pattern:

- `sub = system:serviceaccount:<namespace>:<service_account_name>`
- `aud = sts.amazonaws.com`

## 11) app_service_account_roles

Purpose:

- Instantiate IRSA roles for app workloads.

Initial roles:

1. `irsa-actorwork-role`
2. `irsa-aws-control-role`
3. `irsa-monitoring-role`

Attach only required permissions:

- `aws-control` read-only EKS/ECR initially.
- per-service Secrets Manager read for own secret ARN only.
- KMS decrypt for required key only.

## 12) ci_oidc_provider

Purpose:

- Create OIDC identity provider for CI platform.

Resources:

1. IAM OIDC provider.
2. Thumbprint and audience configuration.

## 13) ci_deploy_role

Purpose:

- Create strict deploy role trusted by CI OIDC.

Trust conditions:

1. Exact repo/org.
2. Exact branch/tag or environment.
3. Optional workflow name constraints.

Permissions Day-1:

1. Push to approved ECR repos only.
2. Deploy to specific EKS cluster and namespace only.
3. Read-only on required describe/list APIs.

## 14) observability_baseline

Purpose:

- Logging and baseline alerting.

Resources:

1. CloudWatch log groups with retention and KMS.
2. Metric alarms for EKS/API failures.
3. Optional budget + anomaly detection resources.

## Environment Composition (dev/main.tf)

Recommended apply order inside `environments/dev/main.tf`:

1. `account_baseline`
2. `security_baseline`
3. `kms_keys`
4. `network_vpc`
5. `ecr_repositories`
6. `rds_postgres`
7. `eks_cluster`
8. `eks_irsa_role` instances
9. `eks_addons`
10. `app_service_account_roles`
11. `ci_oidc_provider`
12. `ci_deploy_role`
13. `observability_baseline`

Use module outputs as hard dependencies, not `depends_on` unless required.

## Objective Success Criteria and Scoring (Items 5-13)

This scorecard evaluates the lifecycle bundles corresponding to module items 5-13.

Scope:

1. `kms_keys`
2. `ecr_repositories`
3. `rds_postgres`
4. `eks_cluster`
5. `eks_addons`
6. `eks_irsa_role`
7. `app_service_account_roles`
8. `ci_oidc_provider`
9. `ci_deploy_role`

### Scoring scale (objective)

Use the same 0-3 rubric for every criterion:

1. `0` = absent or non-functional.
2. `1` = partial, manual fallback required, or weakly evidenced.
3. `2` = functional and repeatable with known gaps.
4. `3` = fully functional, repeatable, and evidenced by automated checks.

### Weighted criteria (per item)

Each item is scored against these criteria (weights sum to 100):

1. Identity and least-privilege correctness (20)
2. Dependency closure correctness (15)
3. Drift detection and reconciliation readiness (15)
4. Work-centric authorization and audit trail completeness (20)
5. Operational reliability and rollback safety (15)
6. Observability and diagnosability coverage (15)

### Score calculation

For each item:

1. `WeightedScore = sum((CriterionScore / 3) * CriterionWeight)`
2. Result is a value from 0 to 100.

Program-level score:

1. `ProgramScore = average(WeightedScore for items 5-13)`

### Pass thresholds

1. Any item score below 70 = fail for production promotion.
2. Any score below 2 on Identity or Audit criteria = automatic fail.
3. Program score 80+ with no automatic fail = acceptable for next-stage rollout.

### Required evidence (to keep scoring objective)

Every criterion score must point to one or more evidence artifacts:

1. Graph evidence:
  - node/edge snapshot proving expected dependency closure.
2. Runtime evidence:
  - execution logs with work ID, actor ID, requested/approved/executed chain.
3. Security evidence:
  - policy diff and effective permission simulation where applicable.
4. Drift evidence:
  - observed-vs-desired delta report and reconciliation result.
5. Operational evidence:
  - rollback or recovery run result for lifecycle transitions.

### Item-specific objective checks

1. `kms_keys`
  - Key policies exclude wildcard principals and are scoped to intended actor/service roles.
  - Secrets and dependent services can encrypt/decrypt without broad grants.
2. `ecr_repositories`
  - Immutable tags and scan-on-push are enforced.
  - Push/pull permissions are repo-scoped and environment-scoped.
3. `rds_postgres`
  - Private network path only, encrypted storage, backup policy verified.
  - Service role access is constrained to intended secret and DB path.
4. `eks_cluster`
  - Cluster and node roles separated with least privilege.
  - OIDC and control-plane dependencies are complete and graph-visible.
5. `eks_addons`
  - Add-on identities are isolated and mapped to dedicated permissions.
  - Add-on lifecycle operations are recoverable without cluster-wide privilege expansion.
6. `eks_irsa_role`
  - Trust policy constraints (`sub` and `aud`) are exact-match scoped.
  - No role can be assumed by unintended namespace/service account combinations.
7. `app_service_account_roles`
  - Each workload role has only required API/resource access.
  - Secret and KMS access is per-service scoped with no cross-service bleed.
8. `ci_oidc_provider`
  - OIDC provider constraints are pinned to intended CI issuer and audience.
  - Federation cannot be reused by unrelated repos/workflows.
9. `ci_deploy_role`
  - Deploy role trust constraints enforce repo, ref, and environment boundaries.
  - CI permissions cannot mutate broad IAM or unrelated runtime assets.

### Evaluation cadence

1. Score each item at initial implementation.
2. Re-score after first non-trivial change and first rollback rehearsal.
3. Re-score before any environment promotion.

## Day 1 IAM Role Matrix (Concrete Starter)

Human roles:

1. `platform-admin-human-role`
2. `platform-operator-human-role`
3. `security-auditor-human-role`

Cluster/system roles:

1. `eks-cluster-role`
2. `eks-node-role`
3. `irsa-aws-lb-controller-role`
4. `irsa-ebs-csi-role`
5. `irsa-autoscaler-role` (when autoscaling is enabled)

Application roles:

1. `irsa-actorwork-role`
2. `irsa-aws-control-role`
3. `irsa-monitoring-role`

CI role:

1. `ci-deploy-role-dev` (copy pattern for stage/prod)

## Minimum Policy Scope Guidance

For `irsa-aws-control-role` Day-1 read-only:

- EKS read APIs (`Describe*`, `List*`) scoped where possible.
- ECR read APIs (`DescribeRepositories`, `ListImages`, `DescribeImages`).
- CloudWatch read for metrics/log query if needed.

For `ci-deploy-role-dev`:

- ECR push actions only to approved repo ARNs.
- EKS update/deploy permissions constrained to target cluster context.
- No broad IAM mutation permissions.

## Delivery Sequence (1 Week Starter)

Day 1-2:

1. network, KMS, security baseline, ECR.

Day 3:

1. EKS cluster + add-ons + IRSA foundation.

Day 4:

1. RDS Postgres + secrets + connectivity checks.

Day 5:

1. CI OIDC + deploy role + first app deployment.
2. actorwork calls `msp_aws` read-only activities against real AWS.

## Validation Checklist Per Environment

1. `terraform plan` clean and understandable.
2. CloudTrail/Config/GuardDuty/Security Hub enabled.
3. EKS nodes private, workloads functional.
4. IRSA role assumption verified from pod.
5. ECR immutable tags + scan on push verified.
6. RDS private + encrypted + backup policy verified.
7. CI pipeline deploys without static AWS keys.
8. Budget/cost alarms receiving events.

## Next Expansion After Day 1

1. Add `create/update/deprecate` AWS activity permissions with separate write roles.
2. Introduce policy-as-code checks (OPA/Conftest, tfsec, Checkov).
3. Add SCP hardening iterations from observed usage.
4. Promote module set to staging/prod with stricter controls.

## Graph-First Non-Terraform Decomposition (Pre-IaC Tool Decision)

This section models the environment as resource graphs first, before selecting an IaC engine.

Core rule:

- If an object has an ID/ARN/name and lifecycle, it is a graph node.
- If one object constrains, permits, routes, trusts, references, or observes another, it is an edge.

### 1) Complete resource families (everything with an ID)

The list below is the minimum practical surface for a production-safe EKS + ECR + Postgres environment.

1. Organization and account governance
  - Organization, OU, account, SCP, tag policy, CloudTrail org trail, delegated admin bindings.
2. IAM and identity
  - Identity Center permission sets, IAM roles, managed policies, inline policies, policy versions, instance profiles.
  - OIDC providers, role trust policies, session policies, Access Analyzer findings.
3. KMS and secrets
  - KMS keys, aliases, key policies, grants, Secrets Manager secrets, secret versions, rotation configs.
4. Networking and routing
  - VPC, subnets, route tables, route rules, Internet gateways, NAT gateways, NACLs, NACL rules.
  - VPC endpoints (interface/gateway), endpoint policies, Transit Gateway attachments (if used).
5. Firewall and traffic control
  - Security groups, SG rules, NACL rules, load balancer listeners, listener rules, target groups, WAF ACL/rules (if used).
6. DNS and certificates
  - Route53 zones/records, ACM certs, validation records, private hosted zones.
7. EKS control plane and worker substrate
  - Cluster, node groups, launch templates, Auto Scaling groups, ENIs, EBS volumes, add-on resources.
  - OIDC issuer, service accounts, RBAC roles/rolebindings/clusterrolebindings.
8. Container registry and artifacts
  - ECR repositories, lifecycle policies, scan settings, repository policies, image digests/tags.
9. Database and stateful services
  - RDS clusters/instances, subnet groups, parameter groups, option groups, snapshots, read replicas.
10. Observability and audit
  - Log groups, metric filters, alarms, dashboards, event rules, SNS topics/subscriptions.
  - CloudTrail trails, Config recorders/rules, GuardDuty detectors, Security Hub standards/findings.
11. CI/CD federation and delivery plane
  - OIDC trust providers, deploy roles, boundary policies, artifact permissions, pipeline environments.
12. Cost and governance controls
  - Budgets, anomaly monitors, cost categories, tagging enforcement constructs.

### 2) Dependency map taxonomy (how many maps actually exist)

For EKS systems, the practical model is not one dependency map. It is multiple overlapping maps.

Canonical map set (11 maps):

1. Identity trust map
  - Who can assume which role under what claims/conditions.
2. IAM authorization map
  - Which principals can perform which API actions against which resources.
3. Network reachability map
  - Which source nodes can route to which destination nodes.
4. Firewall allow/deny map
  - Security group and NACL rule effects over declared flows.
5. Service dependency map
  - Runtime dependencies across EKS services, AWS APIs, and data stores.
6. Data boundary map
  - Data-at-rest assets, ownership, encryption keys, and readers/writers.
7. Secret/key usage map
  - Which workloads can read which secrets and decrypt with which KMS keys.
8. Deployment/update map
  - Build artifacts to repos to cluster namespaces to running workloads.
9. Observability coverage map
  - Which assets emit logs/metrics/traces and who consumes alerts.
10. Governance/compliance map
  - Control requirements mapped to concrete resources and checks.
11. Drift and reconciliation map
  - Desired vs observed resource state and correction authority.

### 3) Moving-part estimate for one environment

Baseline assumptions:

- 1 account, 1 VPC, 3 AZs, 2 private subnet tiers, 1 EKS cluster, 2 node groups.
- 4 core add-ons, 3 app namespaces, 10 app service accounts with IRSA.
- 12 ECR repos, 1 RDS postgres cluster/instance, standard guardrails enabled.

Lower-bound ID count by family (excluding dynamic pods/ENIs churn):

1. IAM and trust objects: 60-110
2. Network/routing/firewall objects: 70-130
3. EKS and worker substrate objects: 25-55
4. Registry and artifact controls: 20-35
5. Database and secret/key objects: 20-45
6. Observability, audit, governance objects: 35-80

Total lower-bound static/semi-static object count:

- ~230 to ~455 IDs per environment.

This is why graph tooling is useful: object count is manageable, but edge count grows faster than node count.

### 4) Static vs parameterized split

Use this split to decide what should be hard-coded in templates, generated, or prompted from workflows.

Mostly static for MSP purposes:

1. Guardrail classes enabled (CloudTrail, Config, GuardDuty, Security Hub).
2. Baseline VPC topology shape (subnet tiers, endpoint classes).
3. IAM role classes and trust pattern templates.
4. Log retention classes and baseline alarms.
5. Tag schema and naming conventions.

Parameterized at environment bootstrap:

1. Account IDs, partition, region sets.
2. CIDR ranges and AZ count.
3. Cluster version, node families, min/max/desired capacities.
4. Repository list, image retention windows.
5. DB engine/version, backup windows, retention and performance profile.
6. Namespace catalog and service-account-to-role bindings.

Parameterized at runtime/workflow:

1. Which actor can activate which module for which environment.
2. Temporary privilege elevation scopes and expiry.
3. Service onboarding deltas (new namespace, IRSA binding, secrets access).
4. Incident-time network or policy exceptions with explicit rollback windows.

### 5) Parameter ownership model (who/how/when/why)

Humans do not directly own AWS resources in this model. Humans raise work. System actors own entity classes and lifecycle execution.

1. System actor: `PlatformLifecycleActor`
  - Owns platform baseline entities (guardrails, baseline IAM templates, naming/tag classes).
  - Determines baseline parameter values at platform release boundaries from approved work.
2. System actor: `EnvironmentLifecycleActor`
  - Owns environment entities (account/region bindings, VPC topology values, cluster sizing envelopes).
  - Determines environment parameter values at environment bootstrap and scaling work events.
3. System actor: `ServiceLifecycleActor`
  - Owns service entities (namespace, IRSA bindings, secret access set, repository linkage).
  - Determines service-level values during onboarding and service change work.
4. System actor: `SecurityLifecycleActor`
  - Owns trust constraints, boundary policy templates, exception windows, and expiry controls.
  - Determines security-sensitive values via approval-gated work.
5. System actor: `GraphReconciliationActor`
  - Owns computed values: derived least-privilege statements, dependency closure edges, and drift decisions.
  - Determines computed values from graph state plus observed telemetry.

Human actor relationship (request model):

1. Humans submit work requests with intent and constraints.
2. System actors evaluate, expand, and execute lifecycle transitions.
3. Every parameter change is attributable to a work item and execution actor.

### 5.1) Lifecycle value objects (borrowed from Terraform module bundles)

Use Terraform modules as a dependency reference corpus, not as authoritative state.

Each lifecycle entity owns a Value Object bundle of tightly coupled resources that should change together.

Initial bundle catalog:

1. `NetworkBaselineVO`
  - VPC, subnet sets, route tables/rules, NAT/IGW, endpoint set, NACL baselines.
2. `EksControlPlaneVO`
  - EKS cluster, cluster role, OIDC issuer/provider bindings, control-plane logging config.
3. `EksNodeRuntimeVO`
  - Node groups, launch templates, node roles/profiles, autoscaling envelopes.
4. `IrsaBindingVO`
  - Service account identity, trust policy conditions, attached permission set.
5. `RegistryLifecycleVO`
  - ECR repository, scan settings, lifecycle policy, immutable-tag policy, repo policy.
6. `PostgresLifecycleVO`
  - DB subnet group, parameter group, instance/cluster, SG rules, backup profile, secret linkage.
7. `ObservabilityBaselineVO`
  - Log groups, retention/encryption profile, alarm set, event-routing rules.
8. `CiFederationVO`
  - OIDC provider, deploy role trust claims, bounded deploy permission set.

Design rule:

1. If resources repeatedly share lifecycle transitions, model them as one Value Object.
2. If resources share only incidental references, keep them as separate entities linked by edges.

### 6) Graph schema proposal for MSP

Node classes:

1. `AwsResourceNode`
  - `{ id, arn, kind, accountId, region, env, tags, lifecycleState }`
2. `AwsPolicyNode`
  - `{ id, policyType, version, effectSummary }`
3. `AwsActorNode`
  - `{ actorId, actorType, teamId }`
4. `AwsWorkNode`
  - `{ workId, workType, purpose, status }`

Edge classes:

1. `TRUSTS` (principal -> role)
2. `ALLOWS` (policy -> action/resource scope)
3. `ATTACHED_TO` (policy -> principal/resource)
4. `ROUTES_TO` (subnet/route-table -> destination)
5. `CAN_CONNECT_TO` (sg/nacl evaluated flow)
6. `DEPENDS_ON` (service/resource dependency)
7. `USES_SECRET` (workload -> secret)
8. `DECRYPTS_WITH` (principal/workload -> kms key)
9. `OBSERVED_BY` (resource -> log/alarm/rule)
10. `GOVERNED_BY` (resource -> control/policy)
11. `REQUESTED_BY` / `APPROVED_BY` / `EXECUTED_BY` (work lifecycle)

### 7) Comparison method: Terraform net-value score

Do comparison after graph inventory is materialized.

For each map category, score Terraform from 1-5 on:

1. Clarity gained
2. Complexity removed
3. State risk introduced
4. Drift detectability
5. Ownership bottleneck risk

Interpretation:

- High clarity + high complexity removed + low state risk => keep Terraform here.
- Low clarity + high state risk + high bottleneck risk => keep in MSP graph/runtime control plane.

### 8) Immediate next step (non-Terraform first)

1. Build environment graph inventory activity in `msp_aws` (read-only):
  - Enumerate all resource IDs for one account/region set.
2. Materialize the 11 dependency maps as views:
  - start with identity trust, network reachability, secret/key usage, service dependency.
3. Produce static vs parameterized classification output for each node type.
4. Add actor/work approval links for parameter changes.
5. Then evaluate Terraform as an implementation backend per map category, not as the top-level model.

## Terraform usage policy in this architecture

1. Primary model is the MSP graph domain, not Terraform state.
2. Terraform artifacts are allowed as:
  - resource/dependency reference corpus,
  - optional execution backend for selected lifecycle bundles,
  - parity oracle for expected dependency closure.
3. Avoid partial-authority Terraform ownership where MSP and Terraform both attempt primary lifecycle control of the same resources.
4. If Terraform is used for a bundle, keep authority boundaries explicit and machine-checkable.

## Why the MSP lifecycle model has structural advantages

This platform treats AWS operations as a continuously stateful application domain, not a stop-start provisioning workflow.

Core advantages:

1. Lifecycle-native control instead of plan/apply episodes
  - MSP keeps durable lifecycle state and transitions as first-class graph objects.
  - Terraform-style execution typically centers around periodic convergence runs.
2. Graph-centric truth model instead of state snapshot dependency
  - MSP can model desired state, observed state, and dependency closure in one graph domain.
  - Snapshot drift is detectable as graph deltas, not only as backend state divergence.
3. Work-centric permissioning instead of broad executor authority
  - Humans raise work; system actors execute scoped lifecycle transitions.
  - Authority is constrained by work intent, approval edges, and expiration semantics.
4. Permanent history and auditability
  - Every parameter decision, edge change, and execution action is attributable to actor plus work ID.
  - This supports replay, forensic traceability, and policy evolution from real change history.
5. Composable execution backends
  - Execution mechanism is pluggable per lifecycle bundle.
  - Terraform can be one backend where it is net-positive without owning the platform model.

### Practical implication for MSP AWS work

1. Keep graph model and lifecycle entities authoritative.
2. Use Terraform templates to harvest dependency patterns and closure heuristics.
3. Execute changes through system actors with auditable work pipelines.
4. Introduce Terraform execution only where scoring shows material clarity and complexity reduction.

### Decision guardrails

Use these checks before assigning any lifecycle bundle to Terraform execution:

1. Can MSP graph explain current plus desired plus dependency closure without external state assumptions?
2. Can authority remain work-scoped and actor-attributable end-to-end?
3. Can drift be detected and reconciled from observed resource reality first?
4. Does Terraform reduce operational complexity more than it adds state and ownership overhead?

If any answer is no, keep that bundle fully MSP-managed.

## Foundational Entry Point (Build Small, Validate Continuously)

Goal:

1. Prove the platform can execute one complete human-to-system work path against real AWS.
2. Avoid over-modeling by implementing only the minimum entities and edges needed for that path.

### Minimum viable slice

Required participants:

1. One human actor (`HumanOperatorActor`).
2. One system actor (`AwsDiscoverySystemActor`).
3. One work type (`VerifyAwsTenancyWork`).

Required capability:

1. System actor can connect to AWS and retrieve tenancy/subscription identity details.

Required output payload (first pass):

1. AWS account ID.
2. Account alias if present.
3. Caller identity ARN/principal details.
4. Region context used for request.
5. Retrieval timestamp and correlation/work IDs.

### Graph objects required for slice 1

Create only these initial node/edge classes:

1. `HumanActorNode`
2. `SystemActorNode`
3. `AwsConnectionProfileNode`
4. `AwsTenancySnapshotNode`
5. `WorkNode`

Edges:

1. `REQUESTED_BY` (`WorkNode` -> `HumanActorNode`)
2. `EXECUTED_BY` (`WorkNode` -> `SystemActorNode`)
3. `USES_CONNECTION_PROFILE` (`SystemActorNode` -> `AwsConnectionProfileNode`)
4. `PRODUCED` (`WorkNode` -> `AwsTenancySnapshotNode`)

### Workflow (end-to-end)

1. Human raises `VerifyAwsTenancyWork` with target environment/account context.
2. Policy checks authorize system actor execution for this work type.
3. System actor acquires AWS credentials through configured credential provider chain.
4. System actor calls identity APIs (`sts:GetCallerIdentity`; optional IAM alias lookup).
5. Result is persisted as `AwsTenancySnapshotNode` and linked to work plus actors.
6. Human can view outcome and raw evidence from one work record.

### Test-as-you-go acceptance criteria

Functional:

1. Work can be created, accepted, executed, and completed.
2. Valid credentials return expected tenancy payload.
3. Invalid/expired credentials fail with classified, non-ambiguous error states.

Security:

1. Human actor never directly executes AWS API calls.
2. System actor permissions are limited to identity discovery for this slice.
3. Secrets/tokens are never written to work payloads or logs.

Audit/history:

1. Every run has stable work ID, actor IDs, timestamps, and execution status.
2. Raw request and normalized result are both retained.
3. Failure cases retain diagnostic metadata without secret leakage.

Operability:

1. One command or UI action can re-run the work safely.
2. Retry behavior is explicit and bounded.
3. Time-to-result is measured and recorded.

### Objective scoring for foundational slice

Use a simple go/no-go plus score:

1. Gate checks (must all pass):
  - Functional 1-3
  - Security 1-3
  - Audit/history 1-3
2. Score dimensions (0-3 each):
  - Explainability of graph output
  - Reliability under retry/failure
  - Audit completeness
  - Ease of operator use
3. Promotion rule:
  - All gates pass and average score >= 2.0

### Immediate next slice: credential and token subsystem abstraction

After slice 1 succeeds, implement a provider abstraction so all system actors consume credentials consistently.

Initial abstraction contract:

1. `resolveCredentials(connectionProfileId, workContext) -> scoped credential handle`
2. `getCredentialMetadata(handle) -> issuer, expiry, scope summary`
3. `revokeOrInvalidate(handle)` where supported

Backends can include:

1. AWS profile/role chain
2. IAM role assumption flow
3. External secure store provider

Design constraints:

1. Credential material stays in secure subsystem boundaries.
2. Work records store only references and metadata, not raw secrets.
3. All credential access is attributable to system actor and work ID.

Implementation checklist:

1. See `docs/foundational-entrypoint-slice1-checklist.md` for an ordered 15-step execution plan.
