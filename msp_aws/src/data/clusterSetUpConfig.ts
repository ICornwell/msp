import { DataObject } from "msp_common";

export type EnvironmentPurpose =
  | 'coreDev'
  | 'featureDev'
  | 'platformSoak'
  | 'platformSIT'
  | 'enterpriseSIT'
  | 'platformEVT'
  | 'enterpriseUAT'
  | 'preProduction'
  | 'production';

export type TopologyMode = 'consolidated' | 'split2' | 'fullSplit';

export type AwsClusterSetupRepository = {
  repositoryName: string;
  repositoryUri?: string;
  region: string;
} & Partial<DataObject>;

export type SubnetEntry = {
  name: string;
  zoneType: 'dmz' | 'corePlatform' | 'compute' | 'featureCompute' | 'dataCompute' | 'managedData';
  az: string;
  cidr: string;
  tier: 'public' | 'private' | 'isolated';
  allowedProtocols?: string[];
};

export type AwsSecurityProfile = {
  wafEnabled: boolean;
  guardDuty: boolean;
  securityHub: boolean;
  cloudTrail: boolean;
  flowLogs: boolean;
  macie?: boolean;
  networkFirewall?: boolean;
  shieldAdvanced?: boolean;
};

export type AwsPostgresProfile = {
  engine: 'rds' | 'aurora';
  instanceSize: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  multiAz: boolean;
  backupRetentionDays?: number;
};

export type AwsRedisProfile = {
  enabled: boolean;
  nodeSize: 'xs' | 'sm' | 'md' | 'lg';
  mode: 'cache' | 'durable';
  multiAz?: boolean;
};

export type AwsEdgeDbProfile = {
  enabled: boolean;
  dedicatedPostgres: boolean;
  resourceProfile: 'xs' | 'sm' | 'md' | 'lg';
  storageClass?: string;
  replicaCount?: number;
};

export type AwsClusterSetupDesiredState = {
  // --- Topology ---
  topologyMode?: TopologyMode;
  azCount?: number;
  subnetPlan?: SubnetEntry[];
  vpcCidr?: string;

  // --- Security ---
  security?: AwsSecurityProfile;

  // --- Data services ---
  postgres?: AwsPostgresProfile;
  redis?: AwsRedisProfile;
  edgeDb?: AwsEdgeDbProfile;

  // --- Compute ---
  eks?: {
    clusterVersion?: string;
    nodeCount?: number;
    environmentPrefix?: string;
  };

  // --- Container registry ---
  ecr?: {
    repositories?: AwsClusterSetupRepository[];
  };

  // --- Legacy network fields (kept for backward compatibility) ---
  network?: {
    vpcCidr?: string;
    publicSubnetCount?: number;
    privateSubnetCount?: number;
  };
};

export type AwsResourceConfigStatus = 'draft' | 'ready' | 'applied' | 'drifted';
export type AwsClusterSetupConfig = {
  setupId: string;
  accountId?: string;
  accountName?: string;
  accessKeyId?: string;
  environmentPurpose?: EnvironmentPurpose;
  abMode?: boolean;
  connectionStatus?: 'success' | 'failed' | 'unknown';
  connectionMessage?: string;
  connectionCheckedAt?: string;
  region: string;
  clusterName: string;
  wizardVersion: string;
  status: AwsResourceConfigStatus;
  desiredState: AwsClusterSetupDesiredState;
  updatedAt: string;
} & Partial<DataObject>;

export type ReadClusterSetupConfigPayload = {
  setupId?: string;
  region?: string;
  clusterName?: string;
};

export type WriteClusterSetupConfigPayload = Partial<AwsClusterSetupConfig> & {
  setupId?: string;
  region?: string;
  clusterName?: string;
};

export type ReconcileClusterSetupConfigPayload = {
  setupId?: string;
  region?: string;
  clusterName?: string;
  dryRun?: boolean;
};

export type ClusterSetupPlanStep = {
  operation: 'create' | 'update' | 'noop';
  path: string;
  value?: unknown;
};