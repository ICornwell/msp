import type { FluxorData } from 'msp_common';
import type { AwsSetupWizardDraftFluxorRow } from './awsWizardFluxorModels.js';

type AwsDesiredState = NonNullable<AwsSetupWizardDraftFluxorRow['desiredState']>;
type AwsSecurityState = NonNullable<AwsDesiredState['security']>;
type AwsPostgresState = NonNullable<AwsDesiredState['postgres']>;
type AwsRedisState = NonNullable<AwsDesiredState['redis']>;
type AwsEdgeDbState = NonNullable<AwsDesiredState['edgeDb']>;

export const awsSecurityFluxorData: FluxorData<AwsSecurityState> = {
  wafEnabled: {
    dictionaryName: 'aws-security-waf-enabled',
    attributeName: 'waf-enabled',
    label: 'WAF Enabled',
  },
  guardDuty: {
    dictionaryName: 'aws-security-guard-duty',
    attributeName: 'guard-duty',
    label: 'GuardDuty Enabled',
  },
  securityHub: {
    dictionaryName: 'aws-security-security-hub',
    attributeName: 'security-hub',
    label: 'Security Hub Enabled',
  },
};

export const awsPostgresFluxorData: FluxorData<AwsPostgresState> = {
  instanceSize: {
    dictionaryName: 'aws-postgres-instance-size',
    attributeName: 'instance-size',
    label: 'Postgres Instance Size',
  },
  multiAz: {
    dictionaryName: 'aws-postgres-multi-az',
    attributeName: 'multi-az',
    label: 'Postgres Multi-AZ',
  },
};

export const awsRedisFluxorData: FluxorData<AwsRedisState> = {
  enabled: {
    dictionaryName: 'aws-redis-enabled',
    attributeName: 'enabled',
    label: 'Redis Enabled',
  },
  nodeSize: {
    dictionaryName: 'aws-redis-node-size',
    attributeName: 'node-size',
    label: 'Redis Node Size',
  },
  mode: {
    dictionaryName: 'aws-redis-mode',
    attributeName: 'mode',
    label: 'Redis Mode',
  },
};

export const awsEdgeDbFluxorData: FluxorData<AwsEdgeDbState> = {
  enabled: {
    dictionaryName: 'aws-edgedb-enabled',
    attributeName: 'enabled',
    label: 'EdgeDB Enabled',
  },
  dedicatedPostgres: {
    dictionaryName: 'aws-edgedb-dedicated-postgres',
    attributeName: 'dedicated-postgres',
    label: 'Dedicated Postgres',
  },
  resourceProfile: {
    dictionaryName: 'aws-edgedb-resource-profile',
    attributeName: 'resource-profile',
    label: 'EdgeDB Resource Profile',
  },
};

export const awsDesiredStateFluxorData: FluxorData<AwsDesiredState> = {
  topologyMode: {
    dictionaryName: 'aws-topology-mode',
    attributeName: 'topology-mode',
    label: 'Topology Mode',
  },
  azCount: {
    dictionaryName: 'aws-az-count',
    attributeName: 'az-count',
    label: 'Availability Zones',
  },
  vpcCidr: {
    dictionaryName: 'aws-vpc-cidr',
    attributeName: 'vpc-cidr',
    label: 'VPC CIDR',
  },
  security: {
    dictionaryName: 'aws-security-config',
    attributeName: 'security',
    label: 'Security Configuration',
    isComplex: true,
    ...awsSecurityFluxorData,
  },
  postgres: {
    dictionaryName: 'aws-postgres-config',
    attributeName: 'postgres',
    label: 'Postgres Configuration',
    isComplex: true,
    ...awsPostgresFluxorData,
  },
  redis: {
    dictionaryName: 'aws-redis-config',
    attributeName: 'redis',
    label: 'Redis Configuration',
    isComplex: true,
    ...awsRedisFluxorData,
  },
  edgeDb: {
    dictionaryName: 'aws-edgedb-config',
    attributeName: 'edge-db',
    label: 'EdgeDB Configuration',
    isComplex: true,
    ...awsEdgeDbFluxorData,
  },
};

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
  desiredState: {
    dictionaryName: 'aws-desired-state',
    attributeName: 'desired-state',
    label: 'Desired State',
    isComplex: true,
    ...awsDesiredStateFluxorData,
  },
};
