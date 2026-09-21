import { afterEach, describe, expect, it, vi } from 'vitest';
import { setConfig } from '../configuredCommon.js';
import { clearTokenCahe, getTokenForService } from './generic_auth.js';

const originalServiceIdp = process.env.MSP_Service_IdP;

afterEach(() => {
  clearTokenCahe();
  vi.restoreAllMocks();
  if (originalServiceIdp === undefined) {
    delete process.env.MSP_Service_IdP;
  } else {
    process.env.MSP_Service_IdP = originalServiceIdp;
  }
});

describe('generic service token provider', () => {
  it('uses MSP_Service_IdP when configured', async () => {
    process.env.MSP_Service_IdP = 'http://localhost:4004/testing';
    setConfig({
      clientCredentials: {
        clientId: 'msp_pamela',
        clientSecret: 'unused-in-testing',
        scope: 'msp_datahub/.default',
        authority: 'https://login.microsoftonline.com/tenant',
      },
    });
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({
      access_token: 'testing-token',
      token_type: 'Bearer',
      expires_in: 300,
    }), { status: 200 }));

    const token = await getTokenForService();

    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:4004/testing/token',
      expect.objectContaining({ method: 'POST' }),
    );
    expect(token).toEqual({ access: 'testing-token', id: undefined });
  });

  it('uses the Entra endpoint when MSP_Service_IdP is not configured', async () => {
    delete process.env.MSP_Service_IdP;
    setConfig({
      clientCredentials: {
        clientId: 'entra-client',
        clientSecret: 'entra-secret',
        scope: 'api://service/.default',
        authority: 'https://login.microsoftonline.com/tenant',
      },
    });
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({
      access_token: 'entra-token',
      token_type: 'Bearer',
      expires_in: 300,
    }), { status: 200 }));

    await getTokenForService();

    expect(fetchMock).toHaveBeenCalledWith(
      'https://login.microsoftonline.com/tenant/oauth2/v2.0/token',
      expect.objectContaining({ method: 'POST' }),
    );
  });
});
