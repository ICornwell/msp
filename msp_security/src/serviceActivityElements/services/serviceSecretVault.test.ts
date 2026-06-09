import { generateKeyPairSync, publicEncrypt, constants } from 'crypto';

import { describe, expect, it, beforeEach } from 'vitest';

import {
  clearServiceSecretVaultCachesForTests,
  decryptSecret,
} from './serviceSecretVault.js';

function encryptForTest(plaintext: string, publicKeyPem: string): string {
  const encrypted = publicEncrypt(
    {
      key: publicKeyPem,
      padding: constants.RSA_PKCS1_OAEP_PADDING,
      oaepHash: 'sha256',
    },
    Buffer.from(plaintext, 'utf8'),
  );

  return encrypted.toString('base64');
}

describe('serviceSecretVault crypto helpers', () => {
  beforeEach(() => {
    clearServiceSecretVaultCachesForTests();
    delete process.env['MSP_SECURITY_DEFAULT_PRIVATE_KEY_PEM'];
    delete process.env['MSP_SECURITY_DEFAULT_KID'];
  });

  it('decrypts RSA-OAEP-256 encrypted payload using configured default key', () => {
    const { privateKey, publicKey } = generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: { type: 'spki', format: 'pem' },
      privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
    });

    process.env['MSP_SECURITY_DEFAULT_PRIVATE_KEY_PEM'] = privateKey;
    process.env['MSP_SECURITY_DEFAULT_KID'] = 'unit-test-key';

    const plaintext = 'aws-secret-value';
    const encrypted = encryptForTest(plaintext, publicKey);

    const decrypted = decryptSecret(encrypted, 'unit-test-key', 'RSA-OAEP-256');
    expect(decrypted).toBe(plaintext);
  });
});
