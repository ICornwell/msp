import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { runWithContext, setAssertionStoreEntry, type AssertionStoreEntry } from './context.js';
import {
  getUltimateRequesterId,
  getUltimateRequesterName,
  getUltimateRequesterRoles,
  getScopes,
  hasScopes,
  hasRole,
  resolveStandardizedClaim,
  resetClaimResolverStrategies,
  setClaimResolverStrategies,
  type ClaimResolverStrategy,
} from './assertionHelpers.js';

function withFreshContext<T>(fn: () => T): T {
  return runWithContext(
    {
      requestId: 'test-request',
      timestamp: Date.now(),
      assertionStore: {},
      metadataStore: {},
    },
    fn,
  );
}

function putAssertion(entry: AssertionStoreEntry): void {
  setAssertionStoreEntry(entry.assertionName, entry);
}

describe('assertionHelpers claim resolver', () => {
  beforeEach(() => {
    resetClaimResolverStrategies();
  });

  afterEach(() => {
    resetClaimResolverStrategies();
  });

  it('prefers impersonated actor over actor over user for ultimate requester fields', () => {
    const resolved = withFreshContext(() => {
      putAssertion({
        assertionName: 'msp-user-id-assertion',
        headerName: 'msp-user-id-assertion',
        assertionType: 'id',
        token: 'user-token',
        claims: { sub: 'user-sub', name: 'User Name', iat: 100 },
      });

      putAssertion({
        assertionName: 'msp-actor-id-assertion',
        headerName: 'msp-actor-id-assertion',
        assertionType: 'id',
        token: 'actor-token',
        claims: { sub: 'actor-sub', name: 'Actor Name', iat: 200 },
      });

      putAssertion({
        assertionName: 'msp-impersonated-actor-id-assertion',
        headerName: 'msp-impersonated-actor-id-assertion',
        assertionType: 'id',
        token: 'imp-token',
        claims: { sub: 'imp-sub', name: 'Impersonated Name', roles: ['Admin'], iat: 50 },
      });

      return {
        id: getUltimateRequesterId(),
        name: getUltimateRequesterName(),
        roles: getUltimateRequesterRoles(),
      };
    });

    expect(resolved.id).toBe('imp-sub');
    expect(resolved.name).toBe('Impersonated Name');
    expect(resolved.roles).toEqual(['Admin']);
  });

  it('uses latest timestamp when priorities are equal', () => {
    const strategies: ClaimResolverStrategy[] = [
      {
        name: 'same-priority-a',
        priority: 2,
        assertionType: 'id',
        assertionNamePattern: '^msp-custom-a-assertion$',
        claimFieldMappings: {
          ultimateRequesterName: ['name'],
        },
      },
      {
        name: 'same-priority-b',
        priority: 2,
        assertionType: 'id',
        assertionNamePattern: '^msp-custom-b-assertion$',
        claimFieldMappings: {
          ultimateRequesterName: ['name'],
        },
      },
    ];

    const resolved = withFreshContext(() => {
      setClaimResolverStrategies(strategies);

      putAssertion({
        assertionName: 'msp-custom-a-assertion',
        headerName: 'msp-custom-a-assertion',
        assertionType: 'id',
        token: 'a-token',
        claims: { name: 'Older', iat: 1710000000 },
      });

      putAssertion({
        assertionName: 'msp-custom-b-assertion',
        headerName: 'msp-custom-b-assertion',
        assertionType: 'id',
        token: 'b-token',
        claims: { name: 'Newer', iat: 1720000000 },
      });

      return resolveStandardizedClaim('ultimateRequesterName');
    });

    expect(resolved?.value).toBe('Newer');
    expect(resolved?.strategyName).toBe('same-priority-b');
  });

  it('selector-based scopes and roles match by type and issuer/subject patterns', () => {
    const result = withFreshContext(() => {
      putAssertion({
        assertionName: 'msp-auth-access-1-assertion',
        headerName: 'msp-auth-access-1-assertion',
        assertionType: 'access',
        token: 'access-token-1',
        claims: {
          sub: 'svc-123',
          iss: 'https://issuer.alpha.example',
          scp: 'read:orders write:orders',
          roles: ['ApiUser'],
        },
      });

      putAssertion({
        assertionName: 'msp-auth-access-2-assertion',
        headerName: 'msp-auth-access-2-assertion',
        assertionType: 'access',
        token: 'access-token-2',
        claims: {
          sub: 'svc-456',
          iss: 'https://issuer.beta.example',
          scope: ['read:orders'],
          roles: ['Operator'],
        },
      });

      const selector = {
        assertionType: 'access' as const,
        issPattern: 'issuer.alpha.example',
        subPattern: '^svc-123$',
      };

      return {
        scopes: getScopes(selector),
        hasAll: hasScopes(['read:orders', 'write:orders'], selector),
        hasAdminRole: hasRole('ApiUser', selector),
      };
    });

    expect(result.scopes).toEqual(['read:orders', 'write:orders']);
    expect(result.hasAll).toBe(true);
    expect(result.hasAdminRole).toBe(true);
  });

  it('returns false for selector mismatch', () => {
    const allowed = withFreshContext(() => {
      putAssertion({
        assertionName: 'msp-auth-access-1-assertion',
        headerName: 'msp-auth-access-1-assertion',
        assertionType: 'access',
        token: 'access-token',
        claims: {
          sub: 'svc-good',
          iss: 'https://issuer.allowed.example',
          scp: 'secrets:read',
          roles: ['SecretsReader'],
        },
      });

      const selector = {
        assertionType: 'access' as const,
        issPattern: 'issuer.denied.example',
        subPattern: '^svc-good$',
      };

      return {
        scopes: getScopes(selector),
        hasScopeSet: hasScopes(['secrets:read'], selector),
        hasReaderRole: hasRole('SecretsReader', selector),
      };
    });

    expect(allowed.scopes).toEqual([]);
    expect(allowed.hasScopeSet).toBe(false);
    expect(allowed.hasReaderRole).toBe(false);
  });
});
