import { DataObject } from "msp_common";

export type AwsClusterSetupRepository = {
  repositoryName: string;
  repositoryUri?: string;
  region: string;
} & Partial<DataObject>;

export type AwsClusterSetupDesiredState = {
  eks?: {
    clusterVersion?: string;
    nodeCount?: number;
  };
  ecr?: {
    repositories?: AwsClusterSetupRepository[];
  };
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