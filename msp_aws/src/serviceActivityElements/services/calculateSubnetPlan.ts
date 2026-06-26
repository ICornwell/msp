import type { ServiceActivityResultBuilder } from 'msp_svr_common';
import type { SubnetEntry, TopologyMode } from '../../data/clusterSetUpConfig.js';

export type CalculateSubnetPlanPayload = {
  topologyMode?: TopologyMode;
  azCount?: number;
  vpcCidr?: string;
};

type SubnetPlanResult = {
  subnets: SubnetEntry[];
  subnetCount: number;
  vpcCidr: string;
  topologyMode: TopologyMode;
  azCount: number;
};

// Splits a /16 VPC CIDR into /24 subnets at a given offset index.
function buildCidr(vpcCidr: string, index: number): string {
  const base = vpcCidr.split('.').slice(0, 2).join('.');
  return `${base}.${index}.0/24`;
}

function buildSubnetName(zoneType: string, tier: string, az: string): string {
  return `${zoneType}-${tier}-${az}`;
}

function getAvailabilityZones(count: number): string[] {
  // Generic AZ labels — actual AZ names resolved at apply time from AWS
  return Array.from({ length: count }, (_, i) => `az${i + 1}`);
}

export function calculateSubnetPlanLogic(
  topologyMode: TopologyMode,
  azCount: number,
  vpcCidr: string,
): SubnetEntry[] {
  const azs = getAvailabilityZones(azCount);
  const subnets: SubnetEntry[] = [];
  let cidrIndex = 0;

  if (topologyMode === 'consolidated') {
    // DMZ: one public subnet per AZ
    for (const az of azs) {
      subnets.push({
        name: buildSubnetName('dmz', 'public', az),
        zoneType: 'dmz',
        az,
        cidr: buildCidr(vpcCidr, cidrIndex++),
        tier: 'public',
        allowedProtocols: ['HTTP', 'HTTPS'],
      });
    }
    // Compute: one private subnet per AZ (all workloads consolidated)
    for (const az of azs) {
      subnets.push({
        name: buildSubnetName('compute', 'private', az),
        zoneType: 'compute',
        az,
        cidr: buildCidr(vpcCidr, cidrIndex++),
        tier: 'private',
      });
    }
    // Managed data: one isolated subnet per AZ
    for (const az of azs) {
      subnets.push({
        name: buildSubnetName('managedData', 'isolated', az),
        zoneType: 'managedData',
        az,
        cidr: buildCidr(vpcCidr, cidrIndex++),
        tier: 'isolated',
      });
    }
  } else if (topologyMode === 'split2') {
    // DMZ
    for (const az of azs) {
      subnets.push({ name: buildSubnetName('dmz', 'public', az), zoneType: 'dmz', az, cidr: buildCidr(vpcCidr, cidrIndex++), tier: 'public', allowedProtocols: ['HTTP', 'HTTPS'] });
    }
    // Core platform
    for (const az of azs) {
      subnets.push({ name: buildSubnetName('corePlatform', 'private', az), zoneType: 'corePlatform', az, cidr: buildCidr(vpcCidr, cidrIndex++), tier: 'private' });
    }
    // Feature + data compute combined
    for (const az of azs) {
      subnets.push({ name: buildSubnetName('compute', 'private', az), zoneType: 'compute', az, cidr: buildCidr(vpcCidr, cidrIndex++), tier: 'private' });
    }
    // Managed data
    for (const az of azs) {
      subnets.push({ name: buildSubnetName('managedData', 'isolated', az), zoneType: 'managedData', az, cidr: buildCidr(vpcCidr, cidrIndex++), tier: 'isolated' });
    }
  } else {
    // fullSplit: DMZ + Core + Feature + Data + Managed
    for (const az of azs) {
      subnets.push({ name: buildSubnetName('dmz', 'public', az), zoneType: 'dmz', az, cidr: buildCidr(vpcCidr, cidrIndex++), tier: 'public', allowedProtocols: ['HTTP', 'HTTPS'] });
    }
    for (const az of azs) {
      subnets.push({ name: buildSubnetName('corePlatform', 'private', az), zoneType: 'corePlatform', az, cidr: buildCidr(vpcCidr, cidrIndex++), tier: 'private' });
    }
    for (const az of azs) {
      subnets.push({ name: buildSubnetName('featureCompute', 'private', az), zoneType: 'featureCompute', az, cidr: buildCidr(vpcCidr, cidrIndex++), tier: 'private' });
    }
    for (const az of azs) {
      subnets.push({ name: buildSubnetName('dataCompute', 'private', az), zoneType: 'dataCompute', az, cidr: buildCidr(vpcCidr, cidrIndex++), tier: 'private' });
    }
    for (const az of azs) {
      subnets.push({ name: buildSubnetName('managedData', 'isolated', az), zoneType: 'managedData', az, cidr: buildCidr(vpcCidr, cidrIndex++), tier: 'isolated' });
    }
  }

  return subnets;
}

export async function calculateSubnetPlanHandler(
  payload: CalculateSubnetPlanPayload,
  resultBuilder: ServiceActivityResultBuilder,
): Promise<ServiceActivityResultBuilder> {
  const topologyMode: TopologyMode = (payload.topologyMode as TopologyMode) ?? 'consolidated';
  const azCount = Math.min(Math.max(payload.azCount ?? 2, 2), 3);
  const vpcCidr = payload.vpcCidr?.trim() || '10.42.0.0/16';

  const subnets = calculateSubnetPlanLogic(topologyMode, azCount, vpcCidr);

  resultBuilder.log(`Calculated ${subnets.length} subnets for topology=${topologyMode}, azCount=${azCount}, vpc=${vpcCidr}.`);

  return resultBuilder.success({
    subnets,
    subnetCount: subnets.length,
    vpcCidr,
    topologyMode,
    azCount,
  } satisfies SubnetPlanResult);
}
