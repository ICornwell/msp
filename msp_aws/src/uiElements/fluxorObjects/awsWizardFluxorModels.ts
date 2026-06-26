export type AwsSetupWizardDraftFluxorRow = {
  setupCaseId?: string;
  setupRunId?: string;
  setupId?: string;
  accountId?: string;
  accountName?: string;
  accessKeyId?: string;
  secretAccessKey?: string;
  sessionToken?: string;
  connectionStatus?: 'success' | 'failed' | 'unknown';
  connectionMessage?: string;
  connectionCheckedAt?: string;
  region?: string;
  clusterName?: string;
  wizardVersion?: string;
  status?: string;
  updatedAt?: string;
  environmentPurpose?: string;
  abMode?: boolean;
  desiredState?: {
    topologyMode?: string;
    azCount?: number;
    vpcCidr?: string;
    subnetPlan?: Array<{
      name: string;
      zoneType: string;
      az: string;
      cidr: string;
      tier: string;
      allowedProtocols?: string[];
    }>;
    security?: {
      wafEnabled?: boolean;
      guardDuty?: boolean;
      securityHub?: boolean;
      cloudTrail?: boolean;
      flowLogs?: boolean;
      macie?: boolean;
      networkFirewall?: boolean;
      shieldAdvanced?: boolean;
    };
    postgres?: {
      engine?: string;
      instanceSize?: string;
      multiAz?: boolean;
      backupRetentionDays?: number;
    };
    redis?: {
      enabled?: boolean;
      nodeSize?: string;
      mode?: string;
      multiAz?: boolean;
    };
    edgeDb?: {
      enabled?: boolean;
      dedicatedPostgres?: boolean;
      resourceProfile?: string;
    };
    eks?: {
      clusterVersion?: string;
      nodeCount?: number;
      environmentPrefix?: string;
    };
    ecr?: {
      repositories?: {
        repositoryName: string;
        repositoryUri?: string;
        region: string;
      }[];
    };
    network?: {
      vpcCidr?: string;
      publicSubnetCount?: number;
      privateSubnetCount?: number;
    };
  };
};
