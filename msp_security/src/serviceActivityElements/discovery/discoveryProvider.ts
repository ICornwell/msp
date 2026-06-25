import { getRuntimeEncryptionPublicKey } from '../services/encryptionRuntimeKeys.js';

export type EncryptionPublicKeyResponse = {
  kid: string;
  kty: string;
  alg: string;
  use: 'enc';
  n?: string;
  e?: string;
  key_ops: string[];
};

export type DiscoveryProvider = {
  getWellKnownConfig: () => Promise<DiscoveryResponse>;
  getJwksJson: () => Promise<JwksResponse>;
  getEncryptionPublicKey: () => Promise<EncryptionPublicKeyResponse | null>;
};

export type DiscoveryProviderConfig = {
  myUrl?: string;
};

export type DiscoveryResponse = {
        "issuer": string,
        "authorization_endpoint": string,
        "token_endpoint": string,
        "userinfo_endpoint": string,
        "jwks_uri": string,
        "scopes_supported": string[],
        "response_types_supported": string[],
        "token_endpoint_auth_methods_supported": string[],
        "claims_supported": string[]
};

export type JwksResponse = {
  "keys": Array<{
    "kty": string,
    "e": string,
    "n": string,
    "kid": string,
    "alg": string,
    "use": string,
    "crv"?: string,
    "x"?: string,
    "y"?: string
  }>
};

function trimTrailingSlash(value: string): string {
  return value.endsWith('/') ? value.slice(0, -1) : value;
}

function parseStringList(raw: string | undefined, fallback: string[]): string[] {
  if (!raw) {
    return fallback;
  }

  return raw
    .split(',')
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

function parseJwks(raw: string | undefined): JwksResponse {
  if (!raw) {
    return { keys: [] };
  }

  try {
    const parsed = JSON.parse(raw) as JwksResponse;
    if (!parsed || !Array.isArray(parsed.keys)) {
      return { keys: [] };
    }

    return parsed;
  } catch {
    return { keys: [] };
  }
}


export function getDiscoveryProvider(config: DiscoveryProviderConfig): DiscoveryProvider {
  const issuerBaseUrl = trimTrailingSlash(
    process.env['MSP_SECURITY_ISSUER_URL'] || config.myUrl || 'http://localhost:4005',
  );
  const jwksUri = `${issuerBaseUrl}/discovery/jwks.json`;

  const wellKnownConfig: DiscoveryResponse = {
    issuer: issuerBaseUrl,
    authorization_endpoint: `${issuerBaseUrl}/authorize`,
    token_endpoint: `${issuerBaseUrl}/token`,
    userinfo_endpoint: `${issuerBaseUrl}/userinfo`,
    jwks_uri: jwksUri,
    scopes_supported: parseStringList(process.env['MSP_SECURITY_SCOPES_SUPPORTED'], ['openid']),
    response_types_supported: parseStringList(
      process.env['MSP_SECURITY_RESPONSE_TYPES_SUPPORTED'],
      ['code'],
    ),
    token_endpoint_auth_methods_supported: parseStringList(
      process.env['MSP_SECURITY_TOKEN_AUTH_METHODS_SUPPORTED'],
      ['private_key_jwt'],
    ),
    claims_supported: parseStringList(
      process.env['MSP_SECURITY_CLAIMS_SUPPORTED'],
      ['sub', 'iss', 'aud', 'iat', 'exp'],
    ),
  };

  const jwks = parseJwks(process.env['MSP_SECURITY_JWKS_JSON']);

  const encryptionKey: EncryptionPublicKeyResponse | null = resolveEncryptionKey();

  return {
    getWellKnownConfig: async (): Promise<DiscoveryResponse> => {
      return wellKnownConfig;
    },

    getJwksJson: async (): Promise<JwksResponse> => {
      return jwks;
    },

    getEncryptionPublicKey: async (): Promise<EncryptionPublicKeyResponse | null> => {
      return encryptionKey;
    },
  };
}

function resolveEncryptionKey(): EncryptionPublicKeyResponse | null {
  const runtimeKey = getRuntimeEncryptionPublicKey();
  if (runtimeKey?.kid && runtimeKey?.kty) {
    return {
      kid: runtimeKey.kid,
      kty: runtimeKey.kty,
      alg: runtimeKey.alg ?? 'RSA-OAEP-256',
      use: 'enc',
      n: runtimeKey.n,
      e: runtimeKey.e,
      key_ops: runtimeKey.key_ops ?? ['encrypt'],
    };
  }

  const inUseSuffix = (process.env['MSP_SECURITY_IN_USE_SUFFIX'] || '1').trim() === '2' ? '2' : '1';

  const suffixedEncKeyJson = process.env[`MSP_SECURITY_ENCRYPTION_PUBLIC_KEY_JSON_${inUseSuffix}`];
  if (suffixedEncKeyJson?.trim()) {
    try {
      const parsed = JSON.parse(suffixedEncKeyJson) as Partial<EncryptionPublicKeyResponse>;
      if (parsed?.kid && parsed?.kty) {
        return {
          kid: parsed.kid,
          kty: parsed.kty,
          alg: parsed.alg ?? 'RSA-OAEP-256',
          use: 'enc',
          n: parsed.n,
          e: parsed.e,
          key_ops: parsed.key_ops ?? ['encrypt'],
        };
      }
    } catch {
      // fall through
    }
  }

  // First persisted source: check for a dedicated encryption public key in env
  const encKeyJson = process.env['MSP_SECURITY_ENCRYPTION_PUBLIC_KEY_JSON'];
  if (encKeyJson?.trim()) {
    try {
      const parsed = JSON.parse(encKeyJson) as Partial<EncryptionPublicKeyResponse>;
      if (parsed?.kid && parsed?.kty) {
        return {
          kid: parsed.kid,
          kty: parsed.kty,
          alg: parsed.alg ?? 'RSA-OAEP-256',
          use: 'enc',
          n: parsed.n,
          e: parsed.e,
          key_ops: parsed.key_ops ?? ['encrypt'],
        };
      }
    } catch {
      // fall through
    }
  }

  // Second: look in existing JWKS for the first key with use:enc
  const signingJwks = parseJwks(process.env['MSP_SECURITY_JWKS_JSON']);
  const encKey = signingJwks.keys.find((k) => k.use === 'enc');
  if (encKey) {
    return {
      kid: encKey.kid,
      kty: encKey.kty,
      alg: encKey.alg ?? 'RSA-OAEP-256',
      use: 'enc',
      n: encKey.n,
      e: encKey.e,
      key_ops: ['encrypt'],
    };
  }

  return null;
}