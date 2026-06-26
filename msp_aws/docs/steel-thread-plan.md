# Infrastructure Wizard — Steel Thread Plan

## Purpose

A steel thread is the thinnest meaningful end-to-end path through the system.
It is deliberately incomplete but deliberately non-trivial: it should exercise enough
of the real stack to surface real problems early, and produce something observable
at the end (an apply-ready Terraform plan, or actual provisioned resources in AWS).

This plan targets: **wizard → desired-state config → reconcile plan → apply output**.

---

## Steel Thread Scope

### What it covers

| Area | In Scope | Notes |
|------|----------|-------|
| Wizard pages | All 7 pages, simplified | Not all options, but real data flowing through |
| Credential test + store | Yes | Already working |
| Environment intent | Yes | Picklist + region |
| Network zones | Consolidated mode only | One topology, 2 AZs, auto-calculated subnets |
| Security baseline | WAF + GuardDuty toggles only | Fixed defaults for others |
| Data services | Postgres + Redis t-shirt size | EdgeDB profiled but not provisioned |
| Resource naming | Yes | Cluster + ECR repos |
| Dry-run reconcile | Yes — Terraform plan output | Validates what would be created |
| Real apply (resource creation) | Optional / gated | Can be enabled via explicit apply action |

### What it deliberately excludes

- Namespace sub-division per zone
- Advanced CIDR/protocol overrides
- Shield Advanced, Macie, Network Firewall
- MemoryDB option (ElastiCache only)
- EdgeDB actual provisioning
- A/B mode
- Copy from / copy to environment
- Outbound API zone (zone present in model but merged with Feature Compute in consolidated mode)
- PEP enforcement (future scope)

---

## Page-by-Page Data Flow

### Page 1: Environment Intent

**Asks:** What is this environment for? What region?

| Field | Type | Purpose-framed label |
|-------|------|---------------------|
| `environmentPurpose` | Picklist | "What will this environment be used for?" |
| `abMode` | Toggle | "Will you need parallel version deployment (A/B / blue-green)?" |
| `region` | Picklist | "Which AWS region should host this environment?" |
| `clusterName` | Text | "Give this environment a short identifier name" |

**Effect on defaults:** `environmentPurpose` drives:
- topology mode default
- multi-AZ default
- security baseline defaults
- data service HA defaults

---

### Page 2: Trust and Identity

**Asks:** Who can deploy to this environment?

Already implemented (test + store credentials).

Steel thread addition: capture IAM deployment role ARN (optional at this stage — can be self-discovered from caller identity after credentials test).

---

### Page 3: Network Zones

**Asks:** How do you want to separate your workloads?

| Field | Type | Purpose-framed label |
|-------|------|---------------------|
| `topologyMode` | Radio | "How much network separation do you need?" (Consolidated / Standard / Full) |
| `azCount` | Stepper (2–3) | "How many availability zones for redundancy?" |

Show topology description beneath each option:
- **Consolidated** — "All workloads share a private network. Lower cost, suitable for development and testing."
- **Standard (Split-2)** — "Core platform separated from application workloads. Recommended for most live environments."
- **Full Split (3-zone)** — "Data, feature, and core platform each isolated. Required for production or compliance."

On "Calculate Network Plan" button press:
- Calls `calculateSubnetPlan` service activity (pure logic, no AWS call)
- Populates a read-only subnet preview table
- Stores `calculatedSubnetPlan` in desired state

[Advanced] toggle reveals per-subnet CIDR and protocol overrides.

**Steel thread**: Consolidated mode only. 2 AZs. 4 subnets: 2 public (DMZ), 2 private (all workloads).

---

### Page 4: Security Baseline

**Asks:** What security monitoring do you want enabled?

**Always on (no toggle):** VPC Flow Logs, CloudTrail, ACM certificates, Security Groups.

**Toggles (on by default, can be turned off):**
- "Protect against web attacks (WAF on your load balancer)" → `wafEnabled`
- "Enable threat detection (GuardDuty)" → `guardDuty`
- "Enable centralised security findings (Security Hub)" → `securityHub`

[Advanced]:
- AWS Shield Advanced
- Network Firewall
- Macie

**Steel thread**: WAF + GuardDuty + SecurityHub all defaulted on. No advanced options shown.

---

### Page 5: Data Services

**Asks:** What data infrastructure does this environment need?

#### PostgreSQL

"What size database does this environment need?"

| T-shirt | Instance class | Purpose label |
|---------|---------------|--------------|
| XS | db.t3.micro | Development / low-traffic |
| SM | db.t3.small | Small feature teams |
| MD | db.t3.medium | Standard live environments |
| LG | db.m6g.large | High-traffic or analytics-heavy |
| XL | db.m6g.xlarge | Production with large data volumes |

"Should the database be highly available (recommended for live environments)?" → `multiAz`

#### Redis

"Do you need a cache layer (Redis)?"

If yes:
- T-shirt size (XS → LG)
- "Is Redis used only as a cache, or also as a primary store?" → `mode: cache | durable`

#### EdgeDB

"Does this environment include the core graph database (EdgeDB)?"

If yes (default for non-dev):
- "Use a dedicated Postgres instance for the graph database, or share with the platform database?" → `dedicatedPostgres`
- T-shirt size for EKS deployment profile

**Steel thread**: MD Postgres, multi-AZ off for dev/SIT, SM Redis cache mode, EdgeDB with shared Postgres.

---

### Page 6: Resource Naming

Already implemented. Steel thread addition:
- `environmentPrefix` field: short prefix prepended to all resource names (e.g. `dev`, `sit`, `prod`)
- Preview generated names for EKS cluster, ECR repos, RDS instance, ElastiCache cluster

---

### Page 7: Review and Apply

**Shows:**
- Summary table of all selected zones, subnets, services
- Estimated resource count
- Dry-run reconcile button: "Validate Plan (no changes made)"
  - Calls reconcile activity
  - Returns plan steps as a structured list
  - Shows planned creates / updates / noops
- Apply button (gated: only enabled after successful dry-run)
  - Calls apply activity
  - Streams progress

[Placeholder]: "Copy this configuration to another environment" (future)

---

## Service Activity Plan

### New activities required for steel thread

| Activity | Namespace | Type | Description |
|----------|-----------|------|-------------|
| `calculateSubnetPlan` | `aws` | Service | Pure logic: topology mode + AZ count → subnet plan |
| `reconcileInfrastructure` | `aws` | Service | Compare desired state vs observed → produce plan steps |
| `applyInfrastructure` | `aws` | Service (long-running) | Execute plan steps against AWS |
| `getObservedInfrastructureState` | `aws` | Data | Read current AWS resource state (VPC, subnets, EKS, RDS) |

### Existing activities reused

- `connectAwsCredentials` (test + store)
- `writeClusterSetupConfig` (persist wizard state)
- `readClusterSetupConfig` (reload wizard state)
- `refreshAwsWizardViews` (trigger after changes)

---

## Data Model Changes Required

`AwsClusterSetupDesiredState` (in `clusterSetUpConfig.ts`) needs extending to:

```typescript
type EnvironmentPurpose =
  | 'coreDev' | 'featureDev' | 'platformSoak' | 'platformSIT'
  | 'enterpriseSIT' | 'platformEVT' | 'enterpriseUAT' | 'preProduction' | 'production';

type TopologyMode = 'consolidated' | 'split2' | 'fullSplit';

type SubnetEntry = {
  name: string;
  zoneType: 'dmz' | 'corePlatform' | 'compute' | 'managedData';
  az: string;
  cidr: string;
  tier: 'public' | 'private' | 'isolated';
};

type AwsClusterSetupDesiredState = {
  environmentPurpose?: EnvironmentPurpose;
  abMode?: boolean;
  topologyMode?: TopologyMode;
  azCount?: number;
  subnetPlan?: SubnetEntry[];
  security?: {
    wafEnabled: boolean;
    guardDuty: boolean;
    securityHub: boolean;
    cloudTrail: boolean;
    flowLogs: boolean;
  };
  postgres?: {
    instanceSize: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
    multiAz: boolean;
    engine: 'rds' | 'aurora';
  };
  redis?: {
    enabled: boolean;
    nodeSize: 'xs' | 'sm' | 'md' | 'lg';
    mode: 'cache' | 'durable';
  };
  edgeDb?: {
    enabled: boolean;
    dedicatedPostgres: boolean;
    resourceProfile: 'xs' | 'sm' | 'md' | 'lg';
  };
  eks?: {
    clusterVersion?: string;
    nodeCount?: number;
    environmentPrefix?: string;
  };
  ecr?: {
    repositories?: { repositoryName: string; repositoryUri?: string; region: string; }[];
  };
  network?: {
    // Legacy fields kept for backward compatibility during migration
    vpcCidr?: string;
    publicSubnetCount?: number;
    privateSubnetCount?: number;
  };
};
```

---

## Build Sequence

The cleanest order to build the steel thread:

1. **Expand data model** — add new desired state fields, update schema, keep legacy fields
2. **Replace Network page** — zone topology picker + AZ count + calculate subnets action
3. **Add Security baseline page** — three toggles with purpose-framed labels
4. **Add Data Services page** — Postgres + Redis + EdgeDB profiles
5. **Update Environment Intent page** — environment purpose picklist drives defaults
6. **Update Resource Naming page** — add environment prefix, show generated names preview
7. **Update Review page** — structured summary table
8. **Implement `calculateSubnetPlan` activity** — pure logic, no AWS call, testable
9. **Implement `reconcileInfrastructure` dry-run** — compares desired state to observed, returns plan steps
10. **Wire wizard behaviors** — connect new pages to activity calls and data refresh
11. **Implement `applyInfrastructure`** — actual AWS provisioning (can use AWS SDK calls or generate Terraform plan)

Steps 1–7 are pure UI/model work (no AWS calls). Steps 8–9 are the core reconcile logic.
Step 11 is the production-readiness gate and can be deferred until the dry-run is validated end-to-end.

---

## What We Learn From This Thread

Running the steel thread end-to-end will validate:

- The wizard state model is rich enough to drive real infrastructure decisions
- Defaults derived from environment purpose are sensible and consistent
- `calculateSubnetPlan` produces a correct, non-overlapping CIDR allocation
- Reconcile diff logic correctly identifies gaps between desired and observed state
- The apply activity can round-trip cleanly (create → observed → reconcile → noop)
- The wizard UX is navigable by a non-AWS-specialist (usability signal)
- Credential store + vault interaction works end-to-end in a real AWS session

These lessons directly shape the more detailed flows (split-2, full split, advanced options, data service variants).
