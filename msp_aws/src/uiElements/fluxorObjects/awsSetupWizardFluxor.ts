import type { FluxorData } from 'msp_common';
import type { AwsSetupWizardDraftFluxorRow } from './awsWizardFluxorModels.js';

export const awsSetupWizardFluxorData: FluxorData<AwsSetupWizardDraftFluxorRow> = {
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
  accountName: {
    dictionaryName: 'aws-account-name',
    attributeName: 'account-name',
    label: 'Account Name',
  },
  connectionStatus: {
    dictionaryName: 'aws-connection-status',
    attributeName: 'connection-status',
    label: 'Connection Status',
  },
  connectionMessage: {
    dictionaryName: 'aws-connection-message',
    attributeName: 'connection-message',
    label: 'Connection Message',
  },
  connectionCheckedAt: {
    dictionaryName: 'aws-connection-checked-at',
    attributeName: 'connection-checked-at',
    label: 'Connection Checked At',
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
  environmentPurpose: {
    dictionaryName: 'aws-environment-purpose',
    attributeName: 'environment-purpose',
    label: 'Environment Purpose',
  },
  abMode: {
    dictionaryName: 'aws-ab-mode',
    attributeName: 'ab-mode',
    label: 'A/B Mode',
  },
};
