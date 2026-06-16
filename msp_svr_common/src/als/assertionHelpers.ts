import { ValidatedToken } from './jwtTokens.js';
import {
  AccessAssertion,
  IdAssertion,
  WorkAssertion,
  AssertionStoreEntry,
  canonicalHeaderName,
  getAssertionStore,
  getAssertionStoreEntry,
  getMetadataStoreEntry,
  getRequestContext,
  inferAssertionTypeFromHeaderName,
  setAssertionStoreEntry,
} from './context.js';

export const USER_ID_ASSERTION_HEADER = 'msp-user-id-assertion';
export const AUTH_ACCESS_PRIMARY_ASSERTION_HEADER = 'msp-auth-access-1-assertion';
export const WORK_ASSERTION_HEADER = 'msp-work-assertion';

type ClaimPattern = string | RegExp;

export type ClaimResolverSelector = {
  assertionType: AssertionStoreEntry['assertionType'];
  assertionNamePattern?: ClaimPattern;
  issPattern?: ClaimPattern;
  subPattern?: ClaimPattern;
};

export type ClaimFieldMappings = Record<string, string[]>;

export type ClaimResolverStrategy = ClaimResolverSelector & {
  name: string;
  priority: number; // 1 is highest priority, 10 is lowest
  claimFieldMappings: ClaimFieldMappings;
};

export type ResolvedClaim = {
  standardizedField: string;
  value: any;
  claimName: string;
  assertionName: string;
  assertionType: AssertionStoreEntry['assertionType'];
  issuer?: string;
  subject?: string;
  strategyName: string;
  priority: number;
  timestamp: number;
};

const ULTIMATE_REQUESTER_FIELD_MAPPINGS: ClaimFieldMappings = {
  ultimateRequesterId: ['oid', 'sub'],
  ultimateRequesterName: ['name', 'preferred_username', 'email', 'upn'],
  ultimateRequesterEmail: ['email', 'upn', 'preferred_username'],
  ultimateRequesterRoles: ['roles'],
};

const ACCESS_FIELD_MAPPINGS: ClaimFieldMappings = {
  scopes: ['scp', 'scope'],
  roles: ['roles'],
  clientId: ['client_id', 'azp', 'appid'],
  tenantId: ['tid'],
};

const DEFAULT_CLAIM_RESOLVER_STRATEGIES: ClaimResolverStrategy[] = [
  {
    name: 'ultimate-requester-impersonated-actor',
    priority: 1,
    assertionType: 'id',
    assertionNamePattern: /^msp-impersonated-actor-id-assertion$/,
    claimFieldMappings: ULTIMATE_REQUESTER_FIELD_MAPPINGS,
  },
  {
    name: 'ultimate-requester-actor',
    priority: 2,
    assertionType: 'id',
    assertionNamePattern: /^msp-actor-id-assertion$/,
    claimFieldMappings: ULTIMATE_REQUESTER_FIELD_MAPPINGS,
  },
  {
    name: 'ultimate-requester-user',
    priority: 3,
    assertionType: 'id',
    assertionNamePattern: /^msp-user-id-assertion$/,
    claimFieldMappings: ULTIMATE_REQUESTER_FIELD_MAPPINGS,
  },
  {
    name: 'ultimate-requester-id-fallback',
    priority: 4,
    assertionType: 'id',
    claimFieldMappings: ULTIMATE_REQUESTER_FIELD_MAPPINGS,
  },
  {
    name: 'access-claims-default',
    priority: 4,
    assertionType: 'access',
    claimFieldMappings: ACCESS_FIELD_MAPPINGS,
  },
];

let claimResolverStrategies: ClaimResolverStrategy[] = [...DEFAULT_CLAIM_RESOLVER_STRATEGIES];

function normalisePriority(priority: number): number {
  const bounded = Number.isFinite(priority) ? Math.floor(priority) : 10;
  return Math.min(10, Math.max(1, bounded));
}

function matchPattern(value: string | undefined, pattern?: ClaimPattern): boolean {
  if (!pattern) {
    return true;
  }

  if (!value) {
    return false;
  }

  if (pattern instanceof RegExp) {
    return pattern.test(value);
  }

  return new RegExp(pattern).test(value);
}

function normaliseTimestamp(value: any): number | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    return value > 1e12 ? value : value * 1000;
  }

  if (typeof value === 'string') {
    const asNumber = Number(value);
    if (Number.isFinite(asNumber)) {
      return asNumber > 1e12 ? asNumber : asNumber * 1000;
    }

    const parsedDate = Date.parse(value);
    if (Number.isFinite(parsedDate)) {
      return parsedDate;
    }
  }

  return undefined;
}

function getClaimTimestamp(claims: Record<string, any>): number {
  const candidates = [
    claims.timestamp,
    claims.ts,
    claims.auth_time,
    claims.iat,
    claims.nbf,
    claims.exp,
  ];

  const parsed = candidates
    .map(normaliseTimestamp)
    .filter((value): value is number => value !== undefined);

  if (parsed.length === 0) {
    return 0;
  }

  return Math.max(...parsed);
}

function strategyMatchesEntry(strategy: ClaimResolverStrategy, entry: AssertionStoreEntry): boolean {
  if (entry.assertionType !== strategy.assertionType) {
    return false;
  }

  const claims = entry.claims || {};
  return matchPattern(entry.assertionName, strategy.assertionNamePattern)
    && matchPattern(typeof claims.iss === 'string' ? claims.iss : undefined, strategy.issPattern)
    && matchPattern(typeof claims.sub === 'string' ? claims.sub : undefined, strategy.subPattern);
}

function resolveWithStrategies(
  standardizedField: string,
  strategies: ClaimResolverStrategy[],
): ResolvedClaim | undefined {
  const entries = Object.values(getAssertionStore());
  let winner: ResolvedClaim | undefined;

  for (const entry of entries) {
    const claims = entry.claims || {};
    const timestamp = getClaimTimestamp(claims);

    for (const strategy of strategies) {
      if (!strategyMatchesEntry(strategy, entry)) {
        continue;
      }

      const claimNames = strategy.claimFieldMappings[standardizedField] || [];
      if (claimNames.length === 0) {
        continue;
      }

      for (const claimName of claimNames) {
        const value = claims[claimName];
        if (value === undefined || value === null || value === '') {
          continue;
        }

        const priority = normalisePriority(strategy.priority);
        const candidate: ResolvedClaim = {
          standardizedField,
          value,
          claimName,
          assertionName: entry.assertionName,
          assertionType: entry.assertionType,
          issuer: typeof claims.iss === 'string' ? claims.iss : undefined,
          subject: typeof claims.sub === 'string' ? claims.sub : undefined,
          strategyName: strategy.name,
          priority,
          timestamp,
        };

        if (!winner) {
          winner = candidate;
          continue;
        }

        if (candidate.priority < winner.priority) {
          winner = candidate;
          continue;
        }

        if (candidate.priority === winner.priority && candidate.timestamp > winner.timestamp) {
          winner = candidate;
        }
      }
    }
  }

  return winner;
}

export function getClaimResolverStrategies(): ClaimResolverStrategy[] {
  return [...claimResolverStrategies];
}

export function setClaimResolverStrategies(strategies: ClaimResolverStrategy[]): void {
  claimResolverStrategies = [...strategies].map((strategy) => ({
    ...strategy,
    priority: normalisePriority(strategy.priority),
  }));
}

export function registerClaimResolverStrategy(strategy: ClaimResolverStrategy): void {
  claimResolverStrategies.push({
    ...strategy,
    priority: normalisePriority(strategy.priority),
  });
}

export function resetClaimResolverStrategies(): void {
  claimResolverStrategies = [...DEFAULT_CLAIM_RESOLVER_STRATEGIES];
}

export function resolveStandardizedClaim(
  standardizedField: string,
  strategies: ClaimResolverStrategy[] = claimResolverStrategies,
): ResolvedClaim | undefined {
  return resolveWithStrategies(standardizedField, strategies);
}

function asStringArray(value: any): string[] {
  if (Array.isArray(value)) {
    return value.map((item) => String(item)).filter(Boolean);
  }

  if (typeof value === 'string') {
    return value.split(' ').map((item) => item.trim()).filter(Boolean);
  }

  if (value === undefined || value === null) {
    return [];
  }

  return [String(value)];
}

export function UserIdAssertionFromValidatedToken(token: ValidatedToken): IdAssertion {
  return {
    headerName: USER_ID_ASSERTION_HEADER,
    idToken: token.raw,
    idTokenClaims: token.payload as Record<string, any>,
  };
}

export function AuthorizationAccessAssertionFromValidatedToken(token: ValidatedToken): AccessAssertion {
  return {
    headerName: AUTH_ACCESS_PRIMARY_ASSERTION_HEADER,
    accessToken: token.raw,
    accessTokenClaims: token.payload as Record<string, any>,
  };
}

export function WorkAssertionFromValidatedToken(token: ValidatedToken): WorkAssertion {
  return {
    headerName: WORK_ASSERTION_HEADER,
    workToken: token.raw,
    workTokenClaims: token.payload as Record<string, any>,
  };
}

export function getUltimateRequesterId(): string | undefined {
  return resolveStandardizedClaim('ultimateRequesterId')?.value;
}

export function getUltimateRequesterName(): string | undefined {
  return resolveStandardizedClaim('ultimateRequesterName')?.value;
}

export function getUltimateRequesterEmail(): string | undefined {
  return resolveStandardizedClaim('ultimateRequesterEmail')?.value;
}

export function getUltimateRequesterRoles(): string[] {
  return asStringArray(resolveStandardizedClaim('ultimateRequesterRoles')?.value);
}

export function hasRole(role: string, selector: ClaimResolverSelector): boolean {
  const selectorStrategy: ClaimResolverStrategy = {
    name: 'selector-roles',
    priority: 1,
    ...selector,
    claimFieldMappings: {
      roles: ['roles'],
    },
  };
  const roles = asStringArray(resolveStandardizedClaim('roles', [selectorStrategy])?.value);
  return roles.includes(role);
}

export function hasAnyRole(roles: string[], selector: ClaimResolverSelector): boolean {
  const selectorStrategy: ClaimResolverStrategy = {
    name: 'selector-roles-any',
    priority: 1,
    ...selector,
    claimFieldMappings: {
      roles: ['roles'],
    },
  };
  const requesterRoles = asStringArray(resolveStandardizedClaim('roles', [selectorStrategy])?.value);
  return roles.some((role) => requesterRoles.includes(role));
}

export function hasAllRoles(roles: string[], selector: ClaimResolverSelector): boolean {
  const selectorStrategy: ClaimResolverStrategy = {
    name: 'selector-roles-all',
    priority: 1,
    ...selector,
    claimFieldMappings: {
      roles: ['roles'],
    },
  };
  const requesterRoles = asStringArray(resolveStandardizedClaim('roles', [selectorStrategy])?.value);
  return roles.every((role) => requesterRoles.includes(role));
}

export function getUserIdAssertionClaim(claimName: string): any {
  return getNamedIdAssertionClaim(USER_ID_ASSERTION_HEADER, claimName);
}

export function getAllUserIdAssertionClaims(): Record<string, any> | undefined {
  return getNamedIdAssertionClaims(USER_ID_ASSERTION_HEADER);
}

export function setUserIdAssertion(idAssertion: IdAssertion): void {
  setNamedIdAssertion(USER_ID_ASSERTION_HEADER, idAssertion);
}

export function getNamedIdAssertionClaim(assertionName: string, claimName: string): any {
  return getNamedIdAssertionClaims(assertionName)?.[claimName];
}

export function getNamedIdAssertionClaims(assertionName: string): Record<string, any> | undefined {
  const entry = getAssertionStoreEntry(assertionName);
  if (!entry || entry.assertionType !== 'id') {
    return undefined;
  }
  return entry.claims;
}

export function setNamedIdAssertion(assertionName: string, idAssertion: IdAssertion): void {
  const key = canonicalHeaderName(assertionName);
  const headerName = canonicalHeaderName(idAssertion.headerName || key);
  if (!idAssertion.idToken || !idAssertion.idTokenClaims) {
    return;
  }
  setAssertionStoreEntry(key, {
    assertionName: key,
    assertionType: 'id',
    headerName,
    token: idAssertion.idToken,
    claims: idAssertion.idTokenClaims,
  });
}

export function getAuthorizationAccessAssertionClaim(claimName: string): any {
  return getNamedAuthorizationAccessAssertionClaim(AUTH_ACCESS_PRIMARY_ASSERTION_HEADER, claimName);
}

export function getAllAuthorizationAccessAssertionClaims(): Record<string, any> | undefined {
  return getAllNamedAuthorizationAccessAssertionClaims(AUTH_ACCESS_PRIMARY_ASSERTION_HEADER);
}

export function setAuthorizationAccessAssertion(accessAssertion: AccessAssertion): void {
  setNamedAuthorizationAccessAssertion(accessAssertion.headerName || AUTH_ACCESS_PRIMARY_ASSERTION_HEADER, accessAssertion);
}

export function getNamedAuthorizationAccessAssertionClaim(assertionName: string, claimName: string): any {
  return getAllNamedAuthorizationAccessAssertionClaims(assertionName)?.[claimName];
}

export function getAllNamedAuthorizationAccessAssertionClaims(assertionName: string): Record<string, any> | undefined {
  const entry = getAssertionStoreEntry(assertionName);
  if (!entry || entry.assertionType !== 'access') {
    return undefined;
  }
  return entry.claims;
}

export function setNamedAuthorizationAccessAssertion(assertionName: string, accessAssertion: AccessAssertion): void {
  const key = canonicalHeaderName(assertionName);
  const headerName = canonicalHeaderName(accessAssertion.headerName || key);
  if (!accessAssertion.accessToken || !accessAssertion.accessTokenClaims) {
    return;
  }
  setAssertionStoreEntry(key, {
    assertionName: key,
    assertionType: 'access',
    headerName,
    token: accessAssertion.accessToken,
    claims: accessAssertion.accessTokenClaims,
  });
}

export function getClientId(): string | undefined {
  return resolveStandardizedClaim('clientId')?.value;
}

export function getTenantId(): string | undefined {
  const resolved = resolveStandardizedClaim('tenantId');
  if (resolved?.value) {
    return resolved.value;
  }

  const idClaims = getAllUserIdAssertionClaims();
  return idClaims?.tid;
}

export function getCorrelationId(): string | undefined {
  return getMetadataStoreEntry('msp-correlation-id');
}

export function getRequestId(): string | undefined {
  return getRequestContext()?.requestId;
}

export function getAssertionToken(assertionName: string): string | undefined {
  return getAssertionStoreEntry(assertionName)?.token;
}

export function getAssertionStoreEntries() {
  return getAssertionStore();
}

export function getScopes(selector: ClaimResolverSelector): string[] {
  const selectorStrategy: ClaimResolverStrategy = {
    name: 'selector-scopes',
    priority: 1,
    ...selector,
    claimFieldMappings: {
      scopes: ['scp', 'scope'],
    },
  };
  return asStringArray(resolveStandardizedClaim('scopes', [selectorStrategy])?.value);
}

export function hasScopes(scopes: string[], selector: ClaimResolverSelector): boolean {
  const availableScopes = getScopes(selector);
  return scopes.every((scope) => availableScopes.includes(scope));
}

export function getCustomClaim(claimName: string): any {
  for (const entry of Object.values(getAssertionStore())) {
    if (claimName in entry.claims) {
      return entry.claims[claimName];
    }
  }
  return undefined;
}

export function setNamedWorkAssertion(assertionName: string, workAssertion: WorkAssertion): void {
  const key = canonicalHeaderName(assertionName);
  const headerName = canonicalHeaderName(workAssertion.headerName || key);
  if (!workAssertion.workToken || !workAssertion.workTokenClaims) {
    return;
  }
  setAssertionStoreEntry(key, {
    assertionName: key,
    assertionType: 'work',
    headerName,
    token: workAssertion.workToken,
    claims: workAssertion.workTokenClaims,
  });
}

export function upsertAssertionFromValidatedToken(
  assertionHeaderName: string,
  token: ValidatedToken,
  assertionType?: AssertionStoreEntry['assertionType'],
): void {
  const headerName = canonicalHeaderName(assertionHeaderName);
  const type = assertionType ?? inferAssertionTypeFromHeaderName(headerName);
  setAssertionStoreEntry(headerName, {
    assertionName: headerName,
    assertionType: type,
    headerName,
    token: token.raw,
    claims: token.payload as Record<string, any>,
  });
}
