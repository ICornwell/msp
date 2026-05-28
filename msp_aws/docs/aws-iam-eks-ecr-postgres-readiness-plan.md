# AWS IAM + EKS + ECR + Postgres Readiness Plan

This document is a practical, production-oriented plan for getting from "I have an AWS account" to "I can securely build and operate real-world EKS + ECR + Postgres workloads".

It is written to support the MSP ActorWork + AWS control/monitoring direction, where AWS resources are created and managed through service activities and governed by permissions.

## Scope and Terminology

If you think in terms of "subscription / tenant":

- AWS account ID is the primary security and billing boundary.
- AWS Organizations provides multi-account structure (recommended).

For this plan, assume:

- You will run at least dev and prod in separate accounts.
- EKS is the compute platform.
- ECR hosts container images.
- Postgres is managed (RDS/Aurora PostgreSQL), not self-hosted in-cluster for production.

## Security Design Principles

1. Separate humans and workloads:
   - Humans use IAM Identity Center (SSO) + MFA.
   - Workloads use short-lived credentials (IRSA/Pod Identity, OIDC federation).
2. Least privilege always:
   - Narrow action scope.
   - Narrow resource scope.
   - Narrow trust policy scope.
3. No long-lived keys in code, pods, CI secrets, or developer machines.
4. One role per trust boundary, not one giant reusable role.
5. Guardrails first:
   - CloudTrail, Config, GuardDuty, Security Hub enabled before app rollout.

## Target Reference Architecture

- AWS Organizations with separate accounts by environment (`dev`, `staging`, `prod`) and optional `security/logging` account.
- VPC per environment with private EKS nodes/pods.
- ECR private repositories with immutable tags and vulnerability scanning.
- RDS/Aurora PostgreSQL in private subnets, encrypted, backup-enabled.
- EKS service accounts mapped to IAM roles (IRSA) or EKS Pod Identity.

## Phase 0: Prerequisites

1. Establish account strategy:
   - Minimum: 2 accounts (`dev`, `prod`).
   - Better: 3+ (`dev`, `staging`, `prod`) plus `security` account.
2. Decide infrastructure as code standard:
   - Terraform recommended for multi-account IAM and networking consistency.
3. Define naming/tagging conventions now:
   - `Environment`, `Service`, `Owner`, `CostCenter`, `DataClass`, `ManagedBy`.

## Phase 1: Organization and Identity Baseline

1. Configure AWS Organizations:
   - Create OUs for environment separation.
2. Configure IAM Identity Center:
   - Integrate IdP if available.
   - Enforce MFA.
3. Create permission sets:
   - `PlatformAdmin`
   - `PlatformOperator`
   - `ReadOnly`
   - `SecurityAuditor`
4. Restrict root usage:
   - No routine root logins.
   - Root credential access break-glass only.

## Phase 2: Mandatory Guardrails (Before Workloads)

Enable and protect the following:

1. CloudTrail (organization trail, all regions).
2. AWS Config (record all resources).
3. GuardDuty.
4. Security Hub.
5. IAM Access Analyzer.

Apply SCP guardrails:

1. Deny disabling CloudTrail/Config/GuardDuty.
2. Deny unsupported/forbidden regions.
3. Deny creation of IAM users/access keys outside approved workflows (optional but recommended).

## Phase 3: Network Foundation

For each environment account:

1. Create VPC with AZ-spread subnets:
   - Public subnets (load balancers/NAT only).
   - Private app subnets (EKS nodes/pods).
   - Private data subnets (RDS).
2. Add VPC endpoints:
   - ECR API, ECR DKR, S3, STS, CloudWatch Logs, Secrets Manager, KMS.
3. Tight security group design:
   - RDS ingress only from app SG(s).
   - No public DB exposure.

## Phase 4: ECR Setup and IAM

1. Create ECR repos per service and environment, for example:
   - `actorwork/dev`
   - `actorwork/prod`
   - `aws-control/dev`
2. Enable repository controls:
   - Image tag immutability.
   - Scan on push.
   - Lifecycle policies for old images.
3. IAM role split:
   - CI push role: can push only to approved repos.
   - Runtime pull permissions: only what nodes/pods require.

## Phase 5: EKS Setup and IAM Model

### Cluster and Node Roles

1. EKS control plane role (standard AWS-managed baseline).
2. Node group role with minimum required worker permissions.

### Add-on Service Account Roles

Create dedicated IAM roles for cluster add-ons (IRSA/Pod Identity):

1. Load balancer controller.
2. External DNS (if used).
3. Autoscaler/Karpenter.
4. EBS CSI driver.

### Application Service Account Roles

Create one IAM role per application service account that calls AWS APIs, for example:

1. `actorwork-sa-role`
2. `aws-control-sa-role`
3. `monitoring-sa-role`

Do not grant AWS API permissions to node roles for app behavior.

## Phase 6: Postgres (RDS/Aurora) Security Model

1. Use RDS PostgreSQL or Aurora PostgreSQL.
2. Require encryption at rest (KMS CMK).
3. Enable backup and point-in-time recovery.
4. Keep DB private (no public access).
5. Prefer IAM auth where feasible, otherwise Secrets Manager-managed credentials.
6. Use DB least privilege too:
   - Separate DB roles/users per service.
   - No shared admin user for application runtime.

## Phase 7: Workload Identity and Secrets

1. Use IRSA/Pod Identity for pod-to-AWS auth.
2. Store secrets in Secrets Manager.
3. Grant pod IAM roles only:
   - `secretsmanager:GetSecretValue` for specific secret ARNs.
   - `kms:Decrypt` for required keys.
4. Never store static AWS keys in Kubernetes secrets.

## Phase 8: CI/CD Federation and Deployment Permissions

1. Configure OIDC provider for CI platform (GitHub/GitLab/etc.).
2. Create per-environment deploy roles with strict trust conditions:
   - Specific org/repo.
   - Specific branch/tag/environment.
   - Optional workflow-level claims.
3. Grant deploy role only required actions:
   - Push images to specific ECR repos.
   - Update workloads in target EKS cluster/namespace.

## Phase 9: Observability, Audit, and Cost Controls

1. Enable cluster/container logs and metrics.
2. Add alerts for auth failures, denied API calls, and unusual IAM behavior.
3. Configure AWS Budgets and Cost Anomaly Detection.
4. Require resource tagging and enforce where possible.

## Phase 10: IAM Role Matrix (Initial Practical Template)

Recommended initial role set (per environment account):

1. `platform-admin-human-role`
2. `platform-operator-human-role`
3. `security-auditor-human-role`
4. `ci-deploy-role`
5. `eks-cluster-role`
6. `eks-node-role`
7. `irsa-aws-lb-controller-role`
8. `irsa-external-dns-role` (optional)
9. `irsa-autoscaler-role`
10. `irsa-ebs-csi-role`
11. `irsa-actorwork-role`
12. `irsa-aws-control-role`
13. `irsa-monitoring-role`

This is usually the right complexity level: enough isolation to be safe, not so much that operations become brittle.

## Phase 11: Acceptance Criteria (Ready for Real-World Use)

You are ready when all are true:

1. Human access is SSO + MFA only.
2. No long-lived human access keys.
3. CloudTrail/Config/GuardDuty/Security Hub are enabled and protected.
4. EKS workloads use IRSA/Pod Identity, not static credentials.
5. CI uses OIDC federation, not stored AWS keys.
6. ECR repos are immutable and scanned.
7. Postgres is private, encrypted, and backup-tested.
8. Per-service IAM roles and per-service DB identities exist.
9. Access Analyzer review has been performed.
10. Restore drills and cluster rebuild path are validated.

## Common Failure Patterns to Avoid

1. Overloading node role with app permissions.
2. One broad app role shared by many services.
3. CI roles with wildcard permissions across all environments.
4. Public RDS endpoints for convenience.
5. Missing trust policy constraints in OIDC roles.
6. Delaying guardrails until after delivery pressure starts.

## MSP-Specific Next Step

For the first functional slice of `msp_aws` + `msp_actorwork`, implement read-only activities first:

1. `aws/listEksClusters/1.0.0`
2. `aws/listEcrRepositories/1.0.0`

Then add controlled write activities with explicit IAM scopes:

1. `aws/createEcrRepository/1.0.0`
2. `aws/createEksCluster/1.0.0`
3. `aws/deprecateResource/1.0.0`

This sequence validates identity, guardrails, and operational observability before introducing higher-risk mutation paths.
