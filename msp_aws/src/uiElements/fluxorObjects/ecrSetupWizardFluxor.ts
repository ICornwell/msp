import type { FluxorData } from 'msp_common';
import type { EcrSetupWizardDraftFluxorRow } from './ecrWizardFluxorModels.js';

type EcrDesiredState = NonNullable<EcrSetupWizardDraftFluxorRow['desiredState']>;
type EcrLifecyclePolicyState = NonNullable<EcrDesiredState['lifecyclePolicy']>;

export const ecrLifecyclePolicyFluxorData: FluxorData<EcrLifecyclePolicyState> = {
  enabled: {
    dictionaryName: 'ecr-lifecycle-enabled',
    attributeName: 'enabled',
    label: 'Lifecycle Policy Enabled',
  },
  untaggedRetentionDays: {
    dictionaryName: 'ecr-lifecycle-untagged-days',
    attributeName: 'untagged-retention-days',
    label: 'Untagged Retention Days',
  },
  maxImageCount: {
    dictionaryName: 'ecr-lifecycle-max-image-count',
    attributeName: 'max-image-count',
    label: 'Max Image Count',
  },
};

export const ecrDesiredStateFluxorData: FluxorData<EcrDesiredState> = {
  repositoryPrefix: {
    dictionaryName: 'ecr-repository-prefix',
    attributeName: 'repository-prefix',
    label: 'Repository Prefix',
  },
  namingConventionMode: {
    dictionaryName: 'ecr-naming-convention-mode',
    attributeName: 'naming-convention-mode',
    label: 'Naming Convention Mode',
  },
  defaultRegion: {
    dictionaryName: 'ecr-default-region',
    attributeName: 'default-region',
    label: 'Default Region',
  },
  scanOnPushDefault: {
    dictionaryName: 'ecr-scan-on-push-default',
    attributeName: 'scan-on-push-default',
    label: 'Scan On Push Default',
  },
  imageTagMutabilityDefault: {
    dictionaryName: 'ecr-image-tag-mutability-default',
    attributeName: 'image-tag-mutability-default',
    label: 'Image Tag Mutability Default',
  },
  encryptionTypeDefault: {
    dictionaryName: 'ecr-encryption-type-default',
    attributeName: 'encryption-type-default',
    label: 'Encryption Type Default',
  },
  addNewEcr: {
    dictionaryName: 'ecr-add-new',
    attributeName: 'add-new-ecr',
    label: 'Add New ECR',
  },
  pendingRepositoryName: {
    dictionaryName: 'ecr-pending-repository-name',
    attributeName: 'pending-repository-name',
    label: 'Pending Repository Name',
  },
  lifecyclePolicy: {
    dictionaryName: 'ecr-lifecycle-policy',
    attributeName: 'lifecycle-policy',
    label: 'Lifecycle Policy',
    isComplex: true,
    ...ecrLifecyclePolicyFluxorData,
  },
};

export const ecrSetupWizardFluxorData: FluxorData<EcrSetupWizardDraftFluxorRow> = {
  setupId: {
    dictionaryName: 'ecr-setup-id',
    attributeName: 'setup-id',
    label: 'Setup Id',
  },
  accountId: {
    dictionaryName: 'ecr-account-id',
    attributeName: 'account-id',
    label: 'Account Id',
  },
  accountName: {
    dictionaryName: 'ecr-account-name',
    attributeName: 'account-name',
    label: 'Account Name',
  },
  region: {
    dictionaryName: 'ecr-region',
    attributeName: 'region',
    label: 'Region',
  },
  wizardVersion: {
    dictionaryName: 'ecr-wizard-version',
    attributeName: 'wizard-version',
    label: 'Wizard Version',
  },
  status: {
    dictionaryName: 'ecr-setup-status',
    attributeName: 'setup-status',
    label: 'Status',
  },
  updatedAt: {
    dictionaryName: 'ecr-updated-at',
    attributeName: 'updated-at',
    label: 'Updated At',
  },
  desiredState: {
    dictionaryName: 'ecr-desired-state',
    attributeName: 'desired-state',
    label: 'Desired State',
    isComplex: true,
    ...ecrDesiredStateFluxorData,
  },
};
