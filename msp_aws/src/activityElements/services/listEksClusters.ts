import type { DataObject, ViewDataContent } from 'msp_common';
import type { ServiceActivity, ServiceActivityResultBuilder } from 'msp_svr_common';

export type ListEksClustersPayload = {
  region?: string;
};

export type EksClusterData = {
  clusterName: string;
  region: string;
  status: string;
  version: string;
  endpoint: string;
} & Partial<DataObject>;

const mockClusters: ViewDataContent<EksClusterData>[] = [
  {
    viewDomain: 'aws',
    viewName: 'AwsResourceInventory',
    viewVersion: '1.0.0',
    viewRootEntityType: 'eksCluster',
    viewRootEntityId: 'eks-dev-primary',
    viewRootEntityBusKey: 'eks-dev-primary',
    viewRootId: 'eks-dev-primary',
    content: {
      __entityId: 'eks-dev-primary',
      id: 'eks-dev-primary',
      clusterName: 'msp-dev-eks',
      region: 'eu-west-2',
      status: 'ACTIVE',
      version: '1.31',
      endpoint: 'https://example.eks.amazonaws.com',
    },
  },
];

async function listEksClustersHandler(
  payload: ListEksClustersPayload,
  resultBuilder: ServiceActivityResultBuilder,
): Promise<ServiceActivityResultBuilder> {
  const region = payload?.region?.trim();
  const filtered = region
    ? mockClusters.filter((c) => c.content.region === region)
    : mockClusters;

  resultBuilder.log(
    `Returning ${filtered.length} EKS clusters${region ? ` for region ${region}` : ''}`,
  );
  return resultBuilder.success({ data: filtered });
}

export const ListEksClustersActivity: ServiceActivity = {
  namespace: 'aws',
  activityName: 'listEksClusters',
  version: '1.0.0',
  matchingVersionRange: '^1.0.0',
  context: '*',
  funcs: listEksClustersHandler,
};
