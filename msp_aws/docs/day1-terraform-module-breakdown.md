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
