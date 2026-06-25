import { constants } from 'crypto';
import { createPublicKey, generateKeyPairSync, privateDecrypt, publicEncrypt, type KeyObject } from 'crypto';

import { getUltimateRequesterId, getClientId } from '../als/assertionHelpers.js';
import { runServiceActivity } from '../comms/serviceRequest.js';
import type { ServiceRequestOptions, ServiceRequestResult } from 'msp_common';

type SecurityEncryptionPublicKey = {
  kid: string;
  kty: string;
  alg: string;
  use: 'enc';
  n?: string;
  e?: string;
  key_ops?: string[];
};

type StoreSecretServicePayload = {
  serviceId: string;
  secretName: string;
  encryptedSecret: string;
  kid: string;
  alg?: 'RSA-OAEP-256' | 'RSA-OAEP';
  metadata?: Record<string, string>;
  upsertMode?: 'replace' | 'createOnly';
};

type RetrieveSecretServicePayload = {
  serviceId: string;
  secretName: string;
  requesterServiceId?: string;
  decrypt?: boolean;
  requesterPublicKey?: {
    kid?: string;
    alg?: 'RSA-OAEP-256' | 'RSA-OAEP';
    pem?: string;
    jwk?: JsonWebKey;
  };
};

type StoreSecretServiceResult = {
  secretRef: string;
  serviceId: string;
  secretName: string;
  version: number;
  kid: string;
  storedAt: string;
};

type RetrieveSecretServiceResult = {
  serviceId: string;
  secretName: string;
  encryptedSecretForRequester?: string;
  requesterEncryptionAlg?: 'RSA-OAEP-256' | 'RSA-OAEP';
  requesterKid?: string;
  kid: string;
  alg: 'RSA-OAEP-256' | 'RSA-OAEP';
  version: number;
  metadata: Record<string, string>;
  storedAt: string;
  lastAccessedAt?: string;
};

export type StoreSecretForServiceIdPayload = {
  serviceId: string;
  secretName: string;
  secret: string;
  metadata?: Record<string, string>;
  clientCacheTtlMs?: number;
  upsertMode?: 'replace' | 'createOnly';
};

export type FetchSecretForServiceIdPayload = {
  serviceId: string;
  secretName: string;
  requesterServiceId?: string;
  forceRefresh?: boolean;
};

export type StoreSecretForServiceIdResult = ServiceRequestResult<StoreSecretServiceResult>;

export type FetchSecretForServiceIdResult = {
  secret?: string;
  serviceId: string;
  secretName: string;
  version?: number;
  kid?: string;
  storedAt?: string;
  lastAccessedAt?: string;
  clientCacheTtlMs?: number;
  metadata?: Record<string, string>;
};

type CachedSecretEntry = {
  secret: string;
  expiresAt: number;
  metadata?: Record<string, string>;
  version?: number;
  kid?: string;
  storedAt?: string;
  lastAccessedAt?: string;
};

type CachedSecurityKeyEntry = {
  key: SecurityEncryptionPublicKey;
  keyObject: ReturnType<typeof createPublicKey>;
};

const secretCache = new Map<string, CachedSecretEntry>();
let cachedSecurityKey: CachedSecurityKeyEntry | undefined;

function cacheKey(serviceId: string, secretName: string): string {
  const identity = getUltimateRequesterId() || getClientId() || 'anonymous';
  return `${identity}::${serviceId}::${secretName}`;
}

function parseCacheTtlMs(metadata?: Record<string, string>): number | undefined {
  const raw = metadata?.clientCacheTtlMs;
  if (!raw) {
    return undefined;
  }

  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return undefined;
  }

  return parsed;
}

function normalizeAlg(alg?: string): 'RSA-OAEP-256' | 'RSA-OAEP' {
  return alg === 'RSA-OAEP' ? 'RSA-OAEP' : 'RSA-OAEP-256';
}

function normalizeEncryptionPublicKey(raw: unknown): SecurityEncryptionPublicKey | null {
  const direct = raw as Partial<SecurityEncryptionPublicKey> | undefined;
  const wrapped = (raw as { data?: Partial<SecurityEncryptionPublicKey> } | undefined)?.data;
  const candidate = (direct?.kty ? direct : wrapped) as Partial<SecurityEncryptionPublicKey> | undefined;

  if (!candidate?.kid || !candidate?.kty || !candidate?.n || !candidate?.e) {
    return null;
  }

  return {
    kid: candidate.kid,
    kty: candidate.kty,
    alg: candidate.alg ?? 'RSA-OAEP-256',
    use: 'enc',
    n: candidate.n,
    e: candidate.e,
    key_ops: candidate.key_ops ?? ['encrypt'],
  };
}

async function getSecurityEncryptionKey(options?: ServiceRequestOptions): Promise<CachedSecurityKeyEntry> {
  if (cachedSecurityKey) {
    return cachedSecurityKey;
  }

  const response = await runServiceActivity<{}, SecurityEncryptionPublicKey>(
    'security',
    'getEncryptionPublicKey',
    '1.0.0',
    {},
    options,
  );

  if (!response.success || !response.result) {
    throw new Error(response.message || 'Failed to load security encryption public key');
  }

  const normalizedKey = normalizeEncryptionPublicKey(response.result);
  if (!normalizedKey) {
    throw new Error('Security encryption public key payload is invalid (expected kid,kty,n,e).');
  }

  const keyObject = createPublicKey({ key: normalizedKey as any, format: 'jwk' });
  cachedSecurityKey = { key: normalizedKey, keyObject };
  return cachedSecurityKey;
}

function encryptSecretForSecurity(plaintextSecret: string, key: CachedSecurityKeyEntry): { encryptedSecret: string; kid: string; alg: 'RSA-OAEP-256' | 'RSA-OAEP' } {
  const alg = normalizeAlg(key.key.alg);
  const oaepHash = alg === 'RSA-OAEP' ? 'sha1' : 'sha256';
  const encrypted = publicEncrypt(
    {
      key: key.keyObject,
      padding: constants.RSA_PKCS1_OAEP_PADDING,
      oaepHash,
    },
    Buffer.from(plaintextSecret, 'utf8'),
  );

  return {
    encryptedSecret: encrypted.toString('base64'),
    kid: key.key.kid,
    alg,
  };
}

function decryptSecretForRequester(
  encryptedSecret: string,
  requesterPrivateKey: KeyObject,
  alg: 'RSA-OAEP-256' | 'RSA-OAEP',
): string {
  const oaepHash = alg === 'RSA-OAEP' ? 'sha1' : 'sha256';
  const decrypted = privateDecrypt(
    {
      key: requesterPrivateKey,
      padding: constants.RSA_PKCS1_OAEP_PADDING,
      oaepHash,
    },
    Buffer.from(encryptedSecret, 'base64'),
  );

  return decrypted.toString('utf8');
}

function updateSecretCache(
  serviceId: string,
  secretName: string,
  secret: string,
  metadata?: Record<string, string>,
  version?: number,
  kid?: string,
  storedAt?: string,
  lastAccessedAt?: string,
  ttlMs?: number,
): void {
  if (!ttlMs || ttlMs <= 0) {
    return;
  }

  secretCache.set(cacheKey(serviceId, secretName), {
    secret,
    expiresAt: Date.now() + ttlMs,
    metadata,
    version,
    kid,
    storedAt,
    lastAccessedAt,
  });
}

export function clearServiceSecretClientCache(): void {
  secretCache.clear();
  cachedSecurityKey = undefined;
}

export async function storeSecretForServiceId(
  payload: StoreSecretForServiceIdPayload,
  options?: ServiceRequestOptions,
): Promise<StoreSecretForServiceIdResult> {
  const serviceId = payload.serviceId.trim();
  const secretName = payload.secretName.trim();
  if (!serviceId || !secretName) {
    throw new Error('serviceId and secretName are required');
  }

  const securityKey = await getSecurityEncryptionKey(options);
  const encrypted = encryptSecretForSecurity(payload.secret, securityKey);
  const metadata = {
    ...(payload.metadata ?? {}),
    ...(payload.clientCacheTtlMs ? { clientCacheTtlMs: String(payload.clientCacheTtlMs) } : {}),
  };

  const response = await runServiceActivity<StoreSecretServicePayload, StoreSecretServiceResult>(
    'security',
    'storeServiceSecret',
    '1.0.0',
    {
      serviceId,
      secretName,
      encryptedSecret: encrypted.encryptedSecret,
      kid: encrypted.kid,
      alg: encrypted.alg,
      metadata,
      upsertMode: payload.upsertMode,
    },
    options,
  );

  if (!response.success || !response.result) {
    throw new Error(response.message || `Failed to store secret ${serviceId}/${secretName}`);
  }

  updateSecretCache(
    serviceId,
    secretName,
    payload.secret,
    metadata,
    response.result.version,
    response.result.kid,
    response.result.storedAt,
    undefined,
    payload.clientCacheTtlMs,
  );

  return response;
}

export async function fetchSecretForServiceId(
  payload: FetchSecretForServiceIdPayload,
  options?: ServiceRequestOptions,
): Promise<FetchSecretForServiceIdResult> {
  const serviceId = payload.serviceId.trim();
  const secretName = payload.secretName.trim();
  if (!serviceId || !secretName) {
    throw new Error('serviceId and secretName are required');
  }

  const key = cacheKey(serviceId, secretName);
  const cached = secretCache.get(key);
  if (!payload.forceRefresh && cached && cached.expiresAt > Date.now()) {
    return {
      secret: cached.secret,
      serviceId,
      secretName,
      version: cached.version,
      kid: cached.kid,
      storedAt: cached.storedAt,
      lastAccessedAt: cached.lastAccessedAt,
      metadata: cached.metadata,
      clientCacheTtlMs: cached.expiresAt - Date.now(),
    };
  }

  const requester = generateKeyPairSync('rsa', { modulusLength: 2048 });
  const requesterPublicKey = requester.publicKey.export({ format: 'jwk' }) as JsonWebKey;

  const response = await runServiceActivity<RetrieveSecretServicePayload, RetrieveSecretServiceResult>(
    'security',
    'retrieveServiceSecret',
    '1.0.0',
    {
      serviceId,
      secretName,
      requesterServiceId: payload.requesterServiceId ?? serviceId,
      decrypt: true,
      requesterPublicKey: {
        alg: 'RSA-OAEP-256',
        jwk: requesterPublicKey,
      },
    },
    options,
  );

  if (!response.success || !response.result?.encryptedSecretForRequester) {
    throw new Error(response.message || `Failed to fetch secret ${serviceId}/${secretName}`);
  }

  const secret = decryptSecretForRequester(
    response.result.encryptedSecretForRequester,
    requester.privateKey,
    response.result.requesterEncryptionAlg ?? 'RSA-OAEP-256',
  );

  const ttlMs = parseCacheTtlMs(response.result.metadata);
  updateSecretCache(
    serviceId,
    secretName,
    secret,
    response.result.metadata,
    response.result.version,
    response.result.kid,
    response.result.storedAt,
    response.result.lastAccessedAt,
    ttlMs,
  );

  return {
    secret,
    serviceId,
    secretName,
    version: response.result.version,
    kid: response.result.kid,
    storedAt: response.result.storedAt,
    lastAccessedAt: response.result.lastAccessedAt,
    metadata: response.result.metadata,
    clientCacheTtlMs: ttlMs,
  };
}