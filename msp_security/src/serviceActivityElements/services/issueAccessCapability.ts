import { randomUUID } from 'crypto';

import type { ServiceActivity, ServiceActivityResultBuilder } from 'msp_svr_common';

export type IssueAccessCapabilityPayload = {
  subject: {
    actorId: string;
    tenantId?: string;
    moduleId?: string;
  };
  request: {
    profileRef?: string;
    provider?: string;
    operation?: string;
    scope?: Record<string, string>;
    ttlSeconds?: number;
    returnType?: 'token' | 'credentialRef';
  };
  context?: {
    workItemId?: string;
    reason?: string;
  };
};

export type IssuedAccessCapability = {
  capabilityId: string;
  issuedAt: number;
  expiresAt: number;
  subject: {
    actorId: string;
    tenantId?: string;
    moduleId?: string;
  };
  provider: string;
  operation: string;
  scope: Record<string, string>;
  returnType: 'token' | 'credentialRef';
  // Note: this is intentionally opaque to callers.
  token?: string;
  credentialRef?: string;
  metadata: {
    policyDecision: 'allow';
    workItemId?: string;
    reason?: string;
  };
};

const DEFAULT_TTL_SECONDS = 300;
const MAX_TTL_SECONDS = 3600;

type CapabilityProfile = {
  profileRef: string;
  provider: string;
  operation: string;
  allowedModules?: string[];
  scopeDefaults?: Record<string, string>;
  defaultTtlSeconds?: number;
  maxTtlSeconds?: number;
  defaultReturnType?: 'token' | 'credentialRef';
  allowedReturnTypes?: Array<'token' | 'credentialRef'>;
};

const CAPABILITY_PROFILES: Record<string, CapabilityProfile> = {
  'aws.eks.listClusters.read.v1': {
    profileRef: 'aws.eks.listClusters.read.v1',
    provider: 'aws',
    operation: 'eks:ListClusters',
    allowedModules: ['msp_aws'],
    scopeDefaults: {
      access: 'read',
      service: 'eks',
    },
    defaultTtlSeconds: 300,
    maxTtlSeconds: 900,
    defaultReturnType: 'credentialRef',
    allowedReturnTypes: ['credentialRef'],
  },
  'aws.ecr.listRepositories.read.v1': {
    profileRef: 'aws.ecr.listRepositories.read.v1',
    provider: 'aws',
    operation: 'ecr:DescribeRepositories',
    allowedModules: ['msp_aws'],
    scopeDefaults: {
      access: 'read',
      service: 'ecr',
    },
    defaultTtlSeconds: 300,
    maxTtlSeconds: 900,
    defaultReturnType: 'credentialRef',
    allowedReturnTypes: ['credentialRef'],
  },
};

export type ResolvedCapabilityRequest = {
  profileRef?: string;
  provider: string;
  operation: string;
  scope: Record<string, string>;
  ttlSeconds: number;
  returnType: 'token' | 'credentialRef';
};

export const IssueAccessCapabilityActivity: ServiceActivity = {
  namespace: 'security',
  activityName: 'issueAccessCapability',
  version: '1.0.0',
  matchingVersionRange: '^1.0.0',
  context: '*',
  funcs: issueAccessCapabilityHandler,
};

async function issueAccessCapabilityHandler(
  payload: IssueAccessCapabilityPayload,
  resultBuilder: ServiceActivityResultBuilder,
): Promise<ServiceActivityResultBuilder> {
  const actorId = payload?.subject?.actorId?.trim();
  if (!actorId) {
    return resultBuilder.failed('subject.actorId is required', {
      code: 'INVALID_INPUT',
    });
  }

  let resolved: ResolvedCapabilityRequest;
  try {
    resolved = resolveCapabilityRequest(payload.request, payload.subject.moduleId);
  } catch (error: any) {
    return resultBuilder.failed(error?.message || 'Invalid capability request', {
      code: 'INVALID_INPUT',
      details: error?.details,
    });
  }

  const issuedAt = Date.now();
  const expiresAt = issuedAt + resolved.ttlSeconds * 1000;

  // Placeholder policy gate: real implementation should validate actor/work/policy.
  const policyDecision: 'allow' = 'allow';

  const capabilityId = randomUUID();
  const capability: IssuedAccessCapability = {
    capabilityId,
    issuedAt,
    expiresAt,
    subject: {
      actorId,
      tenantId: payload.subject.tenantId,
      moduleId: payload.subject.moduleId,
    },
    provider: resolved.provider,
    operation: resolved.operation,
    scope: resolved.scope,
    returnType: resolved.returnType,
    token: resolved.returnType === 'token' ? `cap_${randomUUID()}` : undefined,
    credentialRef: resolved.returnType === 'credentialRef' ? `capref://${capabilityId}` : undefined,
    metadata: {
      policyDecision,
      workItemId: payload?.context?.workItemId,
      reason: payload?.context?.reason,
    },
  };

  resultBuilder.log(
    `Issued capability id=${capability.capabilityId} actor=${actorId} provider=${resolved.provider} operation=${resolved.operation} ttl=${resolved.ttlSeconds}s profile=${resolved.profileRef || 'custom'}`,
  );

  return resultBuilder.success({ data: capability });
}

export function resolveCapabilityRequest(
  request: IssueAccessCapabilityPayload['request'],
  moduleId?: string,
): ResolvedCapabilityRequest {
  const profileRef = request?.profileRef?.trim();
  const profile = profileRef ? CAPABILITY_PROFILES[profileRef] : undefined;

  if (profileRef && !profile) {
    throw {
      message: `Unknown capability profileRef: ${profileRef}`,
      details: { profileRef },
    };
  }

  if (profile?.allowedModules?.length) {
    const requestedModule = (moduleId || '').trim();
    if (!requestedModule) {
      throw {
        message: `subject.moduleId is required for profile ${profile.profileRef}`,
        details: {
          profileRef: profile.profileRef,
          allowedModules: profile.allowedModules,
        },
      };
    }
    if (!profile.allowedModules.includes(requestedModule)) {
      throw {
        message: `moduleId ${requestedModule} is not allowed for profile ${profile.profileRef}`,
        details: {
          profileRef: profile.profileRef,
          moduleId: requestedModule,
          allowedModules: profile.allowedModules,
        },
      };
    }
  }

  const provider = (request?.provider || profile?.provider || '').trim();
  const operation = (request?.operation || profile?.operation || '').trim();

  if (!provider || !operation) {
    throw {
      message: 'request.provider and request.operation are required (or supply request.profileRef)',
    };
  }

  if (profile) {
    if (request?.provider && request.provider.trim() !== profile.provider) {
      throw {
        message: `request.provider must match profile provider ${profile.provider}`,
        details: { profileRef, provider: request.provider },
      };
    }
    if (request?.operation && request.operation.trim() !== profile.operation) {
      throw {
        message: `request.operation must match profile operation ${profile.operation}`,
        details: { profileRef, operation: request.operation },
      };
    }
  }

  const requestedReturnType = request?.returnType || profile?.defaultReturnType || 'token';
  if (profile?.allowedReturnTypes && !profile.allowedReturnTypes.includes(requestedReturnType)) {
    throw {
      message: `returnType ${requestedReturnType} is not allowed for profile ${profile.profileRef}`,
      details: {
        profileRef: profile.profileRef,
        allowedReturnTypes: profile.allowedReturnTypes,
      },
    };
  }

  const defaultTtl = profile?.defaultTtlSeconds ?? DEFAULT_TTL_SECONDS;
  const maxTtl = profile?.maxTtlSeconds ?? MAX_TTL_SECONDS;
  const ttlSeconds = clampTtl(request?.ttlSeconds ?? defaultTtl, maxTtl);

  return {
    profileRef,
    provider,
    operation,
    scope: {
      ...(profile?.scopeDefaults || {}),
      ...(request?.scope || {}),
    },
    ttlSeconds,
    returnType: requestedReturnType,
  };
}

function clampTtl(ttl: number, maxTtl: number = MAX_TTL_SECONDS): number {
  if (!Number.isFinite(ttl) || ttl <= 0) {
    return DEFAULT_TTL_SECONDS;
  }
  return Math.min(Math.floor(ttl), maxTtl);
}
