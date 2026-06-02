import { describe, expect, it } from 'vitest';

import { resolveCapabilityRequest } from './issueAccessCapability.js';

describe('issueAccessCapability profile resolution', () => {
  it('resolves built-in profile defaults for aws eks read', () => {
    const resolved = resolveCapabilityRequest({
      profileRef: 'aws.eks.listClusters.read.v1',
    }, 'msp_aws');

    expect(resolved.provider).toBe('aws');
    expect(resolved.operation).toBe('eks:ListClusters');
    expect(resolved.returnType).toBe('credentialRef');
    expect(resolved.scope.service).toBe('eks');
    expect(resolved.scope.access).toBe('read');
    expect(resolved.ttlSeconds).toBe(300);
  });

  it('applies bounded ttl and merges scope overrides', () => {
    const resolved = resolveCapabilityRequest({
      profileRef: 'aws.ecr.listRepositories.read.v1',
      ttlSeconds: 9999,
      scope: {
        region: 'eu-west-2',
      },
    }, 'msp_aws');

    expect(resolved.ttlSeconds).toBe(900);
    expect(resolved.scope.service).toBe('ecr');
    expect(resolved.scope.region).toBe('eu-west-2');
  });

  it('supports explicit provider/operation without profileRef', () => {
    const resolved = resolveCapabilityRequest({
      provider: 'custom',
      operation: 'vendor:doThing',
      returnType: 'token',
    });

    expect(resolved.provider).toBe('custom');
    expect(resolved.operation).toBe('vendor:doThing');
    expect(resolved.returnType).toBe('token');
  });

  it('rejects unknown profile references', () => {
    expect(() =>
      resolveCapabilityRequest({
        profileRef: 'aws.unknown.v1',
      }),
    ).toThrow('Unknown capability profileRef');
  });

  it('rejects profile use by non-allowed module', () => {
    expect(() =>
      resolveCapabilityRequest(
        {
          profileRef: 'aws.eks.listClusters.read.v1',
        },
        'msp_random',
      ),
    ).toThrow('is not allowed for profile');
  });

  it('requires moduleId for module-scoped profile', () => {
    expect(() =>
      resolveCapabilityRequest({
        profileRef: 'aws.eks.listClusters.read.v1',
      }),
    ).toThrow('subject.moduleId is required for profile');
  });
});
