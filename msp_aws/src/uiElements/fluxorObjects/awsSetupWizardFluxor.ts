import type { FluxorData } from 'msp_common';

export type AwsSetupWizardRow = {
  setupId?: string;
  accountId?: string;
  region?: string;
  clusterName?: string;
  wizardVersion?: string;
  status?: string;
  updatedAt?: string;
};

export const awsSetupWizardFluxorData: FluxorData<AwsSetupWizardRow> = {
  setupId: {
    dictionaryName: 'aws-setup-id',
    attributeName: 'setup-id',
    label: 'Setup Id',
  },
  accountId: {
    dictionaryName: 'aws-account-id',
    attributeName: 'account-id',
    label: 'Account Id',
  },
  region: {
    dictionaryName: 'aws-region',
    attributeName: 'region',
    label: 'Region',
  },
  clusterName: {
    dictionaryName: 'aws-cluster-name',
    attributeName: 'cluster-name',
    label: 'Cluster Name',
  },
  wizardVersion: {
    dictionaryName: 'aws-wizard-version',
    attributeName: 'wizard-version',
    label: 'Wizard Version',
  },
  status: {
    dictionaryName: 'aws-setup-status',
    attributeName: 'setup-status',
    label: 'Status',
  },
  updatedAt: {
    dictionaryName: 'aws-updated-at',
    attributeName: 'updated-at',
    label: 'Updated At',
  },
};
