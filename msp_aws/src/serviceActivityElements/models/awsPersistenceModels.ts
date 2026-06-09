import type {
  AwsDependencyGraphAggregate,
  AwsDesiredConfigAggregate,
  AwsObservedStateAggregate,
  AwsReconcileAggregate,
} from './awsDomainModels.js';

export type TemporalRecordIdentity = {
  objectId: string;
  objectType: string;
  graphNamespace: 'aws';
};

export type TemporalRecordVersion = {
  revision: number;
  validFrom: string;
  validTo?: string;
  committedAt: string;
  committedBy?: string;
};

export type TemporalGraphRecord<TPayload> = TemporalRecordIdentity &
  TemporalRecordVersion & {
    payload: TPayload;
  };

// Query semantics supported by the graph DB:
// - fetch all records valid at a timestamp
// - latest-of each object up to a timestamp
export type TemporalAsOfQuery = {
  asOfTimestamp: string;
  latestOfEachObject?: boolean;
};

export type AwsSetupCase = {
  setupCaseId: string;
  accountId?: string;
  region: string;
  currentStatus: 'draft' | 'validating' | 'ready' | 'applied' | 'drifted' | 'failed';
  latestDraftRunId?: string;
  latestSuccessfulRunId?: string;
};

export type AwsSetupRun = {
  setupRunId: string;
  setupCaseId: string;
  wizardVersion: string;
  runMode: 'draft' | 'validate' | 'dryRun' | 'apply';
  runStatus: 'open' | 'completed' | 'failed';
  startedAt: string;
  completedAt?: string;
};

export type AwsDesiredConfigBundle = AwsDesiredConfigAggregate & {
  stepPayloads: Record<string, unknown>;
};

export type AwsObservedSnapshot = AwsObservedStateAggregate & {
  snapshotHash: string;
};

export type AwsReconcilePlan = AwsReconcileAggregate & {
  summary: {
    total: number;
    info: number;
    warning: number;
    error: number;
  };
  riskFlags: string[];
};

export type AwsDependencyGraph = AwsDependencyGraphAggregate & {
  graphVersion: string;
};

export type AwsApplyResult = {
  setupCaseId: string;
  setupRunId: string;
  attemptedOperations: number;
  successfulOperations: number;
  failedOperations: number;
  diagnostics?: Array<{
    operationId: string;
    level: 'info' | 'warning' | 'error';
    message: string;
  }>;
};

export type AwsSetupCaseRecord = TemporalGraphRecord<AwsSetupCase>;
export type AwsSetupRunRecord = TemporalGraphRecord<AwsSetupRun>;
export type AwsDesiredConfigBundleRecord = TemporalGraphRecord<AwsDesiredConfigBundle>;
export type AwsObservedSnapshotRecord = TemporalGraphRecord<AwsObservedSnapshot>;
export type AwsReconcilePlanRecord = TemporalGraphRecord<AwsReconcilePlan>;
export type AwsDependencyGraphRecord = TemporalGraphRecord<AwsDependencyGraph>;
export type AwsApplyResultRecord = TemporalGraphRecord<AwsApplyResult>;
