import type { AwsResourceKind } from './awsSdkModels.js';

export type AwsOwnershipMode = 'createNew' | 'useExisting' | 'managedExternally';
export type AwsDeltaType = 'missingInAws' | 'drifted' | 'unmanagedInAws' | 'configInvalid';
export type AwsDeltaSeverity = 'info' | 'warning' | 'error';
export type AwsDependencyRelation = 'dependsOn' | 'secures' | 'routesThrough' | 'assumedBy';

export type AwsObservedResource = {
  resourceId: string;
  resourceType: AwsResourceKind;
  providerArn?: string;
  name: string;
  region: string;
  state: string;
  metadata?: Record<string, unknown>;
  discoveredAt: string;
};

export type AwsDesiredResourceConfig = {
  resourceKey: string;
  resourceType: AwsResourceKind;
  desiredState: Record<string, unknown>;
  ownershipMode: AwsOwnershipMode;
  namingIntent?: {
    baseName?: string;
    environmentSuffix?: string;
  };
  policyIntent?: {
    trustBoundary?: string;
    accessProfile?: string;
  };
};

export type AwsReconcileDelta = {
  resourceKey: string;
  resourceType: AwsResourceKind;
  deltaType: AwsDeltaType;
  currentValue?: unknown;
  desiredValue?: unknown;
  severity: AwsDeltaSeverity;
  recommendation?: string;
};

export type AwsDependencyEdge = {
  fromResourceKey: string;
  toResourceKey: string;
  relationType: AwsDependencyRelation;
  criticality: 'low' | 'medium' | 'high';
};

export type AwsDependencyNode = {
  resourceKey: string;
  resourceType: AwsResourceKind;
  displayName: string;
  state?: string;
};

export type AwsObservedStateAggregate = {
  accountId?: string;
  region: string;
  observedAt: string;
  resources: AwsObservedResource[];
};

export type AwsDesiredConfigAggregate = {
  setupCaseId: string;
  setupRunId: string;
  region: string;
  resources: AwsDesiredResourceConfig[];
};

export type AwsReconcileAggregate = {
  setupCaseId: string;
  setupRunId: string;
  generatedAt: string;
  deltas: AwsReconcileDelta[];
};

export type AwsDependencyGraphAggregate = {
  setupCaseId: string;
  setupRunId: string;
  generatedAt: string;
  nodes: AwsDependencyNode[];
  edges: AwsDependencyEdge[];
};
