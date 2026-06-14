import { ConfidentialClientApplication } from '@azure/msal-node';
import { getConfig } from '../configuredCommon.js';

const defaultExpiryMs = 5 * 60 * 1000; // 5 minutes
type CachedToken = { access: string; id?: string; expiresAt: number };
let cachedToken: CachedToken | null = null;

function getMsalConfig() {
  const config = getConfig();
  return {
    id: {
      auth: {
        clientId: config.clientCredentials?.clientId!,
        authority: config.clientCredentials?.authority!,
        clientSecret: config.clientCredentials?.clientSecret!,
      }
    },
    request: {
      scopes: [config.clientCredentials?.scope ?? 'no scope specified'], // e.g. 'https://graph.microsoft.com/.default'
    }
  }
}


export async function getTokenForService(includeId: boolean = false): Promise<{ access: string; id?: string }> {
  // Check cache first
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60000) { // 60s buffer
    if (!includeId || cachedToken.id) {
      return {
        access: cachedToken.access,
        id: cachedToken.id,
      };
    }

    cachedToken = null;
  }
  const config = getMsalConfig();
  const cca = new ConfidentialClientApplication(config.id);
  const token = await cca.acquireTokenByClientCredential(config.request);
  if (token) {
    const expiresInMs = token.expiresOn?.getTime() ?? defaultExpiryMs;
    cachedToken = {
      access: token.accessToken,
      id: includeId ? token.idToken : undefined,
      expiresAt: Date.now() + expiresInMs,
    };
    return {
      access: cachedToken.access,
      id: cachedToken.id,
    };
  }
  return { access: 'no token' };
}

export function clearTokenCahe() {
  cachedToken = null;
}