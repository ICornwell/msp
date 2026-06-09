export type AwsSetupPlatformIntentUi = {
  environmentName?: string;
  platformPurpose?: string;
  setupMode?: 'fresh' | 'extend';
  serviceFocus?: 'core' | 'functional' | 'data' | 'mixed';
};

export type AwsSetupTrustIdentityUi = {
  accountOwnerIdentityMode?: 'createNew' | 'useExisting';
  deploymentIdentityMode?: 'createNew' | 'useExisting';
  workloadIdentityMode?: 'createNew' | 'useExisting';
  serviceIdentityMode?: 'createNew' | 'useExisting';
  accountOwnerIdentityRef?: string;
  deploymentIdentityRef?: string;
  workloadIdentityRef?: string;
  serviceIdentityRef?: string;
};

export type AwsSetupNetworkShapeUi = {
  useStandardSixZoneShape?: boolean;
  zones?: string[];
  dmzDirectAccessPolicy?: string;
  proxyViaPlatformServicesPolicy?: string;
  securityRingFenceLevel?: string;
};

export type AwsSetupResourceNamingUi = {
  accountSetName?: string;
  clusterName?: string;
  namespaceNames?: string[];
  subnetNames?: string[];
  roleNames?: string[];
  repositoryNames?: string[];
  namingConventionMode?: 'default' | 'advanced';
};

export type AwsSetupReviewUi = {
  planSummary?: string;
  newResourceCount?: number;
  existingResourceCount?: number;
  warningCount?: number;
  errorCount?: number;
};

export type AwsSetupWizardDraftUi = {
  setupCaseId: string;
  setupRunId: string;
  setupId: string;
  accountId?: string;
  accountName?: string;
  region: string;
  wizardVersion: string;
  status: 'draft' | 'ready' | 'applied' | 'drifted';
  updatedAt: string;
  platformIntent: AwsSetupPlatformIntentUi;
  trustIdentity: AwsSetupTrustIdentityUi;
  networkShape: AwsSetupNetworkShapeUi;
  resourceNaming: AwsSetupResourceNamingUi;
  review: AwsSetupReviewUi;
};

export type AwsObservedResourceUiRow = {
  resourceKey: string;
  resourceType: string;
  name: string;
  region: string;
  state: string;
  providerArn?: string;
};

export type AwsReconcileUiRow = {
  resourceKey: string;
  deltaType: string;
  severity: 'info' | 'warning' | 'error';
  recommendation?: string;
};

export type AwsDependencyNodeUiRow = {
  resourceKey: string;
  resourceType: string;
  displayName: string;
  state?: string;
};

export type AwsDependencyEdgeUiRow = {
  fromResourceKey: string;
  toResourceKey: string;
  relationType: string;
  criticality: 'low' | 'medium' | 'high';
};
