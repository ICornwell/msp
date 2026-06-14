import { getConfig } from "../configuredCommon.js";

interface TokenResponse {
  access_token: string;
  id_token?: string;
  token_type: string;
  expires_in: number;
  ext_expires_in?: number;
}

// Token cache: key = scope, value = { access, id?, expiresAt }
const tokenCache = new Map<string, { access: string; id?: string; expiresAt: number }>();

/**
 * Acquire an access token using client credentials flow
 */
export async function getTokenForService(includeId: boolean = false): Promise<{ access: string; id?: string }> {
  const config = getConfig().clientCredentials!;
  // Check cache first
  const cached = tokenCache.get(config.scope);
  if (cached && cached.expiresAt > Date.now() + 60000) { // 1 minute buffer
    if (!includeId || cached.id) {
      return {
        access: cached.access,
        id: cached.id,
      };
    }

    tokenCache.delete(config.scope);
  }
  
  const authority = config.authority || 'https://login.microsoftonline.com';
  const tokenEndpoint = `${authority}/oauth2/v2.0/token`;
  
  const body = new URLSearchParams({
    client_id: config.clientId,
    client_secret: config.clientSecret,
    scope: config.scope,
    grant_type: 'client_credentials',
  });
  
  try {
    const response = await fetch(tokenEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString(),
    });
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Token acquisition failed: ${response.status} ${error}`);
    }
    
    const tokenResponse: TokenResponse = await response.json();
    
    // Cache the token
    tokenCache.set(config.scope, {
      access: tokenResponse.access_token,
      id: includeId ? tokenResponse.id_token : undefined,
      expiresAt: Date.now() + (tokenResponse.expires_in * 1000),
    });
    
    return {
      access: tokenResponse.access_token,
      id: includeId ? tokenResponse.id_token : undefined,
    };
  } catch (error) {
    throw new Error(`Failed to acquire access token: ${error}`);
  }
}

export function clearTokenCahe() {
  tokenCache.clear();
}