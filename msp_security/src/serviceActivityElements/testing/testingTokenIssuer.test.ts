import { generateKeyPairSync } from 'node:crypto';
import { exportJWK, importSPKI, jwtVerify } from 'jose';
import { afterEach, describe, expect, it } from 'vitest';
import {
  getTestingIssuerConfig,
  getTestingJwks,
  issueTestingToken,
} from './testingTokenIssuer.js';

const originalEnvironment = { ...process.env };

afterEach(() => {
  for (const key of Object.keys(process.env)) {
    if (!(key in originalEnvironment)) delete process.env[key];
  }
  for (const [key, value] of Object.entries(originalEnvironment)) {
    process.env[key] = value;
  }
});

function configureTestKey() {
  const { privateKey, publicKey } = generateKeyPairSync('rsa', {
    modulusLength: 2048,
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
    publicKeyEncoding: { type: 'spki', format: 'pem' },
  });

  process.env.MSP_SECURITY_TESTING_ISSUER_ENABLED = 'true';
  process.env.MSP_SECURITY_DEFAULT_KID_1 = 'test-kid';
  process.env.MSP_SECURITY_DEFAULT_PRIVATE_KEY_PEM_1 = privateKey;
  return { publicKey };
}

describe('MSP_Security_Testing issuer', () => {
  it('issues an ordinary RS256 service access token with requested claims', async () => {
    const { publicKey } = configureTestKey();
    const config = getTestingIssuerConfig('http://localhost:4004');
    const token = await issueTestingToken(config, {
      subject: 'msp_pamela',
      audience: ['msp_datahub'],
      scope: ['data.write', 'pamela.assertions.write'],
      tenantId: 'test-tenant',
      roles: ['writer'],
      claims: { preferred_username: 'msp_pamela@test' },
    });
    const publicKeyObject = await importSPKI(publicKey, 'RS256');
    const verified = await jwtVerify(token.access_token, publicKeyObject, {
      issuer: config.issuer,
      audience: 'msp_datahub',
    });

    expect(token.token_type).toBe('Bearer');
    expect(verified.protectedHeader).toMatchObject({ alg: 'RS256', kid: 'test-kid' });
    expect(verified.payload).toMatchObject({
      iss: config.issuer,
      sub: 'msp_pamela',
      aud: ['msp_datahub'],
      scope: 'data.write pamela.assertions.write',
      token_use: 'service',
      issuer_name: 'MSP_Security_Testing',
      tenant_id: 'test-tenant',
      roles: ['writer'],
      preferred_username: 'msp_pamela@test',
    });
  });

  it('publishes the active signing key as verification JWKS', async () => {
    const { publicKey } = configureTestKey();
    const config = getTestingIssuerConfig('http://localhost:4004');
    const jwks = getTestingJwks(config);
    const expected = await exportJWK(await importSPKI(publicKey, 'RS256'));

    expect(jwks.keys[0]).toMatchObject({
      kid: 'test-kid',
      kty: 'RSA',
      alg: 'RS256',
      use: 'sig',
      n: expected.n,
      e: expected.e,
    });
  });

  it('rejects attempts to override reserved JWT claims', async () => {
    configureTestKey();
    const config = getTestingIssuerConfig('http://localhost:4004');

    await expect(issueTestingToken(config, {
      subject: 'msp_pamela',
      audience: 'msp_datahub',
      scope: 'data.write',
      claims: { iss: ' forged issuer ' },
    })).rejects.toThrow('reserved JWT claim');
  });
});