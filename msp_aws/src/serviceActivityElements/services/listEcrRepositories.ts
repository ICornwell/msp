import type { DataObject, ViewDataContent } from 'msp_common';
import type { ServiceActivity, ServiceActivityResultBuilder } from 'msp_svr_common';

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

const mockRepositories: ViewDataContent<EcrRepositoryData>[] = [
  {
    viewDomain: 'aws',
    viewName: 'AwsResourceInventory',
    viewVersion: '1.0.0',
    viewRootEntityType: 'ecrRepository',
    viewRootEntityId: 'ecr-dev-actorwork',
    viewRootEntityBusKey: 'ecr-dev-actorwork',
    viewRootId: 'ecr-dev-actorwork',
    content: {
      __entityId: 'ecr-dev-actorwork',
      id: 'ecr-dev-actorwork',
      repositoryName: 'actorwork/dev',
      region: 'eu-west-2',
      imageTagMutability: 'IMMUTABLE',
      scanOnPush: true,
      aws_type: 'ECR Repository',
      aws_name: 'actorwork/dev',
      aws_region: 'eu-west-2',
      aws_status: 'IMMUTABLE (scan-on-push)',
    },
  },
];

async function listEcrRepositoriesHandler(
  payload: ListEcrRepositoriesPayload,
  resultBuilder: ServiceActivityResultBuilder,
): Promise<ServiceActivityResultBuilder> {
  const region = payload?.region?.trim();
  const filtered = region
    ? mockRepositories.filter((repo) => repo.content.region === region)
    : mockRepositories;

  resultBuilder.log(
    `Returning ${filtered.length} ECR repositories${region ? ` for region ${region}` : ''}`,
  );
  return resultBuilder.success({ data: filtered });
}

export const ListEcrRepositoriesActivity: ServiceActivity = {
  namespace: 'aws',
  activityName: 'listEcrRepositories',
  version: '1.0.0',
  matchingVersionRange: '^1.0.0',
  context: '*',
  funcs: listEcrRepositoriesHandler,
};
