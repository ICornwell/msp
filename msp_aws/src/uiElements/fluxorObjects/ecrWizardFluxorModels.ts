export type EcrSetupWizardDraftFluxorRow = {
  setupId?: string;
  accountId?: string;
  accountName?: string;
  region?: string;
  wizardVersion?: string;
  status?: string;
  updatedAt?: string;
  desiredState?: {
    repositoryPrefix?: string;
    namingConventionMode?: string;
    addNewEcr?: boolean;
    pendingRepositoryName?: string;
    defaultRegion?: string;
    scanOnPushDefault?: boolean;
    imageTagMutabilityDefault?: string;
    encryptionTypeDefault?: string;
    repositories?: Array<{
      repositoryName: string;
      region: string;
      mode: string;
      existingRepositoryUri?: string;
      scanOnPush?: boolean;
      imageTagMutability?: string;
      encryptionType?: string;
    }>;
    lifecyclePolicy?: {
      enabled?: boolean;
      untaggedRetentionDays?: number;
      maxImageCount?: number;
    };
  };
};
