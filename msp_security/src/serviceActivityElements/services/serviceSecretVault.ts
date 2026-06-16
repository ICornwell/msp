import { createHash } from 'crypto';
import { createPublicKey } from 'crypto';
import { privateDecrypt } from 'crypto';
import { publicEncrypt } from 'crypto';
import { constants } from 'crypto';

import { getAllUserIdAssertionClaims, getUltimateRequesterId } from 'msp_svr_common';
import type { ServiceActivityResultBuilder } from 'msp_svr_common';

export type StoreServiceSecretPayload = {
  serviceId: string;
  secretName: string;
  encryptedSecret: string;
  kid: string;
  alg?: 'RSA-OAEP-256' | 'RSA-OAEP';
  metadata?: Record<string, string>;
  upsertMode?: 'replace' | 'createOnly';
};

export type RetrieveServiceSecretPayload = {
  serviceId: string;
  secretName: string;
  requesterServiceId?: string;
  decrypt?: boolean;
  requesterPublicKey?: {
    kid?: string;
    alg?: 'RSA-OAEP-256' | 'RSA-OAEP';
    pem?: string;
    jwk?: {
      kty: string;
      kid?: string;
      n?: string;
      e?: string;
      alg?: string;
      use?: string;
    };
  };
};

type StoredServiceSecretRecord = {
  serviceId: string;
  secretName: string;
  encryptedSecret: string;
  kid: string;
  alg: 'RSA-OAEP-256' | 'RSA-OAEP';
  metadata: Record<string, string>;
  version: number;
  storedAt: string;
  lastAccessedAt?: string;
  checksumSha256: string;
  ownerSubjectId: string;
  ownerTenantId?: string;
  ownerIssuer?: string;
};

type KeyRecord = {
  kid: string;
  privateKeyPem: string;
};

const serviceSecretStore = new Map<string, StoredServiceSecretRecord>();
let cachedPrivateKeys: KeyRecord[] | undefined;

function nowIso() {
  return new Date().toISOString();
}

function storeKey(serviceId: string, secretName: string) {
  return `${serviceId}::${secretName}`;
}

function normalizeAlg(alg?: string): 'RSA-OAEP-256' | 'RSA-OAEP' {
  return alg === 'RSA-OAEP' ? 'RSA-OAEP' : 'RSA-OAEP-256';
}

function hashSecret(secretValue: string): string {
  return createHash('sha256').update(secretValue).digest('hex');
}

function getPrivateKeys(): KeyRecord[] {
  if (cachedPrivateKeys) {
    return cachedPrivateKeys;
  }

  const records: KeyRecord[] = [];
  const defaultKid = (process.env['MSP_SECURITY_DEFAULT_KID'] || 'security-default-key').trim();
  const defaultPrivateKey = process.env['MSP_SECURITY_DEFAULT_PRIVATE_KEY_PEM'];

  if (defaultPrivateKey?.trim()) {
    records.push({
      kid: defaultKid,
      privateKeyPem: defaultPrivateKey,
    });
  }

  const privateKeysJson = process.env['MSP_SECURITY_PRIVATE_KEYS_JSON'];
  if (privateKeysJson?.trim()) {
    try {
      const parsed = JSON.parse(privateKeysJson) as Array<{
        kid?: string;
        privateKeyPem?: string;
      }>;

      for (const item of parsed) {
        if (!item?.kid || !item?.privateKeyPem) {
          continue;
        }
        records.push({
          kid: item.kid,
          privateKeyPem: item.privateKeyPem,
        });
      }
    } catch {
      // ignore malformed env and keep discovered keys only
    }
  }

  cachedPrivateKeys = records;
  return records;
}

export function clearServiceSecretVaultCachesForTests(): void {
  cachedPrivateKeys = undefined;
  serviceSecretStore.clear();
}

type VerifiedIdentity = {
  subjectId: string;
  tenantId?: string;
  issuer?: string;
};

function getVerifiedIdentity(): VerifiedIdentity {
  const claims = getAllUserIdAssertionClaims();
  const subjectId = getUltimateRequesterId();

  // auth middleware sets this for explicit guest-mode bypass only. We reject here.
  if (!claims || !subjectId || subjectId === 'guest') {
    throw new Error('A verified trusted ID token is required');
  }

  return {
    subjectId,
    tenantId: typeof claims.tid === 'string' ? claims.tid : undefined,
    issuer: typeof claims.iss === 'string' ? claims.iss : undefined,
  };
}

function resolvePrivateKeyByKid(kid: string): string {
  const keys = getPrivateKeys();
  const found = keys.find((entry) => entry.kid === kid);
  if (!found) {
    throw new Error(`No private key available for kid ${kid}`);
  }

  return found.privateKeyPem;
}

export function decryptSecret(encryptedBase64: string, kid: string, alg: 'RSA-OAEP-256' | 'RSA-OAEP'): string {
  const privateKeyPem = resolvePrivateKeyByKid(kid);
  const encryptedBuffer = Buffer.from(encryptedBase64, 'base64');

  const oaepHash = alg === 'RSA-OAEP' ? 'sha1' : 'sha256';
  const decrypted = privateDecrypt(
    {
      key: privateKeyPem,
      padding: constants.RSA_PKCS1_OAEP_PADDING,
      oaepHash,
    },
    encryptedBuffer,
  );

  return decrypted.toString('utf8');
}

function encryptForRequester(
  plaintext: string,
  requesterPublicKey: NonNullable<RetrieveServiceSecretPayload['requesterPublicKey']>,
): { encryptedSecret: string; alg: 'RSA-OAEP-256' | 'RSA-OAEP'; requesterKid?: string } {
  const alg = requesterPublicKey.alg === 'RSA-OAEP' ? 'RSA-OAEP' : 'RSA-OAEP-256';
  const oaepHash = alg === 'RSA-OAEP' ? 'sha1' : 'sha256';

  const keyObject = requesterPublicKey.pem
    ? createPublicKey(requesterPublicKey.pem)
    : requesterPublicKey.jwk
      ? createPublicKey({ key: requesterPublicKey.jwk as any, format: 'jwk' })
      : undefined;

  if (!keyObject) {
    throw new Error('requesterPublicKey.pem or requesterPublicKey.jwk is required');
  }

  const encrypted = publicEncrypt(
    {
      key: keyObject,
      padding: constants.RSA_PKCS1_OAEP_PADDING,
      oaepHash,
    },
    Buffer.from(plaintext, 'utf8'),
  );

  return {
    encryptedSecret: encrypted.toString('base64'),
    alg,
    requesterKid: requesterPublicKey.kid ?? requesterPublicKey.jwk?.kid,
  };
}

export async function storeServiceSecretHandler(
  payload: StoreServiceSecretPayload,
  resultBuilder: ServiceActivityResultBuilder,
): Promise<ServiceActivityResultBuilder> {
  let identity: VerifiedIdentity;
  try {
    identity = getVerifiedIdentity();
  } catch (error: any) {
    return resultBuilder.failed(error?.message || 'Unauthorized', {
      code: 'UNAUTHORIZED',
    });
  }

  const serviceId = payload?.serviceId?.trim();
  const secretName = payload?.secretName?.trim();
  const encryptedSecret = payload?.encryptedSecret?.trim();
  const kid = payload?.kid?.trim();

  if (!serviceId || !secretName || !encryptedSecret || !kid) {
    return resultBuilder.failed('serviceId, secretName, encryptedSecret and kid are required', {
      code: 'INVALID_INPUT',
    });
  }

  const key = storeKey(serviceId, secretName);
  const existing = serviceSecretStore.get(key);
  if (payload?.upsertMode === 'createOnly' && existing) {
    return resultBuilder.failed(`Secret already exists for ${serviceId}/${secretName}`, {
      code: 'CONFLICT',
    });
  }

  const version = (existing?.version ?? 0) + 1;
  const alg = normalizeAlg(payload.alg);

  const record: StoredServiceSecretRecord = {
    serviceId,
    secretName,
    encryptedSecret,
    kid,
    alg,
    metadata: payload.metadata ?? {},
    version,
    storedAt: nowIso(),
    checksumSha256: hashSecret(encryptedSecret),
    lastAccessedAt: existing?.lastAccessedAt,
    ownerSubjectId: identity.subjectId,
    ownerTenantId: identity.tenantId,
    ownerIssuer: identity.issuer,
  };

  serviceSecretStore.set(key, record);

  resultBuilder.log(`Stored secret for serviceId=${serviceId} secretName=${secretName} v=${version} kid=${kid}`);
  return resultBuilder.success({
    data: {
      secretRef: `security-secret://${serviceId}/${secretName}`,
      serviceId,
      secretName,
      version,
      kid,
      storedAt: record.storedAt,
    },
  });
}

export async function retrieveServiceSecretHandler(
  payload: RetrieveServiceSecretPayload,
  resultBuilder: ServiceActivityResultBuilder,
): Promise<ServiceActivityResultBuilder> {
  let identity: VerifiedIdentity;
  try {
    identity = getVerifiedIdentity();
  } catch (error: any) {
    return resultBuilder.failed(error?.message || 'Unauthorized', {
      code: 'UNAUTHORIZED',
    });
  }

  const serviceId = payload?.serviceId?.trim();
  const secretName = payload?.secretName?.trim();

  if (!serviceId || !secretName) {
    return resultBuilder.failed('serviceId and secretName are required', {
      code: 'INVALID_INPUT',
    });
  }

  const requesterServiceId = payload?.requesterServiceId?.trim();
  if (requesterServiceId && requesterServiceId !== serviceId) {
    return resultBuilder.failed('requesterServiceId is not authorized for this secret', {
      code: 'ACCESS_DENIED',
      details: {
        requesterServiceId,
        serviceId,
      },
    });
  }

  const key = storeKey(serviceId, secretName);
  const existing = serviceSecretStore.get(key);

  if (!existing) {
    return resultBuilder.failed(`Secret not found for ${serviceId}/${secretName}`, {
      code: 'NOT_FOUND',
    });
  }

  if (existing.ownerSubjectId !== identity.subjectId) {
    return resultBuilder.failed('Token subject is not allowed to access this secret', {
      code: 'ACCESS_DENIED',
      details: {
        ownerSubjectId: existing.ownerSubjectId,
        requesterSubjectId: identity.subjectId,
      },
    });
  }

  existing.lastAccessedAt = nowIso();
  serviceSecretStore.set(key, existing);

  const shouldDecrypt = payload?.decrypt !== false;
  if (!shouldDecrypt) {
    return resultBuilder.success({
      data: {
        serviceId,
        secretName,
        kid: existing.kid,
        alg: existing.alg,
        encryptedSecret: existing.encryptedSecret,
        version: existing.version,
        metadata: existing.metadata,
        storedAt: existing.storedAt,
        lastAccessedAt: existing.lastAccessedAt,
      },
    });
  }

  try {
    const secret = decryptSecret(existing.encryptedSecret, existing.kid, existing.alg);
    const requesterPublicKey = payload?.requesterPublicKey;
    if (!requesterPublicKey) {
      return resultBuilder.failed('requesterPublicKey is required when decrypt=true', {
        code: 'INVALID_INPUT',
      });
    }

    const wrapped = encryptForRequester(secret, requesterPublicKey);
    resultBuilder.log(`Retrieved and wrapped secret for serviceId=${serviceId} secretName=${secretName}`);
    return resultBuilder.success({
      data: {
        serviceId,
        secretName,
        encryptedSecretForRequester: wrapped.encryptedSecret,
        requesterEncryptionAlg: wrapped.alg,
        requesterKid: wrapped.requesterKid,
        kid: existing.kid,
        alg: existing.alg,
        version: existing.version,
        metadata: existing.metadata,
        storedAt: existing.storedAt,
        lastAccessedAt: existing.lastAccessedAt,
      },
    });
  } catch (error: any) {
    return resultBuilder.failed(`Failed to decrypt secret for ${serviceId}/${secretName}`, {
      code: 'DECRYPTION_FAILED',
      message: error?.message,
    });
  }
}
