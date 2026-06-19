import { GetCallerIdentityCommand, STSClient } from '@aws-sdk/client-sts';
import type { DataObject, ViewDataNewContent } from 'msp_common';
import { ReadData, WriteData, type ServiceActivityResultBuilder } from 'msp_svr_common';

import { resolveAwsCredentials } from './awsCredentialResolver.js';
import { awsDesiredResourceConfigView } from '../../data/index.js';

export type AwsReadPayload = {
  accountId?: string;
  region?: string;
  useMock?: boolean;
};

export type AwsDesiredConfigPayload = {
  setupCaseId: string;
  setupRunId: string;
  region: string;
  resources: Array<{
    resourceKey: string;
    resourceType: string;
    ownershipMode: 'createNew' | 'useExisting' | 'managedExternally';
    desiredState: Record<string, unknown>;
    namingIntent?: {
      baseName?: string;
      environmentSuffix?: string;
    };
    policyIntent?: {
      trustBoundary?: string;
      accessProfile?: string;
    };
  }>;
};

export type AwsValidateCredentialsPayload = {
  accountId?: string;
  region?: string;
  accessKeyId?: string;
  secretAccessKey?: string;
  sessionToken?: string;
};

export type AwsConnectionStatusRecord = {
  accountId?: string;
  region: string;
  connected: boolean;
  callerArn?: string;
  callerUserId?: string;
  message?: string;
  checkedAt: string;
} & Partial<DataObject>;

export type AwsSdkEksCluster = {
  accountId?: string;
  arn?: string;
  name: string;
  region: string;
  status: string;
  version?: string;
  endpoint?: string;
  roleArn?: string;
  tags?: Record<string, string>;
} & Partial<DataObject>;

export type AwsSdkEcrRepository = {
  accountId?: string;
  repositoryArn?: string;
  repositoryName: string;
  repositoryUri?: string;
  region: string;
  imageTagMutability?: string;
  scanOnPush?: boolean;
} & Partial<DataObject>;

export type AwsSdkIamRole = {
  accountId?: string;
  arn?: string;
  roleName: string;
  region: string;
  assumeRolePolicyDocument?: string;
  attachedPolicies?: Array<{
    policyName?: string;
    policyArn?: string;
  }>;
} & Partial<DataObject>;

export type AwsSdkNetworkShape = {
  accountId?: string;
  region: string;
  vpcId: string;
  cidr?: string;
  subnetCount: number;
  securityGroupCount: number;
  routeShape?: string;
} & Partial<DataObject>;

export type AwsSdkInventorySnapshot = {
  accountId?: string;
  region: string;
  collectedAt: string;
  counts: {
    eksClusters: number;
    ecrRepositories: number;
    iamRoles: number;
    networkShapes: number;
  };
} & Partial<DataObject>;

export type AwsDesiredResourceConfigRecord = {
  setupCaseId: string;
  setupRunId: string;
  region: string;
  resources: AwsDesiredConfigPayload['resources'];
  updatedAt: string;
} & Partial<DataObject>;

function makeRecordId(prefix: string, region: string, key: string) {
  return `${prefix}:${region}:${key}`;
}

function getRegion(payload?: AwsReadPayload) {
  return payload?.region?.trim() || process.env['AWS_REGION'] || 'eu-west-2';
}

function getAccountId(payload?: AwsReadPayload) {
  return payload?.accountId?.trim() || process.env['AWS_ACCOUNT_ID'] || 'local-dev-account';
}

// Placeholder SDK wrangling adapters. Replace with real AWS SDK clients when packages are introduced.
function readEksClustersFromAws(payload: AwsReadPayload): AwsSdkEksCluster[] {
  return [
    {
      // don't use __entityId here, it is set internally by the data layer
      //  rule is: don't add/change/remove with any props beginning with __,
      //  they are reserved for internal use by the data layer
      //  and are not part of the AWS SDK response shape
      accountId: getAccountId(payload),
      arn: 'arn:aws:eks:eu-west-2:000000000000:cluster/msp-dev-eks',
      name: 'msp-dev-eks',
      region: getRegion(payload),
      status: 'ACTIVE',
      version: '1.31',
      endpoint: 'https://example.eks.amazonaws.com',
      roleArn: 'arn:aws:iam::000000000000:role/msp-eks-control-plane',
      tags: { environment: 'dev', module: 'msp_aws' },
    },
  ];
}

function readEcrRepositoriesFromAws(payload: AwsReadPayload): AwsSdkEcrRepository[] {
  return [
    {
      accountId: getAccountId(payload),
      repositoryArn: 'arn:aws:ecr:eu-west-2:000000000000:repository/actorwork/dev',
      repositoryName: 'actorwork/dev',
      repositoryUri: '000000000000.dkr.ecr.eu-west-2.amazonaws.com/actorwork/dev',
      region: getRegion(payload),
      imageTagMutability: 'IMMUTABLE',
      scanOnPush: true,
    },
  ];
}

function readIamRolesFromAws(payload: AwsReadPayload): AwsSdkIamRole[] {
  return [
    {
      // don't use __entityId here, it is set internally by the data layer
      //  rule is: don't add/change/remove with any props beginning with __,
      //  they are reserved for internal use by the data layer
      accountId: getAccountId(payload),
      arn: 'arn:aws:iam::000000000000:role/msp-eks-control-plane',
      roleName: 'msp-eks-control-plane',
      region: getRegion(payload),
      attachedPolicies: [
        {
          policyName: 'AmazonEKSClusterPolicy',
          policyArn: 'arn:aws:iam::aws:policy/AmazonEKSClusterPolicy',
        },
      ],
    },
  ];
}

function readNetworkShapesFromAws(payload: AwsReadPayload): AwsSdkNetworkShape[] {
  return [
    {
      // don't use __entityId here, it is set internally by the data layer
      accountId: getAccountId(payload),
      region: getRegion(payload),
      vpcId: 'vpc-0011223344556677',
      cidr: '10.42.0.0/16',
      subnetCount: 4,
      securityGroupCount: 3,
      routeShape: 'public-and-private',
    },
  ];
}

function toViewData<T extends Partial<DataObject>>(
  viewName: string,
  entityType: string,
  row: T,
): ViewDataNewContent<T> {
  return {
    viewNamespace: 'aws',
    viewName,
    viewVersion: '1.0.0',
    viewRootEntityType: entityType,
    // viewRootEntityId: rowId, only use this if not using the ViewRootEntityBusKey and ViewRootId props below
    // viewRootEntityBusKey: 'id',
    // viewRootId: rowId,
    content: {
      ...row,
    },
  };
}

export async function awsEksClustersHandler(
  payload: AwsReadPayload,
  resultBuilder: ServiceActivityResultBuilder,
): Promise<ServiceActivityResultBuilder> {
  const creds = await resolveAwsCredentials(payload.region);
  const rows = readEksClustersFromAws({ ...payload, region: creds.region, accountId: creds.accessKeyId }).map((cluster) => {
    return toViewData('AwsSdkEksClusters', 'eksCluster', cluster);
  });

  resultBuilder.log(`Data layer: returning ${rows.length} EKS cluster record(s) for region=${creds.region}.`);
  return resultBuilder.success({ data: rows });
}

export async function awsEcrRepositoriesHandler(
  payload: AwsReadPayload,
  resultBuilder: ServiceActivityResultBuilder,
): Promise<ServiceActivityResultBuilder> {
  const creds = await resolveAwsCredentials(payload.region);
  const rows = readEcrRepositoriesFromAws({ ...payload, region: creds.region }).map((repo) => {
    return toViewData('AwsSdkEcrRepositories', 'ecrRepository', repo);
  });

  resultBuilder.log(`Data layer: returning ${rows.length} ECR repository record(s) for region=${creds.region}.`);
  return resultBuilder.success({ data: rows });
}

export async function awsIamRolesHandler(
  payload: AwsReadPayload,
  resultBuilder: ServiceActivityResultBuilder,
): Promise<ServiceActivityResultBuilder> {
  const creds = await resolveAwsCredentials(payload.region);
  const rows = readIamRolesFromAws({ ...payload, region: creds.region }).map((role) => {
    return toViewData('AwsSdkIamRoles', 'iamRole', role);
  });

  resultBuilder.log(`Data layer: returning ${rows.length} IAM role record(s) for region=${creds.region}.`);
  return resultBuilder.success({ data: rows });
}

export async function awsNetworkTopologyHandler(
  payload: AwsReadPayload,
  resultBuilder: ServiceActivityResultBuilder,
): Promise<ServiceActivityResultBuilder> {
  const creds = await resolveAwsCredentials(payload.region);
  const rows = readNetworkShapesFromAws({ ...payload, region: creds.region }).map((net) => {
    return toViewData('AwsSdkNetworkTopology', 'networkShape', net);
  });

  resultBuilder.log(`Data layer: returning ${rows.length} network topology record(s) for region=${creds.region}.`);
  return resultBuilder.success({ data: rows });
}

export async function awsInventorySnapshotHandler(
  payload: AwsReadPayload,
  resultBuilder: ServiceActivityResultBuilder,
): Promise<ServiceActivityResultBuilder> {
  const eks = readEksClustersFromAws(payload);
  const ecr = readEcrRepositoriesFromAws(payload);
  const iam = readIamRolesFromAws(payload);
  const net = readNetworkShapesFromAws(payload);

  const snapshot: AwsSdkInventorySnapshot = {
    accountId: getAccountId(payload),
    region: getRegion(payload),
    collectedAt: new Date().toISOString(),
    counts: {
      eksClusters: eks.length,
      ecrRepositories: ecr.length,
      iamRoles: iam.length,
      networkShapes: net.length,
    },
  };

  const row = toViewData(
    'AwsSdkInventorySnapshot',
    'awsInventorySnapshot',
    snapshot,
  );

  resultBuilder.log('Data layer: returning aggregated AWS inventory snapshot.');
  return resultBuilder.success({ data: [row] });
}

export async function writeAwsDesiredResourceConfigHandler(
  payload: AwsDesiredConfigPayload,
  resultBuilder: ServiceActivityResultBuilder,
): Promise<ServiceActivityResultBuilder> {
  const key = `${payload.setupCaseId}::${payload.setupRunId}`;
  const now = new Date().toISOString();

  const record = toViewData<AwsDesiredResourceConfigRecord>(
    'AwsDesiredResourceConfig',
    'awsDesiredResourceConfig',
    {
      setupCaseId: payload.setupCaseId,
      setupRunId: payload.setupRunId,
      region: payload.region,
      resources: payload.resources,
      updatedAt: now,
    },
  );

  await WriteData(awsDesiredResourceConfigView, {
    ...record.content,
  });

  resultBuilder.log(`Data layer: stored desired config for ${key}.`);
  return resultBuilder.success({ data: [record] });
}

export async function readAwsDesiredResourceConfigHandler(
  payload: Pick<AwsDesiredConfigPayload, 'setupCaseId' | 'setupRunId' | 'region'>,
  resultBuilder: ServiceActivityResultBuilder,
): Promise<ServiceActivityResultBuilder> {
  const key = `${payload.setupCaseId}::${payload.setupRunId}`;
  const rowId = makeRecordId('desired-config', payload.region, key);

  try {
    const readResult = await ReadData(awsDesiredResourceConfigView, rowId, { useBusinessKey: true });
    const found = readResult?.data ?? readResult?.result?.data ?? readResult;
    if (found) {
      const normalized = found.content
        ? (found as ViewDataNewContent<AwsDesiredResourceConfigRecord>)
        : toViewData<AwsDesiredResourceConfigRecord>(
            'AwsDesiredResourceConfig',
            'awsDesiredResourceConfig',
            found as AwsDesiredResourceConfigRecord,
          );

      resultBuilder.log(`Data layer: found desired config for ${key}.`);
      return resultBuilder.success({ data: [normalized] });
    }
  } catch {
    // Fall back to empty record below.
  }

  const emptyRecord = toViewData<AwsDesiredResourceConfigRecord>(
    'AwsDesiredResourceConfig',
    'awsDesiredResourceConfig',
    {
      setupCaseId: payload.setupCaseId,
      setupRunId: payload.setupRunId,
      region: payload.region,
      resources: [],
      updatedAt: new Date().toISOString(),
    },
  );

  resultBuilder.log(`Data layer: returning empty desired config for ${key}.`);
  return resultBuilder.success({ data: [emptyRecord] });
}

export async function awsValidateCredentialsHandler(
  payload: AwsValidateCredentialsPayload,
  resultBuilder: ServiceActivityResultBuilder,
): Promise<ServiceActivityResultBuilder> {
  const region = payload.region?.trim() || process.env['AWS_REGION'] || 'eu-west-2';
  const checkedAt = new Date().toISOString();

  try {
    const client = new STSClient({
      region,
      credentials: {
        accessKeyId: payload.accessKeyId || '',
        secretAccessKey: payload.secretAccessKey || '',
        sessionToken: payload.sessionToken,
      },
    });

    const response = await client.send(new GetCallerIdentityCommand({}));
    const accountId = response.Account;

    const row = toViewData<AwsConnectionStatusRecord>(
      'AwsConnectionStatus',
      'awsConnectionStatus',
      {
        accountId,
        region,
        connected: true,
        callerArn: response.Arn,
        callerUserId: response.UserId,
        message: 'Connected to AWS STS successfully.',
        checkedAt,
      },
    );

    resultBuilder.log(`Data layer: AWS credential validation succeeded for region=${region}.`);
    return resultBuilder.success({ data: [row] });
  } catch (error: any) {
    const message = error?.message || 'AWS SDK connection failed.';

    const row = toViewData<AwsConnectionStatusRecord>(
      'AwsConnectionStatus',
      'awsConnectionStatus',
      {
        accountId: payload.accountId,
        region,
        connected: false,
        message,
        checkedAt,
      },
    );

    resultBuilder.log(`Data layer: AWS credential validation failed for region=${region}: ${message}`);
    return resultBuilder.success({ data: [row] });
  }
}
