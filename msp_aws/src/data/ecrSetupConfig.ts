export type EcrRepositoryMode = 'importExisting' | 'createNew';
export type EcrTagMutability = 'MUTABLE' | 'IMMUTABLE';
export type EcrEncryptionType = 'AES256' | 'KMS';

export type EcrRepositoryPlanEntry = {
  repositoryName: string;
  region: string;
  mode: EcrRepositoryMode;
  recordId?: string;
  existingRepositoryUri?: string;
  scanOnPush?: boolean;
  imageTagMutability?: EcrTagMutability;
  encryptionType?: EcrEncryptionType;
};

export type EcrLifecyclePolicy = {
  enabled?: boolean;
  untaggedRetentionDays?: number;
  maxImageCount?: number;
};

export type EcrSetupDesiredState = {
  addNewEcr?: boolean;
  pendingRepositoryName?: string;
  repositoryPrefix?: string;
  namingConventionMode?: 'default' | 'custom';
  defaultRegion?: string;
  repositories?: EcrRepositoryPlanEntry[];
  scanOnPushDefault?: boolean;
  imageTagMutabilityDefault?: EcrTagMutability;
  encryptionTypeDefault?: EcrEncryptionType;
  lifecyclePolicy?: EcrLifecyclePolicy;
};

export type EcrSetupConfigStatus = 'draft' | 'ready' | 'applied' | 'drifted';

export type EcrSetupConfig = {
  setupId: string;
  accountId?: string;
  accountName?: string;
  region: string;
  wizardVersion: string;
  status: EcrSetupConfigStatus;
  desiredState: EcrSetupDesiredState;
  updatedAt: string;
};

export type ReadEcrSetupConfigPayload = {
  setupId?: string;
  region?: string;
};

export type WriteEcrSetupConfigPayload = Partial<EcrSetupConfig> & {
  setupId?: string;
  region?: string;
};

export type ReconcileEcrSetupConfigPayload = {
  setupId?: string;
  region?: string;
  dryRun?: boolean;
};

export type EcrSetupPlanStep = {
  operation: 'create' | 'update' | 'noop';
  path: string;
  value?: unknown;
};
