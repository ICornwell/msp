import { constants, createPrivateKey, createPublicKey, privateDecrypt, publicEncrypt } from 'crypto';

import type { ServiceRequestOptions } from 'msp_common';

import {
  clearServiceSecretClientCache,
  fetchSecretForServiceId,
  storeSecretForServiceId,
  type FetchSecretForServiceIdPayload,
  type StoreSecretForServiceIdPayload,
} from './serviceSecretClient.js';

export type VaultEncryptionMode = 'none' | 'module';

export type VaultSdkModuleEncryptionConfig = {
  enabled: boolean;
  publicKeyPem?: string;
  privateKeyPem?: string;
  algorithm?: 'RSA-OAEP-256' | 'RSA-OAEP';
};

export type VaultSdkClientConfig = {
  serviceId: string;
  requesterServiceId?: string;
  defaultCacheTtlMs?: number;
  encryption?: VaultSdkModuleEncryptionConfig;
};

export type VaultStoreSecretParams = {
  secretName: string;
  secret: string;
  metadata?: Record<string, string>;
  clientCacheTtlMs?: number;
  upsertMode?: 'replace' | 'createOnly';
  encryptionMode?: VaultEncryptionMode;
};

export type VaultFetchSecretParams = {
  secretName: string;
  forceRefresh?: boolean;
  encryptionMode?: VaultEncryptionMode;
};

type ParsedModuleEncryption = {
  enabled: boolean;
  publicKeyObject?: ReturnType<typeof createPublicKey>;
  privateKeyObject?: ReturnType<typeof createPrivateKey>;
  algorithm: 'RSA-OAEP-256' | 'RSA-OAEP';
};

function normalizeAlgorithm(algorithm?: string): 'RSA-OAEP-256' | 'RSA-OAEP' {
  return algorithm === 'RSA-OAEP' ? 'RSA-OAEP' : 'RSA-OAEP-256';
}

function getOaepHash(algorithm: 'RSA-OAEP-256' | 'RSA-OAEP'): 'sha256' | 'sha1' {
  return algorithm === 'RSA-OAEP' ? 'sha1' : 'sha256';
}

function encodeModuleEncryptedSecret(plaintext: string, config: ParsedModuleEncryption): string {
  if (!config.enabled || !config.publicKeyObject) {
    return plaintext;
  }

  const encrypted = publicEncrypt(
    {
      key: config.publicKeyObject,
      padding: constants.RSA_PKCS1_OAEP_PADDING,
      oaepHash: getOaepHash(config.algorithm),
    },
    Buffer.from(plaintext, 'utf8'),
  );

  return encrypted.toString('base64');
}

function decodeModuleEncryptedSecret(encryptedBase64: string, config: ParsedModuleEncryption): string {
  if (!config.enabled || !config.privateKeyObject) {
    return encryptedBase64;
  }

  const decrypted = privateDecrypt(
    {
      key: config.privateKeyObject,
      padding: constants.RSA_PKCS1_OAEP_PADDING,
      oaepHash: getOaepHash(config.algorithm),
    },
    Buffer.from(encryptedBase64, 'base64'),
  );

  return decrypted.toString('utf8');
}

function buildModuleEncryptionConfig(input?: VaultSdkModuleEncryptionConfig): ParsedModuleEncryption {
  const envEnabledRaw = (process.env['MSP_VAULT_MODULE_ENCRYPTION_ENABLED'] || '').trim().toLowerCase();
  const envEnabled = envEnabledRaw === 'true' || envEnabledRaw === '1' || envEnabledRaw === 'yes';
  const enabled = Boolean(input?.enabled ?? envEnabled);

  const algorithm = normalizeAlgorithm(
    input?.algorithm || process.env['MSP_VAULT_MODULE_ENCRYPTION_ALG'] || 'RSA-OAEP-256',
  );

  if (!enabled) {
    return { enabled: false, algorithm };
  }

  const publicKeyPem = input?.publicKeyPem || process.env['MSP_VAULT_MODULE_PUBLIC_KEY_PEM'];
  const privateKeyPem = input?.privateKeyPem || process.env['MSP_VAULT_MODULE_PRIVATE_KEY_PEM'];

  if (!publicKeyPem?.trim() || !privateKeyPem?.trim()) {
    throw new Error('Module-level vault encryption is enabled but public/private key PEM values are missing.');
  }

  return {
    enabled: true,
    publicKeyObject: createPublicKey(publicKeyPem),
    privateKeyObject: createPrivateKey(privateKeyPem),
    algorithm,
  };
}

function resolveEncryptionMode(
  requestedMode: VaultEncryptionMode | undefined,
  moduleConfig: ParsedModuleEncryption,
): VaultEncryptionMode {
  if (requestedMode) {
    return requestedMode;
  }
  return moduleConfig.enabled ? 'module' : 'none';
}

export function createVaultSdk(config: VaultSdkClientConfig) {
  const serviceId = config.serviceId?.trim();
  if (!serviceId) {
    throw new Error('createVaultSdk requires serviceId.');
  }

  const requesterServiceId = config.requesterServiceId?.trim() || serviceId;
  const defaultCacheTtlMs = config.defaultCacheTtlMs;
  const moduleEncryption = buildModuleEncryptionConfig(config.encryption);

  return {
    async storeSecret(
      params: VaultStoreSecretParams,
      options?: ServiceRequestOptions,
    ) {
      const secretName = params.secretName?.trim();
      if (!secretName) {
        throw new Error('storeSecret requires secretName.');
      }

      const mode = resolveEncryptionMode(params.encryptionMode, moduleEncryption);
      const secretPayload =
        mode === 'module'
          ? encodeModuleEncryptedSecret(params.secret, moduleEncryption)
          : params.secret;

      const metadata: Record<string, string> = {
        ...(params.metadata ?? {}),
      };

      if (mode === 'module') {
        metadata.moduleEncryption = 'module';
        metadata.moduleEncryptionAlg = moduleEncryption.algorithm;
      }

      const payload: StoreSecretForServiceIdPayload = {
        serviceId,
        secretName,
        secret: secretPayload,
        metadata,
        clientCacheTtlMs: params.clientCacheTtlMs ?? defaultCacheTtlMs,
        upsertMode: params.upsertMode,
      };

      return storeSecretForServiceId(payload, options);
    },

    async fetchSecret(
      params: VaultFetchSecretParams,
      options?: ServiceRequestOptions,
    ) {
      const secretName = params.secretName?.trim();
      if (!secretName) {
        throw new Error('fetchSecret requires secretName.');
      }

      const payload: FetchSecretForServiceIdPayload = {
        serviceId,
        secretName,
        requesterServiceId,
        forceRefresh: params.forceRefresh,
      };

      const result = await fetchSecretForServiceId(payload, options);
      if (!result.secret) {
        return result;
      }

      const metadata = result.metadata ?? {};
      const storedAsModuleEncrypted = metadata.moduleEncryption === 'module';
      const mode = resolveEncryptionMode(params.encryptionMode, moduleEncryption);

      if (storedAsModuleEncrypted || mode === 'module') {
        return {
          ...result,
          secret: decodeModuleEncryptedSecret(result.secret, moduleEncryption),
        };
      }

      return result;
    },

    clearCache() {
      clearServiceSecretClientCache();
    },
  };
}
