import { createPublicKey } from 'node:crypto';
import { importPKCS8, SignJWT } from 'jose';
import { randomUUID } from 'node:crypto';

export type TestingTokenRequest = {
  subject?: string;
  audience?: string | string[];
  scope?: string | string[];
  expiresInSeconds?: number;
  tenantId?: string;
  roles?: string[];
  permissions?: string[];
  claims?: Record<string, unknown>;
};

export type TestingTokenResponse = {
  access_token: string;
  token_type: 'Bearer';
  expires_in: number;
  scope: string;
};

export type TestingIssuerConfig = {
  enabled: boolean;
  name: string;
  issuer: string;
  signingKid: string;
  privateKeyPem: string;
  defaultTtlSeconds: number;
  maxTtlSeconds: number;
};

type TestingSigningKey = {
  kid: string;
  privateKeyPem: string;
};

function stringList(value: string | string[] | undefined): string[] {
  const values = Array.isArray(value) ? value : value?.split(/[ ,]+/) ?? [];
  return values.map((item) => item.trim()).filter(Boolean);
}

function resolveSigningKey(): TestingSigningKey {
  const suffix = process.env['MSP_SECURITY_IN_USE_SUFFIX'] === '2' ? '2' : '1';
  const kid = process.env[`MSP_SECURITY_DEFAULT_KID_${suffix}`]
    || process.env['MSP_SECURITY_DEFAULT_KID'];
  const privateKeyPem = process.env[`MSP_SECURITY_DEFAULT_PRIVATE_KEY_PEM_${suffix}`]
    || process.env['MSP_SECURITY_DEFAULT_PRIVATE_KEY_PEM'];

  if (!kid || !privateKeyPem) {
    throw new Error('MSP Security testing issuer signing key is not configured.');
  }

  return { kid, privateKeyPem };
}

export function getTestingIssuerConfig(myUrl: string): TestingIssuerConfig {
  const issuer = (process.env['MSP_SECURITY_TESTING_ISSUER_URL'] || `${myUrl.replace(/\/$/, '')}/testing`).replace(/\/$/, '');
  const defaultTtlSeconds = Number(process.env['MSP_SECURITY_TESTING_DEFAULT_TTL_SECONDS'] || 300);
  const maxTtlSeconds = Number(process.env['MSP_SECURITY_TESTING_MAX_TTL_SECONDS'] || 3600);
  const enabled = process.env['MSP_SECURITY_TESTING_ISSUER_ENABLED'] === 'true';
  const signingKey = enabled ? resolveSigningKey() : { kid: '', privateKeyPem: '' };

  return {
    enabled,
    name: 'MSP_Security_Testing',
    issuer,
    signingKid: signingKey.kid,
    privateKeyPem: signingKey.privateKeyPem,
    defaultTtlSeconds: Number.isFinite(defaultTtlSeconds) ? defaultTtlSeconds : 300,
    maxTtlSeconds: Number.isFinite(maxTtlSeconds) ? maxTtlSeconds : 3600,
  };
}

export async function issueTestingToken(
  config: TestingIssuerConfig,
  request: TestingTokenRequest,
): Promise<TestingTokenResponse> {
  if (!config.enabled) {
    throw new Error('MSP Security testing issuer is disabled.');
  }

  const subject = request.subject?.trim();
  const audience = stringList(request.audience);
  const scope = stringList(request.scope);

  if (!subject) throw new Error('subject is required.');
  if (audience.length === 0) throw new Error('audience is required.');
  if (scope.length === 0) throw new Error('scope is required.');

  const requestedTtl = Number(request.expiresInSeconds ?? config.defaultTtlSeconds);
  const expiresIn = Math.min(
    Math.max(Number.isFinite(requestedTtl) ? requestedTtl : config.defaultTtlSeconds, 1),
    config.maxTtlSeconds,
  );
  const issuedAt = Math.floor(Date.now() / 1000);
  const privateKey = await importPKCS8(config.privateKeyPem, 'RS256');
  const customClaims = request.claims ?? {};
  const reservedClaims = new Set(['iss', 'sub', 'aud', 'iat', 'exp', 'jti', 'nbf']);

  for (const claim of Object.keys(customClaims)) {
    if (reservedClaims.has(claim)) {
      throw new Error(`claims.${claim} cannot override a reserved JWT claim.`);
    }
  }

  const payload: Record<string, unknown> = {
    ...customClaims,
    token_use: 'service',
    issuer_name: config.name,
    scope: scope.join(' '),
  };
  if (request.tenantId?.trim()) payload.tenant_id = request.tenantId.trim();
  if (request.roles?.length) payload.roles = request.roles;
  if (request.permissions?.length) payload.permissions = request.permissions;

  const accessToken = await new SignJWT(payload)
    .setProtectedHeader({ alg: 'RS256', kid: config.signingKid, typ: 'JWT' })
    .setIssuer(config.issuer)
    .setSubject(subject)
    .setAudience(audience)
    .setIssuedAt(issuedAt)
    .setExpirationTime(issuedAt + expiresIn)
    .setJti(randomUUID())
    .sign(privateKey);

  return {
    access_token: accessToken,
    token_type: 'Bearer',
    expires_in: expiresIn,
    scope: scope.join(' '),
  };
}

export function getTestingJwks(config: TestingIssuerConfig) {
  if (!config.enabled || !config.privateKeyPem) {
    throw new Error('MSP Security testing issuer is disabled.');
  }

  const publicJwk = createPublicKey(config.privateKeyPem).export({ format: 'jwk' }) as { kty?: string; n?: string; e?: string };
  return {
    keys: [{
      kty: publicJwk.kty,
      n: publicJwk.n,
      e: publicJwk.e,
      kid: config.signingKid,
      alg: 'RS256',
      use: 'sig',
    }],
  };
}
