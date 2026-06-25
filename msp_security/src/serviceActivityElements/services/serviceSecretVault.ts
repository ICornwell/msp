import { createHash } from 'crypto';
import { createPublicKey } from 'crypto';
import { privateDecrypt } from 'crypto';
import { publicEncrypt } from 'crypto';
import { constants } from 'crypto';

import { getAllUserIdAssertionClaims, getUltimateRequesterId } from 'msp_svr_common';
import type { ServiceActivityResultBuilder } from 'msp_svr_common';
import type { DataObject } from 'msp_common';

import { getRuntimePrivateKeys } from './encryptionRuntimeKeys.js';
import { readSecurityData, writeSecurityData } from './securityDataAccess.js';
import {
  SERVICE_SECRET_VAULT_INDEX_ID,
  serviceSecretVaultIndexView,
  serviceSecretVaultView,
  type ServiceSecretVaultData,
  type ServiceSecretVaultIndexData,
} from './serviceSecretVaultDataModel.js';

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
  __entityId?: string;
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

type KeySuffix = '1' | '2';

type StoredServiceSecretVaultIndexRecord = {
  __entityId?: string;
  indexId: string;
  keys: string[];
  updatedAt: string;
};

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

function getInUseSuffix(): KeySuffix {
  const configured = (process.env['MSP_SECURITY_IN_USE_SUFFIX'] || '1').trim();
  return configured === '2' ? '2' : '1';
}

function mergeUniqueKeyRecords(records: KeyRecord[]): KeyRecord[] {
  const byKid = new Map<string, KeyRecord>();
  for (const record of records) {
    if (!byKid.has(record.kid)) {
      byKid.set(record.kid, record);
    }
  }
  return Array.from(byKid.values());
}

function getKeyRecordsForSuffix(suffix: KeySuffix): KeyRecord[] {
  const records: KeyRecord[] = [];

  const defaultKid = (process.env[`MSP_SECURITY_DEFAULT_KID_${suffix}`] || `security-default-key-${suffix}`).trim();
  const defaultPrivateKey = process.env[`MSP_SECURITY_DEFAULT_PRIVATE_KEY_PEM_${suffix}`];

  if (defaultPrivateKey?.trim()) {
    records.push({
      kid: defaultKid,
      privateKeyPem: defaultPrivateKey,
    });
  }

  const privateKeysJson = process.env[`MSP_SECURITY_PRIVATE_KEYS_JSON_${suffix}`];
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

  return mergeUniqueKeyRecords(records);
}

function getLegacyUnsuffixedKeyRecords(): KeyRecord[] {
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

  return mergeUniqueKeyRecords(records);
}

function getPrivateKeys(): KeyRecord[] {
  if (cachedPrivateKeys) {
    return cachedPrivateKeys;
  }

  const records: KeyRecord[] = [];

  const runtimeKeys = getRuntimePrivateKeys();
  for (const key of runtimeKeys) {
    if (key.kid?.trim() && key.privateKeyPem?.trim()) {
      records.push({
        kid: key.kid,
        privateKeyPem: key.privateKeyPem,
      });
    }
  }

  const inUseSuffix = getInUseSuffix();
  const inactiveSuffix: KeySuffix = inUseSuffix === '1' ? '2' : '1';
  records.push(...getKeyRecordsForSuffix(inUseSuffix));
  records.push(...getKeyRecordsForSuffix(inactiveSuffix));
  records.push(...getLegacyUnsuffixedKeyRecords());

  cachedPrivateKeys = mergeUniqueKeyRecords(records);
  return cachedPrivateKeys;
}

export function clearServiceSecretVaultKeyCache(): void {
  cachedPrivateKeys = undefined;
}

export function clearServiceSecretVaultCachesForTests(): void {
  clearServiceSecretVaultKeyCache();
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

const PROHIBITED_SECURITY_KEY_SECRET_NAMES = new Set([
  'MSP_SECURITY_DEFAULT_PRIVATE_KEY_PEM_1',
  'MSP_SECURITY_PRIVATE_KEYS_JSON_1',
  'MSP_SECURITY_DEFAULT_KID_1',
  'MSP_SECURITY_ENCRYPTION_PRIVATE_KEY_PEM_1',
  'MSP_SECURITY_DEFAULT_PRIVATE_KEY_PEM_2',
  'MSP_SECURITY_PRIVATE_KEYS_JSON_2',
  'MSP_SECURITY_DEFAULT_KID_2',
  'MSP_SECURITY_ENCRYPTION_PRIVATE_KEY_PEM_2',
  'MSP_SECURITY_IN_USE_SUFFIX',
  'MSP_SECURITY_DEFAULT_PRIVATE_KEY_PEM',
  'MSP_SECURITY_PRIVATE_KEYS_JSON',
  'MSP_SECURITY_DEFAULT_KID',
  'MSP_SECURITY_ENCRYPTION_PRIVATE_KEY_PEM',
]);

function isSecurityEncryptionKeyMaterial(serviceId: string, secretName: string): boolean {
  if (PROHIBITED_SECURITY_KEY_SECRET_NAMES.has(secretName)) {
    return true;
  }

  if (serviceId === 'msp_security' && secretName.toUpperCase().includes('PRIVATE_KEY')) {
    return true;
  }

  return false;
}

function toStoredIndexRecord(data: ServiceSecretVaultIndexData & Partial<DataObject>): StoredServiceSecretVaultIndexRecord {
  return {
    __entityId: data.__entityId,
    indexId: data.indexId,
    keys: Array.isArray(data.keys) ? data.keys : [],
    updatedAt: data.updatedAt,
  };
}

function toVaultIndexData(record: StoredServiceSecretVaultIndexRecord): ServiceSecretVaultIndexData & Partial<DataObject> {
  return {
    __entityId: record.__entityId,
    indexId: record.indexId,
    keys: record.keys,
    updatedAt: record.updatedAt,
  };
}

function toStoredRecord(data: ServiceSecretVaultData & Partial<DataObject>): StoredServiceSecretRecord {
  return {
    __entityId: data.__entityId,
    serviceId: data.serviceId,
    secretName: data.secretName,
    encryptedSecret: data.encryptedSecret,
    kid: data.kid,
    alg: data.alg,
    metadata: data.metadata ?? {},
    version: data.version,
    storedAt: data.storedAt,
    lastAccessedAt: data.lastAccessedAt,
    checksumSha256: data.checksumSha256,
    ownerSubjectId: data.ownerSubjectId,
    ownerTenantId: data.ownerTenantId,
    ownerIssuer: data.ownerIssuer,
  };
}

function toVaultData(record: StoredServiceSecretRecord): ServiceSecretVaultData & Partial<DataObject> {
  return {
    __entityId: record.__entityId,
    vaultKey: storeKey(record.serviceId, record.secretName),
    serviceId: record.serviceId,
    secretName: record.secretName,
    encryptedSecret: record.encryptedSecret,
    kid: record.kid,
    alg: record.alg,
    metadata: record.metadata,
    version: record.version,
    storedAt: record.storedAt,
    lastAccessedAt: record.lastAccessedAt,
    checksumSha256: record.checksumSha256,
    ownerSubjectId: record.ownerSubjectId,
    ownerTenantId: record.ownerTenantId,
    ownerIssuer: record.ownerIssuer,
  };
}

async function loadStoredSecretRecord(serviceId: string, secretName: string): Promise<StoredServiceSecretRecord | undefined> {
  const key = storeKey(serviceId, secretName);

  try {
    const raw = await readSecurityData(serviceSecretVaultView, key) as any;
    if (!raw || raw.success === false) {
      return undefined;
    }

    const candidate = raw.content ?? raw;
    if (!candidate || typeof candidate !== 'object') {
      return undefined;
    }

    if (candidate.serviceId !== serviceId || candidate.secretName !== secretName) {
      return undefined;
    }

    return toStoredRecord(candidate as ServiceSecretVaultData & Partial<DataObject>);
  } catch {
    return undefined;
  }
}

async function loadStoredSecretRecordByVaultKey(vaultKey: string): Promise<StoredServiceSecretRecord | undefined> {
  const [serviceId, secretName] = vaultKey.split('::');
  if (!serviceId || !secretName) {
    return undefined;
  }

  return loadStoredSecretRecord(serviceId, secretName);
}

async function loadVaultIndexRecord(): Promise<StoredServiceSecretVaultIndexRecord> {
  try {
    const raw = await readSecurityData(serviceSecretVaultIndexView, SERVICE_SECRET_VAULT_INDEX_ID) as any;
    const candidate = raw?.content ?? raw;
    if (candidate && typeof candidate === 'object' && candidate.indexId === SERVICE_SECRET_VAULT_INDEX_ID) {
      return toStoredIndexRecord(candidate as ServiceSecretVaultIndexData & Partial<DataObject>);
    }
  } catch {
    // if no index exists we create one in-memory and persist when needed
  }

  return {
    indexId: SERVICE_SECRET_VAULT_INDEX_ID,
    keys: [],
    updatedAt: nowIso(),
  };
}

async function persistVaultIndexRecord(record: StoredServiceSecretVaultIndexRecord): Promise<void> {
  record.updatedAt = nowIso();
  const result = await writeSecurityData(serviceSecretVaultIndexView, toVaultIndexData(record)) as any;
  const entityId = result?.entityId;
  if (entityId && !record.__entityId) {
    record.__entityId = entityId;
  }
}

async function addVaultKeyToIndex(vaultKey: string): Promise<void> {
  const index = await loadVaultIndexRecord();
  if (!index.keys.includes(vaultKey)) {
    index.keys = [...index.keys, vaultKey];
    await persistVaultIndexRecord(index);
  }
}

async function persistStoredSecretRecord(record: StoredServiceSecretRecord): Promise<void> {
  const payload = toVaultData(record);
  const result = await writeSecurityData(serviceSecretVaultView, payload) as any;
  const entityId = result?.entityId;

  if (entityId && !record.__entityId) {
    record.__entityId = entityId;
  }
}

function encryptWithPrivateKeyPair(
  plaintext: string,
  target: KeyRecord,
  alg: 'RSA-OAEP-256' | 'RSA-OAEP',
): string {
  const oaepHash = alg === 'RSA-OAEP' ? 'sha1' : 'sha256';
  const publicKeyObject = createPublicKey(target.privateKeyPem);
  const encrypted = publicEncrypt(
    {
      key: publicKeyObject,
      padding: constants.RSA_PKCS1_OAEP_PADDING,
      oaepHash,
    },
    Buffer.from(plaintext, 'utf8'),
  );

  return encrypted.toString('base64');
}

export type RotateServiceSecretVaultKeysPayload = {
  fromSuffix?: KeySuffix;
  toSuffix?: KeySuffix;
  dryRun?: boolean;
  maxItems?: number;
};

export async function rotateServiceSecretVaultKeysHandler(
  payload: RotateServiceSecretVaultKeysPayload,
  resultBuilder: ServiceActivityResultBuilder,
): Promise<ServiceActivityResultBuilder> {
  try {
    getVerifiedIdentity();
  } catch (error: any) {
    return resultBuilder.failed(error?.message || 'Unauthorized', {
      code: 'UNAUTHORIZED',
    });
  }

  const inUseSuffix = getInUseSuffix();
  const toSuffix = payload?.toSuffix ?? inUseSuffix;
  const fromSuffix = payload?.fromSuffix ?? (toSuffix === '1' ? '2' : '1');

  if (fromSuffix === toSuffix) {
    return resultBuilder.failed('fromSuffix and toSuffix must be different', {
      code: 'INVALID_INPUT',
    });
  }

  const sourceKeys = getKeyRecordsForSuffix(fromSuffix);
  const targetKeys = getKeyRecordsForSuffix(toSuffix);
  const targetPrimary = targetKeys[0];

  if (sourceKeys.length === 0 || !targetPrimary) {
    return resultBuilder.failed('Both source and target key suffixes must have configured keys', {
      code: 'INVALID_INPUT',
      details: {
        fromSuffix,
        toSuffix,
      },
    });
  }

  const sourceKids = new Set(sourceKeys.map(k => k.kid));
  const index = await loadVaultIndexRecord();
  const maxItems = payload?.maxItems && payload.maxItems > 0 ? payload.maxItems : index.keys.length;

  let visited = 0;
  let rotated = 0;
  let skipped = 0;
  let failed = 0;
  const failures: Array<{ key: string; reason: string }> = [];

  for (const vaultKey of index.keys.slice(0, maxItems)) {
    visited += 1;
    const record = await loadStoredSecretRecordByVaultKey(vaultKey);
    if (!record) {
      skipped += 1;
      continue;
    }

    if (!sourceKids.has(record.kid)) {
      skipped += 1;
      continue;
    }

    try {
      const plain = decryptSecret(record.encryptedSecret, record.kid, record.alg);
      const rotatedAlg: 'RSA-OAEP-256' | 'RSA-OAEP' = 'RSA-OAEP-256';
      const encryptedSecret = encryptWithPrivateKeyPair(plain, targetPrimary, rotatedAlg);

      if (!payload?.dryRun) {
        record.encryptedSecret = encryptedSecret;
        record.kid = targetPrimary.kid;
        record.alg = rotatedAlg;
        record.version += 1;
        record.storedAt = nowIso();
        record.checksumSha256 = hashSecret(encryptedSecret);
        await persistStoredSecretRecord(record);
      }

      rotated += 1;
    } catch (error: any) {
      failed += 1;
      failures.push({
        key: vaultKey,
        reason: error?.message || 'Rotation failed',
      });
    }
  }

  resultBuilder.log(
    `Vault key rotation completed from suffix ${fromSuffix} to ${toSuffix}. rotated=${rotated}, skipped=${skipped}, failed=${failed}, dryRun=${payload?.dryRun === true}`,
  );

  return resultBuilder.success({
    data: {
      fromSuffix,
      toSuffix,
      inUseSuffix,
      dryRun: payload?.dryRun === true,
      visited,
      rotated,
      skipped,
      failed,
      failures,
      targetKid: targetPrimary.kid,
    },
  });
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

  if (isSecurityEncryptionKeyMaterial(serviceId, secretName)) {
    return resultBuilder.failed('Security encryption key material must remain in environment/runtime config and cannot be stored in DB', {
      code: 'INVALID_INPUT',
    });
  }

  const existing = await loadStoredSecretRecord(serviceId, secretName);
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

  await persistStoredSecretRecord(record);
  await addVaultKeyToIndex(storeKey(serviceId, secretName));

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

  const existing = await loadStoredSecretRecord(serviceId, secretName);

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
  await persistStoredSecretRecord(existing);

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
