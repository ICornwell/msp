import { constants, createPrivateKey, createPublicKey, privateDecrypt, publicEncrypt } from 'crypto';

import type { ServiceActivityResultBuilder } from 'msp_svr_common';

import { setRuntimeEncryptionKeyPair } from './encryptionRuntimeKeys.js';
import { clearServiceSecretVaultKeyCache } from './serviceSecretVault.js';

export type ConfigureEncryptionKeyPairPayload = {
  kid?: string;
  publicKey?: {
    kid?: string;
    kty?: string;
    alg?: string;
    use?: 'enc';
    n?: string;
    e?: string;
    key_ops?: string[];
  };
  privateKeyPem?: string;
};

function toErrorMessage(error: unknown, fallback: string): string {
  if (error && typeof error === 'object' && 'message' in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === 'string' && message.trim().length > 0) {
      return message;
    }
  }
  return fallback;
}

export async function configureEncryptionKeyPairHandler(
  payload: ConfigureEncryptionKeyPairPayload,
  resultBuilder: ServiceActivityResultBuilder,
): Promise<ServiceActivityResultBuilder> {
  const kid = payload?.kid?.trim() || payload?.publicKey?.kid?.trim();
  const publicKey = payload?.publicKey;
  const privateKeyPem = payload?.privateKeyPem?.trim();

  if (!kid || !publicKey?.kty || !publicKey?.n || !publicKey?.e || !privateKeyPem) {
    return resultBuilder.failed(
      'kid, publicKey{kty,n,e} and privateKeyPem are required.',
      { code: 'INVALID_INPUT' },
    );
  }

  try {
    const normalizedPublicKey = {
      kid,
      kty: publicKey.kty,
      alg: publicKey.alg ?? 'RSA-OAEP-256',
      use: 'enc' as const,
      n: publicKey.n,
      e: publicKey.e,
      key_ops: publicKey.key_ops ?? ['encrypt'],
    };

    const publicKeyObject = createPublicKey({ key: normalizedPublicKey as any, format: 'jwk' });
    const privateKeyObject = createPrivateKey({ key: privateKeyPem, format: 'pem' });

    // Prove the pair is coherent before accepting it at runtime.
    const probe = Buffer.from('msp-security-keypair-probe', 'utf8');
    const encrypted = publicEncrypt(
      {
        key: publicKeyObject,
        padding: constants.RSA_PKCS1_OAEP_PADDING,
        oaepHash: 'sha256',
      },
      probe,
    );

    const decrypted = privateDecrypt(
      {
        key: privateKeyObject,
        padding: constants.RSA_PKCS1_OAEP_PADDING,
        oaepHash: 'sha256',
      },
      encrypted,
    );

    if (decrypted.toString('utf8') !== probe.toString('utf8')) {
      return resultBuilder.failed('Provided key pair validation failed.', {
        code: 'KEYPAIR_VALIDATION_FAILED',
      });
    }

    setRuntimeEncryptionKeyPair(normalizedPublicKey, privateKeyPem);
    clearServiceSecretVaultKeyCache();

    resultBuilder.log(`Runtime encryption key pair configured (kid=${kid}).`);
    return resultBuilder.success({
      configured: true,
      kid,
      algorithm: normalizedPublicKey.alg,
      keyType: normalizedPublicKey.kty,
      message:
        'Encryption key pair applied to msp_security runtime. Persist env config if you need it to survive restart.',
    });
  } catch (error) {
    return resultBuilder.failed(
      toErrorMessage(error, 'Failed to configure runtime encryption key pair.'),
      { code: 'CONFIGURE_ENCRYPTION_KEY_FAILED' },
    );
  }
}
