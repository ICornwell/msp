export type AwsResourceKind =
  | 'eksCluster'
  | 'eksNodeGroup'
  | 'ecrRepository'
  | 'iamRole'
  | 'vpc'
  | 'subnet'
  | 'securityGroup';

export type ClusterSummaryRaw = {
  arn?: string;
  name?: string;
  version?: string;
  status?: string;
  endpoint?: string;
  roleArn?: string;
  vpcConfig?: {
    vpcId?: string;
    subnetIds?: string[];
    securityGroupIds?: string[];
  };
  tags?: Record<string, string>;
};

export type NodeGroupSummaryRaw = {
  nodegroupName?: string;
  clusterName?: string;
  status?: string;
  scalingConfig?: {
    minSize?: number;
    maxSize?: number;
    desiredSize?: number;
  };
  amiType?: string;
  instanceTypes?: string[];
};

export type RepositorySummaryRaw = {
  repositoryArn?: string;
  repositoryName?: string;
  repositoryUri?: string;
  imageTagMutability?: string;
  encryptionConfiguration?: {
    encryptionType?: string;
    kmsKey?: string;
  };
  scanOnPush?: boolean;
};

export type RoleSummaryRaw = {
  roleName?: string;
  arn?: string;
  assumeRolePolicyDocument?: string;
  attachedPolicies?: Array<{
    policyName?: string;
    policyArn?: string;
  }>;
};

export type NetworkSummaryRaw = {
  vpcId?: string;
  cidr?: string;
  subnets?: Array<{
    subnetId?: string;
    cidrBlock?: string;
    availabilityZone?: string;
    isPublic?: boolean;
  }>;
  routeShape?: string;
  securityGroups?: Array<{
    groupId?: string;
    groupName?: string;
    description?: string;
  }>;
};

export type AwsSdkInventorySnapshotRaw = {
  accountId?: string;
  region: string;
  collectedAt: string;
  eksClusters: ClusterSummaryRaw[];
  eksNodeGroups: NodeGroupSummaryRaw[];
  ecrRepositories: RepositorySummaryRaw[];
  iamRoles: RoleSummaryRaw[];
  networks: NetworkSummaryRaw[];
};
