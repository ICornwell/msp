import { DescribeVpcsCommand, DescribeSubnetsCommand, DescribeSecurityGroupsCommand, EC2Client } from '@aws-sdk/client-ec2';
import { DescribeRepositoriesCommand, ECRClient } from '@aws-sdk/client-ecr';
import { DescribeClusterCommand, EKSClient, ListClustersCommand } from '@aws-sdk/client-eks';
import { DescribeLoadBalancersCommand, ElasticLoadBalancingV2Client } from '@aws-sdk/client-elastic-load-balancing-v2';
import { GetResourcesCommand, ResourceGroupsTaggingAPIClient } from '@aws-sdk/client-resource-groups-tagging-api';
import type { DataObject, ViewDataNewContent } from 'msp_common';
import type { ServiceActivityResultBuilder } from 'msp_svr_common';

import { resolveAwsCredentials, type AwsCredentials } from '../../shared/vault.js';

// ---------------------------------------------------------------------------
// Observed account resource reads (real AWS SDK).
//
// One data activity returns a single normalized row list covering:
//  - the platform-relevant short list read directly from each service API
//    (EKS clusters, ECR repositories, VPCs, subnets, security groups, load balancers)
//  - a Resource Groups Tagging API sweep for everything else that carries tags
//    (the closest AWS gets to "one call, list the account"; never-tagged
//    resources do not appear in the sweep, which is why the short list is
//    read directly).
// ---------------------------------------------------------------------------

export type AwsAccountResourcesPayload = {
  region?: string;
  /** Include the Resource Groups Tagging API sweep of all tagged resources. Default true. */
  includeTaggedSweep?: boolean;
};

export type AwsObservedResourceRow = {
  service: string;
  resourceType: string;
  name: string;
  region: string;
  status?: string;
  arn?: string;
  tags?: Record<string, string>;
  detail?: Record<string, unknown>;
} & Partial<DataObject>;

type SourceErrors = Array<{ source: string; message: string }>;

function clientCredentials(creds: AwsCredentials) {
  return {
    region: creds.region,
    defaultsMode: 'standard' as const,
    credentials: {
      accessKeyId: creds.accessKeyId,
      secretAccessKey: creds.secretAccessKey,
      sessionToken: creds.sessionToken,
    },
  };
}

function tagArrayToRecord(tags?: Array<{ Key?: string; Value?: string }>): Record<string, string> | undefined {
  if (!tags?.length) return undefined;
  const record: Record<string, string> = {};
  for (const tag of tags) {
    if (tag.Key) record[tag.Key] = tag.Value ?? '';
  }
  return record;
}

function nameFromTags(tags: Record<string, string> | undefined, fallback: string): string {
  return tags?.['Name']?.trim() || fallback;
}

/** Parse arn:partition:service:region:account:resource → { service, resourceType, name, region }. */
export function parseArn(arn: string): { service: string; resourceType: string; name: string; region: string } {
  const parts = arn.split(':');
  const service = parts[2] ?? 'unknown';
  const region = parts[3] ?? '';
  const resource = parts.slice(5).join(':');
  const slash = resource.indexOf('/');
  if (slash > 0) {
    return { service, resourceType: resource.slice(0, slash), name: resource.slice(slash + 1), region };
  }
  return { service, resourceType: service, name: resource, region };
}

async function readEksClusters(creds: AwsCredentials): Promise<AwsObservedResourceRow[]> {
  const client = new EKSClient(clientCredentials(creds));
  const listed = await client.send(new ListClustersCommand({}));
  const rows: AwsObservedResourceRow[] = [];
  for (const clusterName of listed.clusters ?? []) {
    const described = await client.send(new DescribeClusterCommand({ name: clusterName }));
    const cluster = described.cluster;
    rows.push({
      service: 'eks',
      resourceType: 'cluster',
      name: clusterName,
      region: creds.region,
      status: cluster?.status ?? 'UNKNOWN',
      arn: cluster?.arn,
      tags: cluster?.tags,
      detail: {
        version: cluster?.version,
        endpoint: cluster?.endpoint,
        roleArn: cluster?.roleArn,
      },
    });
  }
  return rows;
}

async function readEcrRepositories(creds: AwsCredentials): Promise<AwsObservedResourceRow[]> {
  const client = new ECRClient(clientCredentials(creds));
  const rows: AwsObservedResourceRow[] = [];
  let nextToken: string | undefined;
  do {
    const page = await client.send(new DescribeRepositoriesCommand({ nextToken, maxResults: 100 }));
    for (const repo of page.repositories ?? []) {
      rows.push({
        service: 'ecr',
        resourceType: 'repository',
        name: repo.repositoryName ?? 'unknown',
        region: creds.region,
        status: 'AVAILABLE',
        arn: repo.repositoryArn,
        detail: {
          repositoryUri: repo.repositoryUri,
          imageTagMutability: repo.imageTagMutability,
          scanOnPush: repo.imageScanningConfiguration?.scanOnPush,
          encryptionType: repo.encryptionConfiguration?.encryptionType,
          createdAt: repo.createdAt?.toISOString?.(),
        },
      });
    }
    nextToken = page.nextToken;
  } while (nextToken);
  return rows;
}

async function readNetworkResources(creds: AwsCredentials): Promise<AwsObservedResourceRow[]> {
  const client = new EC2Client(clientCredentials(creds));
  const [vpcs, subnets, securityGroups] = await Promise.all([
    client.send(new DescribeVpcsCommand({})),
    client.send(new DescribeSubnetsCommand({})),
    client.send(new DescribeSecurityGroupsCommand({})),
  ]);

  const rows: AwsObservedResourceRow[] = [];
  for (const vpc of vpcs.Vpcs ?? []) {
    const tags = tagArrayToRecord(vpc.Tags);
    rows.push({
      service: 'ec2',
      resourceType: 'vpc',
      name: nameFromTags(tags, vpc.VpcId ?? 'unknown'),
      region: creds.region,
      status: vpc.State ?? 'unknown',
      tags,
      detail: { vpcId: vpc.VpcId, cidr: vpc.CidrBlock, isDefault: vpc.IsDefault },
    });
  }
  for (const subnet of subnets.Subnets ?? []) {
    const tags = tagArrayToRecord(subnet.Tags);
    rows.push({
      service: 'ec2',
      resourceType: 'subnet',
      name: nameFromTags(tags, subnet.SubnetId ?? 'unknown'),
      region: creds.region,
      status: subnet.State ?? 'unknown',
      arn: subnet.SubnetArn,
      tags,
      detail: {
        subnetId: subnet.SubnetId,
        vpcId: subnet.VpcId,
        cidr: subnet.CidrBlock,
        availabilityZone: subnet.AvailabilityZone,
        mapPublicIpOnLaunch: subnet.MapPublicIpOnLaunch,
      },
    });
  }
  for (const group of securityGroups.SecurityGroups ?? []) {
    const tags = tagArrayToRecord(group.Tags);
    rows.push({
      service: 'ec2',
      resourceType: 'security-group',
      name: group.GroupName ?? nameFromTags(tags, group.GroupId ?? 'unknown'),
      region: creds.region,
      status: 'available',
      tags,
      detail: { groupId: group.GroupId, vpcId: group.VpcId, description: group.Description },
    });
  }
  return rows;
}

async function readLoadBalancers(creds: AwsCredentials): Promise<AwsObservedResourceRow[]> {
  const client = new ElasticLoadBalancingV2Client(clientCredentials(creds));
  const described = await client.send(new DescribeLoadBalancersCommand({}));
  return (described.LoadBalancers ?? []).map((lb) => ({
    service: 'elasticloadbalancing',
    resourceType: 'loadbalancer',
    name: lb.LoadBalancerName ?? 'unknown',
    region: creds.region,
    status: lb.State?.Code ?? 'unknown',
    arn: lb.LoadBalancerArn,
    detail: {
      type: lb.Type,
      scheme: lb.Scheme,
      vpcId: lb.VpcId,
      dnsName: lb.DNSName,
    },
  }));
}

async function readTaggedResourceSweep(creds: AwsCredentials): Promise<AwsObservedResourceRow[]> {
  const client = new ResourceGroupsTaggingAPIClient(clientCredentials(creds));
  const rows: AwsObservedResourceRow[] = [];
  let paginationToken: string | undefined;
  do {
    const page = await client.send(new GetResourcesCommand({
      PaginationToken: paginationToken,
      ResourcesPerPage: 100,
    }));
    for (const mapping of page.ResourceTagMappingList ?? []) {
      if (!mapping.ResourceARN) continue;
      const parsed = parseArn(mapping.ResourceARN);
      const tags = tagArrayToRecord(mapping.Tags);
      rows.push({
        service: parsed.service,
        resourceType: parsed.resourceType,
        name: nameFromTags(tags, parsed.name),
        region: parsed.region || creds.region,
        arn: mapping.ResourceARN,
        tags,
      });
    }
    paginationToken = page.PaginationToken || undefined;
  } while (paginationToken);
  return rows;
}

function toErrorMessage(error: unknown, fallback: string): string {
  if (error && typeof error === 'object' && 'message' in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === 'string' && message.trim().length > 0) {
      return message;
    }
  }
  return fallback;
}

export function accountResourceBusinessKey(row: Pick<AwsObservedResourceRow, 'region' | 'service' | 'resourceType' | 'name'>): string {
  return `${row.region}::${row.service}::${row.resourceType}::${row.name}`;
}

function toAccountResourceViewData(row: AwsObservedResourceRow): ViewDataNewContent<AwsObservedResourceRow> {
  return {
    namespace: 'aws',
    name: 'AwsSdkAccountResources',
    version: '1.0.0',
    viewRootEntityType: 'awsAccountResource',
    viewRootBusinessKey: accountResourceBusinessKey(row),
    content: { ...row },
  };
}

export async function awsAccountResourcesHandler(
  payload: AwsAccountResourcesPayload,
  resultBuilder: ServiceActivityResultBuilder,
): Promise<ServiceActivityResultBuilder> {
  const errors: SourceErrors = [];
  let creds: AwsCredentials;

  try {
    creds = await resolveAwsCredentials(payload?.region);
  } catch (error) {
    const message = toErrorMessage(error, 'Failed to resolve AWS credentials.');
    resultBuilder.log(`Data layer: AWS account resource read failed to resolve credentials: ${message}`);
    return resultBuilder.successfullyFailed({ data: [] }, message, { code: 'AWS_ACCOUNT_READ_NO_CREDENTIALS' });
  }

  const readSource = async (source: string, reader: (c: AwsCredentials) => Promise<AwsObservedResourceRow[]>) => {
    try {
      return await reader(creds);
    } catch (error) {
      const message = toErrorMessage(error, `Failed to read ${source}.`);
      errors.push({ source, message });
      resultBuilder.log(`Data layer: AWS ${source} read failed: ${message}`);
      return [] as AwsObservedResourceRow[];
    }
  };

  const includeSweep = payload?.includeTaggedSweep !== false;
  const [eks, ecr, network, loadBalancers, sweep] = await Promise.all([
    readSource('eks-clusters', readEksClusters),
    readSource('ecr-repositories', readEcrRepositories),
    readSource('network-resources', readNetworkResources),
    readSource('load-balancers', readLoadBalancers),
    includeSweep ? readSource('tagged-resource-sweep', readTaggedResourceSweep) : Promise.resolve([]),
  ]);

  // Direct service reads win over sweep rows describing the same resource.
  const direct = [...eks, ...ecr, ...network, ...loadBalancers];
  const seenArns = new Set(direct.map((row) => row.arn).filter((arn): arn is string => !!arn));
  const seenKeys = new Set(direct.map(accountResourceBusinessKey));
  const sweepOnly = sweep.filter((row) =>
    !(row.arn && seenArns.has(row.arn)) && !seenKeys.has(accountResourceBusinessKey(row)));

  const all = [...direct, ...sweepOnly];
  const rows = all.map(toAccountResourceViewData);

  if (all.length === 0 && errors.length > 0) {
    const message = errors.map((e) => `${e.source}: ${e.message}`).join('; ');
    return resultBuilder.successfullyFailed({ data: [] }, message, { code: 'AWS_ACCOUNT_READ_FAILED' });
  }

  resultBuilder.log(
    `Data layer: returning ${all.length} account resource record(s) for region=${creds.region}`
    + ` (direct=${direct.length}, taggedSweep=${sweepOnly.length}${errors.length ? `, sourceErrors=${errors.length}` : ''}).`,
  );
  return resultBuilder.success({ data: rows, sourceErrors: errors });
}
