import { matchesId, type ViewDataContent } from 'msp_common';
import { ReadData, WriteData, type ServiceActivityResultBuilder } from 'msp_svr_common';

import type {
  EcrSetupConfig,
  EcrSetupConfigStatus,
  EcrSetupPlanStep,
  ReadEcrSetupConfigPayload,
  ReconcileEcrSetupConfigPayload,
  WriteEcrSetupConfigPayload,
} from '../../data/ecrSetupConfig.js';
import { ecrSetupConfigObject, ecrSetupConfigView } from '../../data/index.js';

const ecrSetupViewIdentifier = ecrSetupConfigView.getViewIdentifier!();

function seedEcrSetup(region: string, setupId: string = 'aws-ecr-setup-default') {
  const content: ViewDataContent<EcrSetupConfig> = {
    namespace: ecrSetupViewIdentifier.namespace,
    name: ecrSetupViewIdentifier.name,
    version: ecrSetupViewIdentifier.version,
    variantName: ecrSetupViewIdentifier.variantName,
    viewRootEntityType: 'ecrSetupConfig',
    viewRootEntityId: setupId,
    viewRootBusinessKey: setupId,
    viewRootId: setupId,
    content: {
      setupId,
      region,
      wizardVersion: '1.0.0',
      status: 'draft',
      desiredState: {
        repositoryPrefix: 'actorwork',
        namingConventionMode: 'default',
        defaultRegion: region,
        scanOnPushDefault: true,
        imageTagMutabilityDefault: 'IMMUTABLE',
        encryptionTypeDefault: 'AES256',
        repositories: [
          {
            repositoryName: 'actorwork/dev',
            region,
            mode: 'createNew',
            scanOnPush: true,
            imageTagMutability: 'IMMUTABLE',
            encryptionType: 'AES256',
          },
        ],
        lifecyclePolicy: {
          enabled: true,
          untaggedRetentionDays: 14,
          maxImageCount: 200,
        },
      },
      updatedAt: new Date().toISOString(),
    },
  };

  return content;
}

function normalizeEcrSetupRow(row: any): ViewDataContent<EcrSetupConfig> | undefined {
  if (!row) {
    return undefined;
  }

  if (row.content && matchesId(row, ecrSetupViewIdentifier)) {
    return row as ViewDataContent<EcrSetupConfig>;
  }

  if (row.content && row.setupId) {
    const setupId = row.setupId as string;
    return {
      namespace: ecrSetupViewIdentifier.namespace,
      name: ecrSetupViewIdentifier.name,
      version: ecrSetupViewIdentifier.version,
      variantName: ecrSetupViewIdentifier.variantName,
      viewRootEntityType: 'ecrSetupConfig',
      viewRootEntityId: setupId,
      viewRootBusinessKey: setupId,
      viewRootId: setupId,
      content: row as EcrSetupConfig,
    };
  }

  return undefined;
}

async function readEcrSetup(payload: ReadEcrSetupConfigPayload): Promise<ViewDataContent<EcrSetupConfig>[]> {
  const region = payload.region ?? 'eu-west-2';
  const setupId = payload.setupId ?? 'aws-ecr-setup-default';
  const key = ecrSetupConfigObject.getBusinessKey({ setupId, region });

  try {
    if (!key) {
      throw new Error('Missing required key fields for ECR setup config');
    }
    const readResult = await ReadData(ecrSetupConfigView, key, { useBusinessKey: true });
    const normalized = normalizeEcrSetupRow(readResult?.data ?? readResult?.result?.data ?? readResult);
    if (normalized) {
      return [normalized];
    }
  } catch {
    // Seed fallback below.
  }

  const firstSetup = seedEcrSetup(region, setupId);
  const firstKey = ecrSetupConfigObject.getBusinessKey(firstSetup.content);
  firstSetup.viewRootBusinessKey = firstKey!;

  return [firstSetup];
}

async function mergeEcrSetup(payload: WriteEcrSetupConfigPayload): Promise<ViewDataContent<EcrSetupConfig>> {
  const region = payload.region ?? 'eu-west-2';
  const setupId = payload.setupId ?? 'aws-ecr-setup-default';
  const existing = (await readEcrSetup({ setupId, region }))[0] ?? seedEcrSetup(region, setupId);

  const nextContent: ViewDataContent<EcrSetupConfig> = {
    ...existing,
    content: {
      ...existing.content,
      ...payload,
      setupId,
      region,
      desiredState: {
        ...existing.content.desiredState,
        ...payload.desiredState,
        lifecyclePolicy: {
          ...existing.content.desiredState.lifecyclePolicy,
          ...payload.desiredState?.lifecyclePolicy,
        },
        repositories: payload.desiredState?.repositories ?? existing.content.desiredState.repositories,
      },
      updatedAt: new Date().toISOString(),
    },
  };

  await WriteData(ecrSetupConfigView, {
    ...nextContent.content,
  });

  return nextContent;
}

function buildEcrReconcilePlan(setup: EcrSetupConfig): EcrSetupPlanStep[] {
  const plan: EcrSetupPlanStep[] = [];

  if (setup.desiredState.repositories?.length) {
    plan.push({
      operation: 'update',
      path: 'desiredState.repositories',
      value: setup.desiredState.repositories,
    });
  }

  if (setup.desiredState.lifecyclePolicy?.enabled) {
    plan.push({
      operation: 'update',
      path: 'desiredState.lifecyclePolicy',
      value: setup.desiredState.lifecyclePolicy,
    });
  }

  if (!plan.length) {
    plan.push({ operation: 'noop', path: 'desiredState' });
  }

  return plan;
}

export async function readEcrSetupConfigHandler(
  payload: ReadEcrSetupConfigPayload,
  resultBuilder: ServiceActivityResultBuilder,
): Promise<ServiceActivityResultBuilder> {
  const setups = await readEcrSetup(payload);
  resultBuilder.log(`Returning ${setups.length} ECR setup config record(s)`);
  return resultBuilder.success({ data: setups });
}

export async function writeEcrSetupConfigHandler(
  payload: WriteEcrSetupConfigPayload,
  resultBuilder: ServiceActivityResultBuilder,
): Promise<ServiceActivityResultBuilder> {
  const updated = await mergeEcrSetup(payload);
  resultBuilder.log(`Stored ECR setup config for ${updated.content.setupId} in ${updated.content.region}`);
  return resultBuilder.success({ data: [updated] });
}

export async function reconcileEcrSetupConfigHandler(
  payload: ReconcileEcrSetupConfigPayload,
  resultBuilder: ServiceActivityResultBuilder,
): Promise<ServiceActivityResultBuilder> {
  const region = payload.region ?? 'eu-west-2';
  const setupId = payload.setupId ?? 'aws-ecr-setup-default';
  const current = (await readEcrSetup({ setupId, region }))[0] ?? seedEcrSetup(region, setupId);
  const plan = buildEcrReconcilePlan(current.content);

  const reconciled = {
    ...current,
    content: {
      ...current.content,
      status: (payload.dryRun ? 'ready' : 'applied') as EcrSetupConfigStatus,
      updatedAt: new Date().toISOString(),
    },
  };

  if (!payload.dryRun) {
    await WriteData(ecrSetupConfigView, {
      ...reconciled.content,
    });
  }

  resultBuilder.log(`ECR reconcile plan includes ${plan.length} step(s) for ${setupId} in ${region}`);
  return resultBuilder.success({ data: [reconciled], plan, dryRun: !!payload.dryRun });
}
