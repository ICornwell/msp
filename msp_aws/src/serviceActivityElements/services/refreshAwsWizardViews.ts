import type { ViewDataContent } from 'msp_common';
import { runServiceActivity, type ServiceActivityResultBuilder } from 'msp_svr_common';

export type AwsWizardRefreshName =
  | 'setupConfig'
  | 'wizardBootstrap'
  | 'eksClusters'
  | 'ecrRepositories'
  | 'networkTopology'
  | 'inventorySnapshot'
  | 'desiredResourceConfig';

export type RefreshAwsWizardViewsPayload = {
  setupId?: string;
  clusterName?: string;
  region?: string;
  setupCaseId?: string;
  setupRunId?: string;
  refreshes?: AwsWizardRefreshName[];
};

const defaultRefreshes: AwsWizardRefreshName[] = [
  'setupConfig',
  'wizardBootstrap',
  'eksClusters',
  'ecrRepositories',
  'networkTopology',
];

type ActivityResponse = {
  success?: boolean;
  message?: string;
  result?: {
    data?: ViewDataContent<any>[];
  };
};

function getRows(response: ActivityResponse): ViewDataContent<any>[] {
  const rows = response?.result?.data;
  return Array.isArray(rows) ? rows : [];
}

export async function refreshAwsWizardViewsHandler(
  payload: RefreshAwsWizardViewsPayload,
  resultBuilder: ServiceActivityResultBuilder,
): Promise<ServiceActivityResultBuilder> {
  const setupId = payload.setupId ?? 'aws-cluster-setup-default';
  const region = payload.region ?? 'eu-west-2';
  const clusterName = payload.clusterName ?? 'msp-dev-eks';
  const setupCaseId = payload.setupCaseId ?? 'aws-setup-case-default';
  const setupRunId = payload.setupRunId ?? 'aws-setup-run-draft';
  const refreshes = payload.refreshes?.length ? payload.refreshes : defaultRefreshes;

  const calls: Partial<Record<AwsWizardRefreshName, Promise<ActivityResponse>>> = {
    setupConfig: runServiceActivity('aws', 'readClusterSetupConfig', '1.0.0', {
      setupId,
      region,
      clusterName,
    }),
    wizardBootstrap: runServiceActivity('aws', 'getAwsWizardBootstrap', '1.0.0', {
      setupCaseId,
      setupRunId,
      setupId,
      region,
      clusterName,
    }),
    eksClusters: runServiceActivity('aws', 'listEksClusters', '1.0.0', { region }),
    ecrRepositories: runServiceActivity('aws', 'listEcrRepositories', '1.0.0', { region }),
    networkTopology: runServiceActivity('aws', 'awsNetworkTopology', '1.0.0', { region }),
    inventorySnapshot: runServiceActivity('aws', 'awsInventorySnapshot', '1.0.0', { region }),
    desiredResourceConfig: runServiceActivity('aws', 'readAwsDesiredResourceConfig', '1.0.0', {
      setupCaseId,
      setupRunId,
      region,
    }),
  };

  const settled = await Promise.all(
    refreshes.map(async (name) => {
      try {
        const response = await calls[name]!;
        return { name, response, error: undefined };
      } catch (error: any) {
        return { name, response: undefined, error };
      }
    }),
  );

  const rows: ViewDataContent<any>[] = [];
  const failed: Array<{ refresh: AwsWizardRefreshName; message: string }> = [];

  for (const item of settled) {
    if (item.error) {
      failed.push({
        refresh: item.name,
        message: item.error?.message || 'Unknown refresh error',
      });
      continue;
    }

    const { name, response } = item;
    if (response?.success) {
      rows.push(...getRows(response));
    } else {
      failed.push({
        refresh: name,
        message: response?.message || `Refresh ${name} failed`,
      });
    }
  }

  resultBuilder.log(
    `Refreshed AWS wizard views: completed=${refreshes.length - failed.length}, failed=${failed.length}.`,
  );

  return resultBuilder.success({
    data: rows,
    refreshesRequested: refreshes,
    refreshesFailed: failed,
  });
}