# MSP Infrastructure Architecture and Wizard Design

## Purpose

This document describes the intended AWS infrastructure architecture for hosting the MightySmallPlatform,
and the configuration journey design for the Infrastructure Setup Wizard.
It is intended as a shared reference for both wizard implementation and operator onboarding.

---

## 1. What Are We Building?

MSP is a hosted platform consisting of:

- **Service activities** — business logic services deployed as containerised workloads
- **Data activities** — data access and persistence services
- **Feature/API activities** — outward-facing API and browser-facing features
- **Core platform services** — identity (security), orchestration (servicehub), graph database (datahub + EdgeDB), cache, and message bus

These workloads run on **Kubernetes (AWS EKS)** with:
- Container images stored in **AWS ECR**
- Persistent data in **RDS PostgreSQL** (managed) and **ElastiCache Redis** (managed)
- EdgeDB running inside EKS backed by its own PostgreSQL instance
- Secrets managed through the MSP vault (msp_security) backed by the graph database

---

## 2. Network Architecture: Zone Model

Rather than asking an operator to specify raw subnet counts, the wizard works in terms of **zones** — logical groupings of workloads with distinct trust and access characteristics.
The subnet plan is **calculated** from the zone selection.

### Zone Types

| Zone | Purpose | EKS Node Group | Subnet Tier |
|------|---------|----------------|-------------|
| **DMZ** | Load balancers, WAF, DNS ingress, TLS termination | — (no EKS) | Public |
| **Core Platform** | servicehub, msp_security, datahub, EdgeDB, cache, bus | core | Private |
| **Feature Compute** | Internal feature activities (no outbound data rights) | features | Private |
| **Outbound API Zone** | Outward-facing API features — data access via PEP only | api | Private |
| **Data Compute** | Data activities and adapters | data | Private |
| **Managed Data** | RDS, ElastiCache (AWS-managed, no node group) | — | Private (isolated) |

### Outbound Data Policy Enforcement Point (PEP)

The separation of **Outbound API Zone** from **Feature Compute** and **Data Compute** is architectural, not cosmetic.
The rule is:

> Outbound API features may **only** export data that has passed through the PEP layer.

The PEP is a second instance of datahub (or a config-toggled variant) deployed in Core Platform, sitting between
the Outbound API zone and the rest of the estate. It enforces:

- **No direct connectivity** from Outbound API zone → Data Compute or Core Platform, except via PEP endpoints
- **No direct connectivity** from Outbound API zone → Feature Compute (no lateral movement to non-outbound features)
- All data flowing outbound is **audit logged** with who/what/when/why at the PEP boundary
- Data volume and shape policies (e.g. row limits, field masking, classification checks) are applied at the PEP

This means even a compromised outbound API feature cannot exfiltrate data without the PEP's knowledge,
because there is no network path that bypasses it. The network zone structure enforces this at the infrastructure
layer (Security Groups, NACLs, Network Policies in EKS) not just at the application layer.

**Scope note:**
- Use of AWS SDKs (e.g. by msp_aws service activities talking to AWS APIs) does **not** count as outbound API use — these are internal infrastructure/platform calls, not consumer data exports.
- The Outbound API Hub PEP is **currently out of scope** for the initial wizard implementation. The zone separation and network policy scaffolding should be designed to accommodate it, but the PEP service itself is a future workstream. For now, the Outbound API zone can be treated as equivalent to Feature Compute, with the separation made structurally ready but not yet enforced.

Network policy implication for the wizard:
- Outbound API zone gets its own subnet tier (structurally separate, not yet policy-enforced)
- Future: no route from Outbound API → Data Compute except via PEP endpoint
- PEP endpoint will sit in Core Platform zone on a dedicated internal load balancer (not public)

### Topology Modes

The wizard offers three topology modes, selected based on scale and isolation requirements:

| Mode | Zones Created | When to Use |
|------|---------------|-------------|
| **Consolidated** | DMZ + Core Platform (features/data co-hosted) | Dev, small SIT, low-cost environments |
| **Split (2-zone compute)** | DMZ + Core + Feature+Data combined compute | Standard environments, moderate scale |
| **Full split (3-zone compute)** | DMZ + Core + Feature compute + Data compute | Production, performance-sensitive, compliance |

### Namespace Sub-division

Within each compute zone, workloads can be further isolated by Kubernetes namespace:

- **None** — all namespaces share the subnet pool
- **By namespace group** — user-defined namespace groups get dedicated subnet associations (via EKS node selectors and network policies)

### Subnet Calculation

Given topology mode + AZ count (typically 2 or 3), the wizard calculates:
- One public subnet per AZ for the DMZ zone
- One private subnet per AZ per private zone
- One isolated subnet per AZ for managed data (no internet route, only VPC-local)

Users can then review and override:
- CIDR range per subnet
- Allowed protocols per zone
- NAT gateway placement (one per AZ vs shared)

---

## 3. DMZ and Security Baseline Components

### Standard DMZ Components (always recommended)

| Component | Purpose |
|-----------|---------|
| Application Load Balancer (ALB) | HTTP/HTTPS routing, TLS termination, path/header routing |
| AWS WAF | Web Application Firewall on ALB — OWASP rule sets, rate limiting, IP allow/deny |
| Route 53 | DNS management, health-checked failover, private hosted zones for internal service discovery |
| ACM (Certificate Manager) | Managed TLS certificates for ALB |
| VPC Flow Logs | Network traffic logging for security analysis and audit |

### Security and Monitoring (template config, togglable)

| Component | Purpose | Default |
|-----------|---------|---------|
| AWS GuardDuty | Threat detection (unusual API calls, recon activity, malicious IPs) | On |
| AWS Security Hub | Aggregated security findings, compliance posture | On |
| AWS CloudTrail | Full API audit trail — who did what, when | On |
| AWS CloudWatch | Metrics, alarms, log aggregation | On |
| Amazon Macie | Sensitive data discovery (especially S3) — DLP-oriented | Optional |
| AWS Shield Standard | DDoS baseline protection (free, automatic) | Always on |
| AWS Shield Advanced | Enhanced DDoS response + cost protection | Optional (production) |
| AWS Network Firewall | Deep packet inspection, stateful firewall rules at VPC level | Optional (compliance) |

---

## 4. Managed Data Services

### PostgreSQL

AWS offers two options — wizard should let operator choose:

| Option | Best For |
|--------|----------|
| **RDS PostgreSQL** | Straightforward managed Postgres, most familiar, standard use |
| **Aurora PostgreSQL** | Higher performance, auto-scaling storage, multi-AZ active-passive built-in |

Configuration captured:
- Instance class
- Multi-AZ (always recommended for non-dev)
- Backup retention window
- Storage size and auto-scaling
- Encryption at rest (always on)
- VPC subnet group (managed data zone)
- Parameter group / Postgres version

### Redis (Cache / Session)

| Option | Best For |
|--------|----------|
| **ElastiCache for Redis** | Standard cache, session store — most common choice |
| **Amazon MemoryDB for Redis** | Durable Redis-compatible service — if Redis is used as primary store not just cache |

Configuration captured:
- Node type
- Cluster mode (single node vs replicated)
- Multi-AZ
- Encryption in-transit and at-rest
- Eviction policy

### EdgeDB

EdgeDB runs **inside EKS** (Core Platform zone) and manages its own PostgreSQL instance underneath. It is not a managed AWS service.

Configuration captured by wizard:
- Dedicated Postgres RDS instance (separate from platform-wide Postgres, or shared — operator choice)
- Storage class for EKS persistent volumes (gp3 recommended)
- Replica count (1 for dev, 2+ for production)
- Memory/CPU resource profile

---

## 5. Ingress and DNS Summary

| Pattern | When to Use |
|---------|-------------|
| Single ALB with host/path routing | Dev, consolidated environments |
| ALB per zone (internal + external) | Production, compliance, strict separation |
| Internal-only (no public ALB) | Air-gapped, enterprise private environments |

Route 53 private hosted zone for internal service discovery (e.g. `core.internal`, `data.internal`)
is recommended for all environments to avoid hardcoded IPs.

---

## 6. Environment Purpose and Promotion

The wizard's first step is selecting the **environment purpose**. This determines defaults for
topology, redundancy, backup, and cost profile throughout the rest of the wizard.

### Environment Purposes

| Environment | Purpose | Typical Topology | HA Required | Notes |
|-------------|---------|-----------------|-------------|-------|
| **Core Dev** | Platform core development | Consolidated | No | Lowest cost, minimal HA |
| **Feature Dev** | Feature team development | Consolidated or Split-2 | No | Per-feature-team, ephemeral |
| **Platform Soak & Performance** | Sustained load and performance profiling | Full split | No (single-AZ ok) | Needs realistic data volumes |
| **Platform SIT** | Platform system integration testing | Split-2 | No | Platform teams only |
| **Enterprise SIT** | Enterprise system integration | Split-2 or Full | Light | Enterprise consumers testing against platform |
| **Platform EVT** | Platform engineering verification | Full split | Light | Pre-release validation |
| **Enterprise UAT** | Enterprise user acceptance | Full split | Yes | Should mirror production config |
| **Pre-production** | Final validation before release | Full split | Yes | Production config, reduced data |
| **Production** | Live operational environment | Full split | Yes | Full HA, all security baseline on |

### A/B Mode

All environments support an A/B mode flag:
- Enables parallel deployment of two versions of the platform (blue/green or canary)
- Affects EKS node group naming, ALB routing rules, and service discovery
- Default: off (single deployment)

### Environment Copy (future)

A planned "copy from / copy to" feature will allow:
- **Pull config** from a running environment (export desired-state config into this wizard)
- **Push config** to a target environment (promote a configuration across the promotion chain)

This is scaffolded as a placeholder in the review step for now.

---

## 7. Wizard Journey Design Principles

### For the Admin User (not necessarily AWS-expert)

- Questions are framed around **purpose and impact**, not AWS service names
- AWS-specific terminology appears as supporting context, not the primary prompt
- Sensible defaults are pre-populated for the selected environment purpose
- Calculated outputs (subnets, security rules) are shown for review and override, not entered from scratch

### Advanced Settings

- Hidden by default behind an **"Advanced Settings"** toggle
- Advanced items include:
  - Raw CIDR overrides
  - NAT gateway placement
  - Specific instance class selection (vs t-shirt size)
  - Custom WAF rule sets
  - Shield Advanced opt-in
  - Network Firewall enable
  - Macie enable
  - MemoryDB vs ElastiCache choice

### Inline Guidance Pattern

Every section should carry a short `why` explanation:
> *"This controls how your workloads are separated across the network. More separation increases security and simplifies compliance auditing but adds cost and operational complexity."*

This is the same embedded-doc pattern described in platform docs design — eventually these descriptions are graph objects, editable by platform operators without code changes.

---

## 8. Proposed Wizard Page Flow

```
1. Environment Intent
   - Environment purpose (picklist: Core Dev → Production)
   - A/B mode toggle
   - Region
   - Account

2. Trust and Identity
   - AWS account credentials (test + store)
   - IAM role/ARN for deployment identity
   - Workload identity configuration (IRSA / OIDC)

3. Network Zones
   - Topology mode (Consolidated / Split-2 / Full split)
   - AZ count
   - [Advanced] Namespace sub-division per zone
   - [Calculate Subnets] → subnet preview table
   - [Advanced] Per-subnet CIDR and protocol overrides

4. Security Baseline
   - DMZ profile (ALB + WAF + Route 53 — on by default)
   - Security monitoring profile (GuardDuty, Security Hub, CloudTrail — on by default)
   - [Advanced] DLP (Macie), Network Firewall, Shield Advanced

5. Data Services
   - PostgreSQL: t-shirt size + Multi-AZ toggle (RDS/Aurora advanced toggle)
   - Redis: t-shirt size + persistence mode (cache-only vs durable)
   - EdgeDB: co-hosted vs dedicated Postgres

6. Resource Naming
   - Cluster name
   - Namespace prefixes
   - ECR repository naming pattern
   - [Advanced] Tag strategy

7. Review and Apply
   - Summary of all configured zones, subnets, services
   - Dry-run reconciliation (validate plan without creating resources)
   - [Placeholder: Copy from / Copy to environment]
   - Apply button
```

---

## 9. Data Model Extensions Required

Based on the above, `AwsClusterSetupDesiredState` needs to be extended to include:

```typescript
type EnvironmentPurpose =
  | 'coreDev' | 'featureDev' | 'platformSoak' | 'platformSIT'
  | 'enterpriseSIT' | 'platformEVT' | 'enterpriseUAT' | 'preProduction' | 'production';

type TopologyMode = 'consolidated' | 'split2' | 'fullSplit';

type ZoneConfig = {
  zoneType: 'dmz' | 'corePlatform' | 'featureCompute' | 'dataCompute' | 'managedData';
  namespaceSplitMode: 'none' | 'byNamespaceGroup';
  targetNamespaces?: string[];
};

type SubnetPlan = {
  azCount: number;
  subnets: Array<{
    zoneType: string;
    az: string;
    cidr: string;
    tier: 'public' | 'private' | 'isolated';
    allowedProtocols?: string[];
  }>;
};

type IngressProfile = {
  externalAlbEnabled: boolean;
  internalAlbEnabled: boolean;
  wafEnabled: boolean;
  dnsMode: 'route53Public' | 'route53Private' | 'none';
};

type SecurityProfile = {
  guardDuty: boolean;
  securityHub: boolean;
  cloudTrail: boolean;
  flowLogs: boolean;
  macie: boolean;
  networkFirewall: boolean;
  shieldAdvanced: boolean;
};

type PostgresProfile = {
  engine: 'rds' | 'aurora';
  instanceSize: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  multiAz: boolean;
  backupRetentionDays: number;
};

type RedisProfile = {
  nodeSize: 'xs' | 'sm' | 'md' | 'lg';
  mode: 'cache' | 'durable';
  multiAz: boolean;
};

type EdgeDbProfile = {
  dedicatedPostgres: boolean;
  replicaCount: number;
  storageClass: string;
  resourceProfile: 'xs' | 'sm' | 'md' | 'lg';
};
```

These additions feed both the wizard display and the eventual reconcile/apply activity that provisions real AWS resources.
