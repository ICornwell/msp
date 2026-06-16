import type { DataObject, ViewDataContent } from 'msp_common';
import { runDataActivity, type ServiceActivityResultBuilder } from 'msp_svr_common';
import { awsResourceInventoryView } from '../../data/index.js';

const inventoryViewIdentifier = awsResourceInventoryView.getViewIdentifier!();

export type ListEksClustersPayload = {
  region?: string;
};

export type EksClusterData = {
  clusterName: string;
  region: string;
  status: string;
  version: string;
  endpoint: string;
  aws_type?: string;
  aws_name?: string;
  aws_region?: string;
  aws_status?: string;
} & Partial<DataObject>;

type AwsSdkEksClusterData = {
  accountId?: string;
  arn?: string;
  name?: string;
  region?: string;
  status?: string;
  version?: string;
  endpoint?: string;
  roleArn?: string;
  tags?: Record<string, string>;
} & Partial<DataObject>;

function normalizeEksRows(
  rows: ViewDataContent<AwsSdkEksClusterData>[] = [],
): ViewDataContent<EksClusterData>[] {
  return rows.map((row) => {
    const rowId = String(row.content.id ?? row.content.__entityId ?? row.viewRootEntityId ?? row.viewRootId);
    const region = row.content.region ?? 'unknown';
    const clusterName = row.content.name ?? rowId;
    const status = row.content.status ?? 'UNKNOWN';
    const version = row.content.version ?? 'unknown';
    const endpoint = row.content.endpoint ?? '';

    return {
      viewDomain: inventoryViewIdentifier.viewDomain,
      viewName: inventoryViewIdentifier.viewName,
      viewVersion: inventoryViewIdentifier.viewVersion,
      viewVariantName: inventoryViewIdentifier.viewVariantName,
      viewRootEntityType: 'eksCluster',
      viewRootEntityId: rowId,
      viewRootEntityBusKey: rowId,
      viewRootId: rowId,
      content: {
        __entityId: rowId,
        id: rowId,
        clusterName,
        region,
        status,
        version,
        endpoint,
        aws_type: 'EKS Cluster',
        aws_name: clusterName,
        aws_region: region,
        aws_status: status,
      },
    };
  });
}

export async function listEksClustersHandler(
  payload: ListEksClustersPayload,
  resultBuilder: ServiceActivityResultBuilder,
): Promise<ServiceActivityResultBuilder> {
  const response = await runDataActivity<ListEksClustersPayload, { data?: ViewDataContent<AwsSdkEksClusterData>[] }>(
    'aws',
    'awsEksClusters',
    '1.0.0',
    'default',
    payload ?? {},
  );
  const sourceRows = response.result?.data ?? [];
  const filtered = normalizeEksRows(sourceRows);
  const region = payload?.region?.trim();

  resultBuilder.log(
    `Returning ${filtered.length} EKS clusters${region ? ` for region ${region}` : ''}`,
  );
  return resultBuilder.success({ data: filtered });
}

