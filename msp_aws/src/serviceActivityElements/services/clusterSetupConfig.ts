import { matchesId, type ViewDataContent } from 'msp_common';
import { ReadData, WriteData, type ServiceActivityResultBuilder } from 'msp_svr_common';
import type { AwsClusterSetupConfig, ReadClusterSetupConfigPayload, 
  WriteClusterSetupConfigPayload, ReconcileClusterSetupConfigPayload,
   ClusterSetupPlanStep, 
   AwsResourceConfigStatus} from '../../data/clusterSetUpConfig.js';
import { awsClusterSetupConfigView } from '../../data/index.js';

const setupViewIdentifier = awsClusterSetupConfigView.getViewIdentifier!();

function setupKey(region: string, clusterName: string, setupId?: string) {
  return `${setupId ?? 'default'}::${region}::${clusterName}`;
}

function seedSetup(region: string, clusterName: string, setupId: string = 'aws-cluster-setup-default') {
  const content: ViewDataContent<AwsClusterSetupConfig> = {
    viewDomain: setupViewIdentifier.viewDomain,
    viewName: setupViewIdentifier.viewName,
    viewVersion: setupViewIdentifier.viewVersion,
    viewVariantName: setupViewIdentifier.viewVariantName,
    viewRootEntityType: 'awsClusterSetupConfig',
    viewRootEntityId: setupId,
    viewRootEntityBusKey: setupId,
    viewRootId: setupId,
    content: {
      __entityId: setupId,
      id: setupId,
      setupId,
      accountName: 'Unassigned',
      connectionStatus: 'unknown',
      connectionMessage: 'Not connected yet.',
      region,
      clusterName,
      wizardVersion: '1.0.0',
      status: 'draft',
      desiredState: {
        eks: {
          clusterVersion: '1.31',
          nodeCount: 2,
        },
        ecr: {
          repositories: ['actorwork/runtime', 'actorwork/tools'],
        },
        network: {
          vpcCidr: '10.42.0.0/16',
          publicSubnetCount: 2,
          privateSubnetCount: 2,
        },
      },
      updatedAt: new Date().toISOString(),
    },
  };

  return content;
}

function normalizeSetupRow(row: any): ViewDataContent<AwsClusterSetupConfig> | undefined {
  if (!row) {
    return undefined;
  }

  if (row.content && matchesId(row, setupViewIdentifier)) {
    return row as ViewDataContent<AwsClusterSetupConfig>;
  }

  if (row.content && row.setupId) {
    const setupId = row.setupId as string;
    return {
      viewDomain: setupViewIdentifier.viewDomain,
      viewName: setupViewIdentifier.viewName,
      viewVersion: setupViewIdentifier.viewVersion,
      viewVariantName: setupViewIdentifier.viewVariantName,
      viewRootEntityType: 'awsClusterSetupConfig',
      viewRootEntityId: setupId,
      viewRootEntityBusKey: setupId,
      viewRootId: setupId,
      content: row as AwsClusterSetupConfig,
    };
  }

  return undefined;
}

async function readSetup(payload: ReadClusterSetupConfigPayload): Promise<ViewDataContent<AwsClusterSetupConfig>[]> {
  const region = payload.region ?? 'eu-west-2';
  const clusterName = payload.clusterName ?? 'msp-dev-eks';
  const setupId = payload.setupId ?? 'aws-cluster-setup-default';
  const key = setupKey(region, clusterName, setupId);

  try {
    const readResult = await ReadData(awsClusterSetupConfigView, key);
    const normalized = normalizeSetupRow(readResult?.data ?? readResult?.result?.data ?? readResult);
    if (normalized) {
      return [normalized];
    }
  } catch {
    // Seed fallback path below.
  }

  return [seedSetup(region, clusterName, setupId)];
}

async function mergeSetup(payload: WriteClusterSetupConfigPayload): Promise<ViewDataContent<AwsClusterSetupConfig>> {
  const region = payload.region ?? 'eu-west-2';
  const clusterName = payload.clusterName ?? 'msp-dev-eks';
  const setupId = payload.setupId ?? 'aws-cluster-setup-default';
  const key = setupKey(region, clusterName, setupId);
  const existing = (await readSetup({ setupId, region, clusterName }))[0] ?? seedSetup(region, clusterName, setupId);

  const nextContent: ViewDataContent<AwsClusterSetupConfig> = {
    ...existing,
    content: {
      ...existing.content,
      ...payload,
      __entityId: setupId,
      id: setupId,
      setupId,
      region,
      clusterName,
      desiredState: {
        ...existing.content.desiredState,
        ...payload.desiredState,
        eks: {
          ...existing.content.desiredState.eks,
          ...payload.desiredState?.eks,
        },
        ecr: {
          ...existing.content.desiredState.ecr,
          ...payload.desiredState?.ecr,
        },
        network: {
          ...existing.content.desiredState.network,
          ...payload.desiredState?.network,
        },
      },
      updatedAt: new Date().toISOString(),
    },
  };

  const persistedPayload = {
    ...nextContent.content,
    __entityId: key,
    id: key,
  };

  await WriteData(awsClusterSetupConfigView, persistedPayload);

  return nextContent;
}

function buildReconcilePlan(setup: AwsClusterSetupConfig): ClusterSetupPlanStep[] {
  const plan: ClusterSetupPlanStep[] = [];

  if (setup.desiredState.eks?.clusterVersion) {
    plan.push({
      operation: 'update',
      path: 'desiredState.eks.clusterVersion',
      value: setup.desiredState.eks.clusterVersion,
    });
  }

  if (setup.desiredState.eks?.nodeCount !== undefined) {
    plan.push({
      operation: 'update',
      path: 'desiredState.eks.nodeCount',
      value: setup.desiredState.eks.nodeCount,
    });
  }

  if (setup.desiredState.ecr?.repositories?.length) {
    plan.push({
      operation: 'update',
      path: 'desiredState.ecr.repositories',
      value: setup.desiredState.ecr.repositories,
    });
  }

  if (setup.desiredState.network?.vpcCidr) {
    plan.push({
      operation: 'update',
      path: 'desiredState.network.vpcCidr',
      value: setup.desiredState.network.vpcCidr,
    });
  }

  if (plan.length === 0) {
    plan.push({ operation: 'noop', path: 'desiredState' });
  }

  return plan;
}

export async function readClusterSetupConfigHandler(
  payload: ReadClusterSetupConfigPayload,
  resultBuilder: ServiceActivityResultBuilder,
): Promise<ServiceActivityResultBuilder> {
  const setups = await readSetup(payload);
  resultBuilder.log(`Returning ${setups.length} AWS cluster setup config record(s)`);
  return resultBuilder.success({ data: setups });
}

export async function writeClusterSetupConfigHandler(
  payload: WriteClusterSetupConfigPayload,
  resultBuilder: ServiceActivityResultBuilder,
): Promise<ServiceActivityResultBuilder> {
  const updated = await mergeSetup(payload);
  resultBuilder.log(`Stored AWS cluster setup config for ${updated.content.clusterName} in ${updated.content.region}`);
  return resultBuilder.success({ data: [updated] });
}

export async function reconcileClusterSetupConfigHandler(
  payload: ReconcileClusterSetupConfigPayload,
  resultBuilder: ServiceActivityResultBuilder,
): Promise<ServiceActivityResultBuilder> {
  const region = payload.region ?? 'eu-west-2';
  const clusterName = payload.clusterName ?? 'msp-dev-eks';
  const setupId = payload.setupId ?? 'aws-cluster-setup-default';
  const current = (await readSetup({ setupId, region, clusterName }))[0] ?? seedSetup(region, clusterName, setupId);
  const plan = buildReconcilePlan(current.content);

  const reconciled = {
    ...current,
    content: {
      ...current.content,
      status: (payload.dryRun ? 'ready' : 'applied') as AwsResourceConfigStatus,
      updatedAt: new Date().toISOString(),
    },
  };

  if (!payload.dryRun) {
    await WriteData(awsClusterSetupConfigView, {
      ...reconciled.content,
      __entityId: setupKey(region, clusterName, setupId),
      id: setupKey(region, clusterName, setupId),
    });
  }

  resultBuilder.log(`Reconciliation plan includes ${plan.length} step(s) for ${clusterName} in ${region}`);
  return resultBuilder.success({ data: [reconciled], plan, dryRun: !!payload.dryRun });
}

