import type { DataObject, ViewDataContent } from 'msp_common';
import type { ServiceActivity, ServiceActivityResultBuilder } from 'msp_svr_common';

export type AwsClusterSetupDesiredState = {
  eks?: {
    clusterVersion?: string;
    nodeCount?: number;
  };
  ecr?: {
    repositories?: string[];
  };
  network?: {
    vpcCidr?: string;
    publicSubnetCount?: number;
    privateSubnetCount?: number;
  };
};

export type AwsClusterSetupConfig = {
  setupId: string;
  accountId?: string;
  region: string;
  clusterName: string;
  wizardVersion: string;
  status: 'draft' | 'ready' | 'applied' | 'drifted';
  desiredState: AwsClusterSetupDesiredState;
  updatedAt: string;
} & Partial<DataObject>;

export type ReadClusterSetupConfigPayload = {
  setupId?: string;
  region?: string;
  clusterName?: string;
};

export type WriteClusterSetupConfigPayload = Partial<AwsClusterSetupConfig> & {
  setupId?: string;
  region?: string;
  clusterName?: string;
};

export type ReconcileClusterSetupConfigPayload = {
  setupId?: string;
  region?: string;
  clusterName?: string;
  dryRun?: boolean;
};

export type ClusterSetupPlanStep = {
  operation: 'create' | 'update' | 'noop';
  path: string;
  value?: unknown;
};

const setupStore = new Map<string, ViewDataContent<AwsClusterSetupConfig>>();

function setupKey(region: string, clusterName: string, setupId?: string) {
  return `${setupId ?? 'default'}::${region}::${clusterName}`;
}

function seedSetup(region: string, clusterName: string, setupId: string = 'aws-cluster-setup-default') {
  const content: ViewDataContent<AwsClusterSetupConfig> = {
    viewDomain: 'aws',
    viewName: 'AwsClusterSetupConfig',
    viewVersion: '1.0.0',
    viewRootEntityType: 'awsClusterSetupConfig',
    viewRootEntityId: setupId,
    viewRootEntityBusKey: setupId,
    viewRootId: setupId,
    content: {
      __entityId: setupId,
      id: setupId,
      setupId,
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

  setupStore.set(setupKey(region, clusterName, setupId), content);
  return content;
}

function readSetup(payload: ReadClusterSetupConfigPayload): ViewDataContent<AwsClusterSetupConfig>[] {
  const setups = Array.from(setupStore.values());
  const filtered = setups.filter((setup) => {
    const matchesRegion = !payload.region || setup.content.region === payload.region;
    const matchesCluster = !payload.clusterName || setup.content.clusterName === payload.clusterName;
    const matchesSetup = !payload.setupId || setup.content.setupId === payload.setupId;
    return matchesRegion && matchesCluster && matchesSetup;
  });

  if (filtered.length > 0) {
    return filtered;
  }

  if (payload.region && payload.clusterName) {
    return [seedSetup(payload.region, payload.clusterName, payload.setupId)];
  }

  return [];
}

function mergeSetup(payload: WriteClusterSetupConfigPayload): ViewDataContent<AwsClusterSetupConfig> {
  const region = payload.region ?? 'eu-west-2';
  const clusterName = payload.clusterName ?? 'msp-dev-eks';
  const setupId = payload.setupId ?? 'aws-cluster-setup-default';
  const key = setupKey(region, clusterName, setupId);
  const existing = setupStore.get(key) ?? seedSetup(region, clusterName, setupId);

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

  setupStore.set(key, nextContent);
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

async function readClusterSetupConfigHandler(
  payload: ReadClusterSetupConfigPayload,
  resultBuilder: ServiceActivityResultBuilder,
): Promise<ServiceActivityResultBuilder> {
  const setups = readSetup(payload);
  resultBuilder.log(`Returning ${setups.length} AWS cluster setup config record(s)`);
  return resultBuilder.success({ data: setups });
}

async function writeClusterSetupConfigHandler(
  payload: WriteClusterSetupConfigPayload,
  resultBuilder: ServiceActivityResultBuilder,
): Promise<ServiceActivityResultBuilder> {
  const updated = mergeSetup(payload);
  resultBuilder.log(`Stored AWS cluster setup config for ${updated.content.clusterName} in ${updated.content.region}`);
  return resultBuilder.success({ data: [updated] });
}

async function reconcileClusterSetupConfigHandler(
  payload: ReconcileClusterSetupConfigPayload,
  resultBuilder: ServiceActivityResultBuilder,
): Promise<ServiceActivityResultBuilder> {
  const region = payload.region ?? 'eu-west-2';
  const clusterName = payload.clusterName ?? 'msp-dev-eks';
  const setupId = payload.setupId ?? 'aws-cluster-setup-default';
  const current = setupStore.get(setupKey(region, clusterName, setupId)) ?? seedSetup(region, clusterName, setupId);
  const plan = buildReconcilePlan(current.content);

  const reconciled = {
    ...current,
    content: {
      ...current.content,
      status: payload.dryRun ? 'ready' : 'applied',
      updatedAt: new Date().toISOString(),
    },
  };

  if (!payload.dryRun) {
    setupStore.set(setupKey(region, clusterName, setupId), reconciled);
  }

  resultBuilder.log(`Reconciliation plan includes ${plan.length} step(s) for ${clusterName} in ${region}`);
  return resultBuilder.success({ data: [reconciled], plan, dryRun: !!payload.dryRun });
}

seedSetup('eu-west-2', 'msp-dev-eks');

export const ReadClusterSetupConfigActivity: ServiceActivity = {
  namespace: 'aws',
  activityName: 'readClusterSetupConfig',
  version: '1.0.0',
  matchingVersionRange: '^1.0.0',
  context: '*',
  funcs: readClusterSetupConfigHandler,
};

export const WriteClusterSetupConfigActivity: ServiceActivity = {
  namespace: 'aws',
  activityName: 'writeClusterSetupConfig',
  version: '1.0.0',
  matchingVersionRange: '^1.0.0',
  context: '*',
  funcs: writeClusterSetupConfigHandler,
};

export const ReconcileClusterSetupConfigActivity: ServiceActivity = {
  namespace: 'aws',
  activityName: 'reconcileClusterSetupConfig',
  version: '1.0.0',
  matchingVersionRange: '^1.0.0',
  context: '*',
  funcs: reconcileClusterSetupConfigHandler,
};
