import { ConfidentialClientApplication } from '@azure/msal-node';
import { getConfig } from '../configuredCommon.js';

const defaultExpiryMs = 5 * 60 * 1000; // 5 minutes
let cachedToken: { token: string; expiresAt: number } | null = null;

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
      scopes: [config.clientCredentials?.scope + '.default'], // e.g. 'https://graph.microsoft.com/.default'
    }
  }
}


export async function getTokenForService() {
  // Check cache first
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60000) { // 60s buffer
    return cachedToken.token;
  }
  const config = getMsalConfig();
  const cca = new ConfidentialClientApplication(config.id);
  const token = await cca.acquireTokenByClientCredential(config.request);
  if (token) {
    const expiresInMs = token.expiresOn?.getTime() ?? defaultExpiryMs;
    cachedToken = {
      token: token.accessToken,
      expiresAt: Date.now() + expiresInMs,
    };
    return cachedToken.token;
  }
  return null;
}

export function clearTokenCahe() {
  cachedToken = null;
}