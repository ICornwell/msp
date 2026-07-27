import { FluxorData } from "msp_ui_common/uiLib/renderEngine";

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

export const EcrSetupWizardDraftFluxorData: FluxorData<EcrSetupWizardDraftFluxorRow> = {
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
    dictionaryName: 'ecr-status',
    attributeName: 'status',
    label: 'Status',
  },
  updatedAt: {
    dictionaryName: 'ecr-updated-at',
    attributeName: 'updated-at',
    label: 'Updated At',
  },
  desiredState: {

    label: 'Desired State',
    isComplex: true,

    children: {
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
      addNewEcr: {
        dictionaryName: 'ecr-add-new-ecr',
        attributeName: 'add-new-ecr',
        label: 'Add New ECR',
      },
      pendingRepositoryName: {
        dictionaryName: 'ecr-pending-repository-name',
        attributeName: 'pending-repository-name',
        label: 'Pending Repository Name',
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
      repositories: {
        isArray: true,
        isComplex: true,
        children: {
          repositoryName: {
            dictionaryName: 'ecr-repositories-repository-name',
            attributeName: 'repository-name',
            label: 'Repository Name',
          },
          region: {
            dictionaryName: 'ecr-repositories-region',
            attributeName: 'region',
            label: 'Region',
          },
          mode: {
            dictionaryName: 'ecr-repositories-mode',
            attributeName: 'mode',
            label: 'Mode',
          },
          existingRepositoryUri: {
            dictionaryName: 'ecr-repositories-existing-repository-uri',
            attributeName: 'existing-repository-uri',
            label: 'Existing Repository URI',
          },
          scanOnPush: {
            dictionaryName: 'ecr-repositories-scan-on-push',
            attributeName: 'scan-on-push',
            label: 'Scan On Push',
          },
          imageTagMutability: {
            dictionaryName: 'ecr-repositories-image-tag-mutability',
            attributeName: 'image-tag-mutability',
            label: 'Image Tag Mutability',
          },
          encryptionType: {
            dictionaryName: 'ecr-repositories-encryption-type',
            attributeName: 'encryption-type',
            label: 'Encryption Type',
          },
        },
      },
      lifecyclePolicy: {
        dictionaryName: 'ecr-lifecycle-policy',
        attributeName: 'lifecycle-policy',
        label: 'Lifecycle Policy',
        isComplex: true,
        children: {
          enabled: {
            dictionaryName: 'ecr-lifecycle-enabled',
            attributeName: 'enabled',
            label: 'Enabled',
          },
          untaggedRetentionDays: {
            dictionaryName: 'ecr-lifecycle-untagged-retention-days',
            attributeName: 'untagged-retention-days',
            label: 'Untagged Retention Days',
          },
          maxImageCount: {
            dictionaryName: 'ecr-lifecycle-max-image-count',
            attributeName: 'max-image-count',
            label: 'Max Image Count',
          },
        },
      },
    },
  }
}


