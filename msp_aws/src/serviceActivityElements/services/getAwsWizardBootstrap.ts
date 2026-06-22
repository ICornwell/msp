import type { ViewDataContent } from 'msp_common';
import { runServiceActivity, type ServiceActivityResultBuilder } from 'msp_svr_common';

import type { AwsSetupWizardDraftUi } from '../models/awsUiModels.js';
import type { AwsClusterSetupDesiredState } from '../../data/clusterSetUpConfig.js';

export type GetAwsWizardBootstrapPayload = {
  setupCaseId?: string;
  setupRunId?: string;
  setupId?: string;
  region?: string;
  clusterName?: string;
};

type AwsClusterSetupRecord = {
  setupId?: string;
  accountId?: string;
  accountName?: string;
  region?: string;
  clusterName?: string;
  wizardVersion?: string;
  status?: 'draft' | 'ready' | 'applied' | 'drifted';
  desiredState?: AwsClusterSetupDesiredState;
  updatedAt?: string;
};

type AwsInventorySnapshotRecord = {
  collectedAt?: string;
  counts?: {
    eksClusters?: number;
    ecrRepositories?: number;
    iamRoles?: number;
    networkShapes?: number;
  };
};

type AwsDesiredConfigRecord = {
  resources?: Array<{
    resourceKey: string;
    resourceType: string;
  }>;
};

function firstDataContent<T>(response: any): T | undefined {
  const rows = (response?.result?.data ?? []) as Array<ViewDataContent<T>>;
  return rows[0]?.content;
}

function asRows(response: any): any[] {
  return (response?.result?.data ?? []) as any[];
}

export async function getAwsWizardBootstrapHandler(
  payload: GetAwsWizardBootstrapPayload,
  resultBuilder: ServiceActivityResultBuilder,
): Promise<ServiceActivityResultBuilder> {
  const region = payload.region ?? 'eu-west-2';
  const setupId = payload.setupId ?? 'aws-cluster-setup-default';
  const clusterName = payload.clusterName ?? 'msp-dev-eks';
  const setupCaseId = payload.setupCaseId ?? 'aws-setup-case-default';
  const setupRunId = payload.setupRunId ?? 'aws-setup-run-draft';

  const [
    setupResponse,
    desiredConfigResponse,
    iamRolesResponse,
    networkResponse,
    inventoryResponse,
  ] = await Promise.all([
    runServiceActivity('aws', 'readClusterSetupConfig', '1.0.0', {
      setupId,
      region,
      clusterName,
    }),
    runServiceActivity('aws', 'readAwsDesiredResourceConfig', '1.0.0', {
      setupCaseId,
      setupRunId,
      region,
    }),
    runServiceActivity('aws', 'awsIamRoles', '1.0.0', { region }),
    runServiceActivity('aws', 'awsNetworkTopology', '1.0.0', { region }),
    runServiceActivity('aws', 'awsInventorySnapshot', '1.0.0', { region }),
  ]);

  const setup = firstDataContent<AwsClusterSetupRecord>(setupResponse);
  const desiredConfig = firstDataContent<AwsDesiredConfigRecord>(desiredConfigResponse);
  const inventory = firstDataContent<AwsInventorySnapshotRecord>(inventoryResponse);
  const iamRows = asRows(iamRolesResponse);
  const networkRows = asRows(networkResponse);

  const bootstrapDraft: AwsSetupWizardDraftUi & {
    observedSummary: {
      collectedAt?: string;
      iamRoleCount: number;
      networkShapeCount: number;
      inventoryCounts: AwsInventorySnapshotRecord['counts'];
      desiredResourceCount: number;
    };
  } = {
    setupCaseId,
    setupRunId,
    setupId: setup?.setupId ?? setupId,
    accountId: setup?.accountId,
    accountName: setup?.accountName,
    region: setup?.region ?? region,
    wizardVersion: setup?.wizardVersion ?? '1.0.0',
    status: setup?.status ?? 'draft',
    updatedAt: setup?.updatedAt ?? new Date().toISOString(),
    platformIntent: {
      environmentName: 'dev',
      platformPurpose: 'AWS platform setup',
      setupMode: 'fresh',
      serviceFocus: 'mixed',
    },
    trustIdentity: {
      accountOwnerIdentityMode: iamRows.length > 0 ? 'useExisting' : 'createNew',
      deploymentIdentityMode: iamRows.length > 0 ? 'useExisting' : 'createNew',
      workloadIdentityMode: iamRows.length > 0 ? 'useExisting' : 'createNew',
      serviceIdentityMode: iamRows.length > 0 ? 'useExisting' : 'createNew',
    },
    networkShape: {
      useStandardSixZoneShape: true,
      zones: [
        'MSP Core',
        'Functional Services',
        'Data Services',
        'Browser DMZ',
        'API DMZ',
        'Agents DMZ',
      ],
      dmzDirectAccessPolicy: 'proxy-preferred',
      proxyViaPlatformServicesPolicy: 'required',
      securityRingFenceLevel: 'strict',
    },
    resourceNaming: {
      clusterName: setup?.clusterName ?? clusterName,
      repositoryNames: (setup?.desiredState?.ecr?.repositories ?? []).map((repository) => repository.repositoryName),
      namingConventionMode: 'default',
    },
    review: {
      planSummary: 'Bootstrap summary assembled from data activity snapshots.',
      existingResourceCount: desiredConfig?.resources?.length ?? 0,
      warningCount: 0,
      errorCount: 0,
    },
    observedSummary: {
      collectedAt: inventory?.collectedAt,
      iamRoleCount: iamRows.length,
      networkShapeCount: networkRows.length,
      inventoryCounts: inventory?.counts,
      desiredResourceCount: desiredConfig?.resources?.length ?? 0,
    },
  };

  const row: ViewDataContent<typeof bootstrapDraft> = {
    namespace: 'aws',
    name: 'AwsWizardBootstrap',
    version: '1.0.0',
    viewRootEntityType: 'awsWizardBootstrap',
    viewRootEntityId: setupRunId,
    viewRootBusinessKey: setupRunId,
    viewRootId: setupRunId,
    content: bootstrapDraft,
  };

  resultBuilder.log('Aggregated AWS wizard bootstrap from setup/data activity sources.');
  return resultBuilder.success({ data: [row] });
}
