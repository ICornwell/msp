import type { DataObject, ViewDataContent } from 'msp_common';
import { runDataActivity, type ServiceActivityResultBuilder } from 'msp_svr_common';
import { awsResourceInventoryView } from '../../data/index.js';

const inventoryViewIdentifier = awsResourceInventoryView.getViewIdentifier();

export type ListEcrRepositoriesPayload = {
  region?: string;
};

export type EcrRepositoryData = {
  repositoryName: string;
  region: string;
  imageTagMutability: string;
  scanOnPush: boolean;
  aws_type?: string;
  aws_name?: string;
  aws_region?: string;
  aws_status?: string;
} & Partial<DataObject>;

type AwsSdkEcrRepositoryData = {
  accountId?: string;
  repositoryArn?: string;
  repositoryName?: string;
  repositoryUri?: string;
  region?: string;
  imageTagMutability?: string;
  scanOnPush?: boolean;
} & Partial<DataObject>;

function normalizeRepositoryRows(
  rows: ViewDataContent<AwsSdkEcrRepositoryData>[] = [],
): ViewDataContent<EcrRepositoryData>[] {
  return rows.map((row) => {
    const region = row.content.region ?? 'unknown';
    const repositoryName = row.content.repositoryName ?? row.viewRootEntityId ?? row.viewRootId ?? 'unknown';
    const rowId = `${region}::${repositoryName}`;
    const imageTagMutability = row.content.imageTagMutability ?? 'UNKNOWN';
    const scanOnPush = Boolean(row.content.scanOnPush);
    const status = `${imageTagMutability}${scanOnPush ? ' (scan-on-push)' : ''}`;

    return {
      viewNamespace: inventoryViewIdentifier.viewNamespace,
      viewName: inventoryViewIdentifier.viewName,
      viewVersion: inventoryViewIdentifier.viewVersion,
      viewVariantName: inventoryViewIdentifier.viewVariantName,
      viewRootEntityType: 'ecrRepository',
      viewRootEntityId: rowId,
      viewRootEntityBusKey: rowId,
      viewRootId: rowId,
      content: {
        repositoryName,
        region,
        imageTagMutability,
        scanOnPush,
        aws_type: 'ECR Repository',
        aws_name: repositoryName,
        aws_region: region,
        aws_status: status,
      },
    };
  });
}

export async function listEcrRepositoriesHandler(
  payload: ListEcrRepositoriesPayload,
  resultBuilder: ServiceActivityResultBuilder,
): Promise<ServiceActivityResultBuilder> {
  const response = await runDataActivity<ListEcrRepositoriesPayload, { data?: ViewDataContent<AwsSdkEcrRepositoryData>[] }>(
    'aws',
    'awsEcrRepositories',
    '1.0.0',
    'default',
    payload ?? {},
  );
  const sourceRows = response.result?.data ?? [];
  const filtered = normalizeRepositoryRows(sourceRows);
  const region = payload?.region?.trim();

  resultBuilder.log(
    `Returning ${filtered.length} ECR repositories${region ? ` for region ${region}` : ''}`,
  );
  return resultBuilder.success({ data: filtered });
}

