type EncryptionPublicKey = {
  kid: string;
  kty: string;
  alg?: string;
  use?: 'enc';
  n?: string;
  e?: string;
  key_ops?: string[];
};

type RuntimePrivateKey = {
  kid: string;
  privateKeyPem: string;
};

let runtimeEncryptionPublicKey: EncryptionPublicKey | undefined;
let runtimePrivateKeys: RuntimePrivateKey[] = [];

export function setRuntimeEncryptionKeyPair(
  publicKey: EncryptionPublicKey,
  privateKeyPem: string,
): void {
  runtimeEncryptionPublicKey = {
    ...publicKey,
    alg: publicKey.alg ?? 'RSA-OAEP-256',
    use: 'enc',
    key_ops: publicKey.key_ops ?? ['encrypt'],
  };

  runtimePrivateKeys = [
    {
      kid: publicKey.kid,
      privateKeyPem,
    },
  ];
}

export function getRuntimeEncryptionPublicKey(): EncryptionPublicKey | undefined {
  return runtimeEncryptionPublicKey;
}

export function getRuntimePrivateKeys(): RuntimePrivateKey[] {
  return runtimePrivateKeys;
}

export function clearRuntimeEncryptionKeysForTests(): void {
  runtimeEncryptionPublicKey = undefined;
  runtimePrivateKeys = [];
}
