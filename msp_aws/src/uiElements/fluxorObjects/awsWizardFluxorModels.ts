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
  desiredState?: {
    eks?: {
      clusterVersion?: string;
      nodeCount?: number;
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
