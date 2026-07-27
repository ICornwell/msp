import type { DataObject, ViewDataContent } from 'msp_common';
import { ReadData, runDataActivity, type ServiceActivityResultBuilder } from 'msp_svr_common';

import type { AwsClusterSetupConfig } from '../../data/clusterSetUpConfig.js';
import type { EcrSetupConfig } from '../../data/ecrSetupConfig.js';
import {
  awsAccountInventoryView,
  awsAccountResourceObject,
  awsClusterSetupConfigObject,
  awsClusterSetupConfigView,
  ecrSetupConfigObject,
  ecrSetupConfigView,
} from '../../data/index.js';

const accountInventoryViewIdentifier = awsAccountInventoryView.getViewIdentifier!();

export type ListAccountResourcesPayload = {
  region?: string;
  setupId?: string;
  ecrSetupId?: string;
  clusterName?: string;
  includeTaggedSweep?: boolean;
};

type ObservedResourceRow = {
  service?: string;
  resourceType?: string;
  name?: string;
  region?: string;
  status?: string;
  arn?: string;
  tags?: Record<string, string>;
  detail?: Record<string, unknown>;
} & Partial<DataObject>;

export type AccountInventoryRow = {
  service: string;
  resourceType: string;
  name: string;
  region: string;
  status: string;
  arn?: string;
  desiredStatus: string;
  tagSummary?: string;
  aws_type?: string;
  aws_name?: string;
  aws_region?: string;
  aws_status?: string;
  aws_desired?: string;
  aws_tags?: string;
} & Partial<DataObject>;

type DesiredEntry = {
  service: string;
  resourceType: string;
  name: string;
  region: string;
  source: string;
};

// Platform-relevant short list: the resource types the platform manages or depends on.
const platformRelevantTypes = new Set([
  'eks::cluster',
  'ecr::repository',
  'ec2::vpc',
  'ec2::subnet',
  'ec2::security-group',
  'elasticloadbalancing::loadbalancer',
]);

const friendlyTypeLabels: Record<string, string> = {
  'eks::cluster': 'EKS Cluster',
  'ecr::repository': 'ECR Repository',
  'ec2::vpc': 'VPC',
  'ec2::subnet': 'Subnet',
  'ec2::security-group': 'Security Group',
  'elasticloadbalancing::loadbalancer': 'Load Balancer (ingress)',
};

function typeKey(service: string, resourceType: string): string {
  return `${service}::${resourceType}`;
}

function friendlyType(service: string, resourceType: string): string {
  return friendlyTypeLabels[typeKey(service, resourceType)] ?? `${service}:${resourceType}`;
}

function matchKey(entry: Pick<DesiredEntry, 'service' | 'resourceType' | 'name' | 'region'>): string {
  return `${entry.region}::${entry.service}::${entry.resourceType}::${entry.name}`;
}

function summarizeTags(tags?: Record<string, string>): string | undefined {
  const entries = Object.entries(tags ?? {});
  if (entries.length === 0) return undefined;
  const shown = entries.slice(0, 4).map(([key, value]) => `${key}=${value}`).join(', ');
  return entries.length > 4 ? `${shown}, +${entries.length - 4} more` : shown;
}

async function readDesiredEntries(payload: ListAccountResourcesPayload, region: string): Promise<DesiredEntry[]> {
  const desired: DesiredEntry[] = [];

  // Cluster setup config: desired EKS cluster, subnet plan, legacy ECR repositories.
  try {
    const setupId = payload.setupId ?? 'aws-cluster-setup-default';
    const clusterName = payload.clusterName ?? 'msp-dev-eks';
    const key = awsClusterSetupConfigObject.getBusinessKey({ setupId, region, clusterName });
    if (key) {
      const readResult = await ReadData(awsClusterSetupConfigView, key, { useBusinessKey: true });
      const found = readResult?.data ?? readResult?.result?.data ?? readResult;
      const config = (found?.content ?? found) as AwsClusterSetupConfig | undefined;
      if (config?.clusterName) {
        desired.push({ service: 'eks', resourceType: 'cluster', name: config.clusterName, region, source: 'cluster-setup' });
        for (const subnet of config.desiredState?.subnetPlan ?? []) {
          if (subnet.name) {
            desired.push({ service: 'ec2', resourceType: 'subnet', name: subnet.name, region, source: 'cluster-setup' });
          }
        }
        for (const repo of config.desiredState?.ecr?.repositories ?? []) {
          if (repo.repositoryName) {
            desired.push({
              service: 'ecr', resourceType: 'repository', name: repo.repositoryName,
              region: repo.region || region, source: 'cluster-setup',
            });
          }
        }
      }
    }
  } catch {
    // No cluster setup config stored yet — nothing desired from that source.
  }

  // ECR setup config: desired repositories.
  try {
    const ecrSetupId = payload.ecrSetupId ?? 'aws-ecr-setup-default';
    const key = ecrSetupConfigObject.getBusinessKey({ setupId: ecrSetupId, region });
    if (key) {
      const readResult = await ReadData(ecrSetupConfigView, key, { useBusinessKey: true });
      const found = readResult?.data ?? readResult?.result?.data ?? readResult;
      const config = (found?.content ?? found) as EcrSetupConfig | undefined;
      for (const repo of config?.desiredState?.repositories ?? []) {
        if (repo.repositoryName) {
          desired.push({
            service: 'ecr', resourceType: 'repository', name: repo.repositoryName,
            region: repo.region || region, source: 'ecr-setup',
          });
        }
      }
    }
  } catch {
    // No ECR setup config stored yet — nothing desired from that source.
  }

  // De-duplicate desired entries described by more than one source.
  const seen = new Set<string>();
  return desired.filter((entry) => {
    const key = matchKey(entry);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function toInventoryViewRow(row: AccountInventoryRow): ViewDataContent<AccountInventoryRow> {
  const businessKey = awsAccountResourceObject.getBusinessKey(row) ?? matchKey(row);
  return {
    namespace: accountInventoryViewIdentifier.namespace,
    name: accountInventoryViewIdentifier.name,
    version: accountInventoryViewIdentifier.version,
    variantName: accountInventoryViewIdentifier.variantName,
    viewRootEntityType: 'awsAccountResource',
    viewRootEntityId: businessKey,
    viewRootBusinessKey: businessKey,
    viewRootId: businessKey,
    content: {
      ...row,
      aws_type: friendlyType(row.service, row.resourceType),
      aws_name: row.name,
      aws_region: row.region,
      aws_status: row.status,
      aws_desired: row.desiredStatus,
      aws_tags: row.tagSummary ?? '',
    },
  };
}

function sortRank(row: AccountInventoryRow): number {
  const key = typeKey(row.service, row.resourceType);
  if (row.desiredStatus === 'desired only (missing)') return 0;
  if (platformRelevantTypes.has(key)) return 1;
  return 2;
}

export async function listAccountResourcesHandler(
  payload: ListAccountResourcesPayload,
  resultBuilder: ServiceActivityResultBuilder,
): Promise<ServiceActivityResultBuilder> {
  const region = payload?.region?.trim() || 'eu-west-2';

  const response = await runDataActivity<
    { region?: string; includeTaggedSweep?: boolean },
    { data?: ViewDataContent<ObservedResourceRow>[]; sourceErrors?: Array<{ source: string; message: string }> }
  >(
    'aws',
    'awsAccountResources',
    '1.0.0',
    'default',
    { region, includeTaggedSweep: payload?.includeTaggedSweep },
  );

  const observedRows = response.result?.data ?? [];
  const sourceErrors = response.result?.sourceErrors ?? [];
  const desiredEntries = await readDesiredEntries(payload ?? {}, region);
  const desiredByKey = new Map(desiredEntries.map((entry) => [matchKey(entry), entry]));

  const inventory: AccountInventoryRow[] = [];
  const matchedDesiredKeys = new Set<string>();

  for (const observed of observedRows) {
    const content = observed.content ?? {};
    const service = content.service ?? 'unknown';
    const resourceType = content.resourceType ?? 'unknown';
    const name = content.name ?? 'unknown';
    const rowRegion = content.region || region;

    const key = matchKey({ service, resourceType, name, region: rowRegion });
    const desired = desiredByKey.get(key);
    if (desired) matchedDesiredKeys.add(key);

    const isPlatformRelevant = platformRelevantTypes.has(typeKey(service, resourceType));
    const desiredStatus = desired
      ? `match (${desired.source})`
      : isPlatformRelevant
        ? 'observed only (unmanaged)'
        : '—';

    inventory.push({
      service,
      resourceType,
      name,
      region: rowRegion,
      status: content.status ?? 'unknown',
      arn: content.arn,
      desiredStatus,
      tagSummary: summarizeTags(content.tags),
    });
  }

  // Desired resources with no observed counterpart appear as missing rows.
  for (const entry of desiredEntries) {
    if (matchedDesiredKeys.has(matchKey(entry))) continue;
    inventory.push({
      service: entry.service,
      resourceType: entry.resourceType,
      name: entry.name,
      region: entry.region,
      status: '(not created)',
      desiredStatus: 'desired only (missing)',
    });
  }

  inventory.sort((a, b) =>
    sortRank(a) - sortRank(b)
    || a.service.localeCompare(b.service)
    || a.resourceType.localeCompare(b.resourceType)
    || a.name.localeCompare(b.name));

  const rows = inventory.map(toInventoryViewRow);
  const matched = matchedDesiredKeys.size;
  const missing = desiredEntries.length - matched;

  for (const sourceError of sourceErrors) {
    resultBuilder.log(`Account scan source error — ${sourceError.source}: ${sourceError.message}`);
  }
  resultBuilder.log(
    `Returning ${rows.length} account inventory row(s) for region ${region}`
    + ` (observed=${observedRows.length}, desiredMatched=${matched}, desiredMissing=${missing}).`,
  );
  return resultBuilder.success({ data: rows });
}
