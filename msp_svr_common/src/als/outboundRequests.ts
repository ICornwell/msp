// Outbound request handler with automatic token acquisition and claim propagation
import { getAllClaims } from './claimHelpers.js';

export interface ClientCredentialsConfig {
  clientId: string;
  clientSecret: string;
  tenantId: string;
  scope: string; // e.g., "api://target-service/.default"
  authority?: string; // defaults to Azure AD
}

export interface OutboundRequestOptions {
  url: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: any;
  excludeClaims?: string[]; // Claims to exclude from propagation
  includeAllClaims?: boolean; // Default: true
}

interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  ext_expires_in?: number;
}

// Token cache: key = scope, value = { token, expiresAt }
const tokenCache = new Map<string, { token: string; expiresAt: number }>();

/**
 * Acquire an access token using client credentials flow
 */
async function acquireAccessToken(
  config: ClientCredentialsConfig
): Promise<string> {
  // Check cache first
  const cached = tokenCache.get(config.scope);
  if (cached && cached.expiresAt > Date.now() + 60000) { // 1 minute buffer
    return cached.token;
  }
  
  const authority = config.authority || 'https://login.microsoftonline.com';
  const tokenEndpoint = `${authority}/${config.tenantId}/oauth2/v2.0/token`;
  
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
      token: tokenResponse.access_token,
      expiresAt: Date.now() + (tokenResponse.expires_in * 1000),
    });
    
    return tokenResponse.access_token;
  } catch (error) {
    throw new Error(`Failed to acquire access token: ${error}`);
  }
}

/**
 * Get claims to propagate as headers
 */
function getClaimHeaders(
  includeAllClaims: boolean = true,
  excludeClaims: string[] = []
): Record<string, string> {
  if (!includeAllClaims) {
    return {};
  }
  
  const claims = getAllClaims();
  const headers: Record<string, string> = {};
  
  // Default excluded claims (sensitive or not needed for propagation)
  const defaultExcluded = [
    'iat', 'exp', 'nbf', 'aud', 'iss', 'sub', 'jti',
    'azp', 'auth_time', 'at_hash', 'c_hash', 'nonce',
  ];
  
  const allExcluded = [...defaultExcluded, ...excludeClaims];
  
  for (const [key, value] of Object.entries(claims)) {
    if (allExcluded.includes(key)) {
      continue;
    }
    
    // Convert claim to header format
    const headerName = `X-Context-Claim-${key}`;
    
    // Serialize value appropriately
    let headerValue: string;
    if (typeof value === 'string') {
      headerValue = value;
    } else if (Array.isArray(value)) {
      headerValue = value.join(',');
    } else if (typeof value === 'object' && value !== null) {
      headerValue = JSON.stringify(value);
    } else {
      headerValue = String(value);
    }
    
    headers[headerName] = headerValue;
  }
  
  return headers;
}

/**
 * Make an outbound HTTP request with automatic token acquisition and claim propagation
 */
export async function makeAuthenticatedRequest(
  credentialsConfig: ClientCredentialsConfig,
  requestOptions: OutboundRequestOptions
): Promise<Response> {
  // Acquire access token
  const accessToken = await acquireAccessToken(credentialsConfig);
  
  // Get claim headers
  const claimHeaders = getClaimHeaders(
    requestOptions.includeAllClaims ?? true,
    requestOptions.excludeClaims || []
  );
  
  // Build headers
  const headers: Record<string, string> = {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
    ...claimHeaders,
    ...requestOptions.headers, // Allow override
  };
  
  // Build fetch options
  const fetchOptions: RequestInit = {
    method: requestOptions.method || 'GET',
    headers,
  };
  
  if (requestOptions.body && (requestOptions.method !== 'GET')) {
    fetchOptions.body = typeof requestOptions.body === 'string'
      ? requestOptions.body
      : JSON.stringify(requestOptions.body);
  }
  
  // Make the request
  try {
    const response = await fetch(requestOptions.url, fetchOptions);
    return response;
  } catch (error) {
    throw new Error(`Outbound request failed: ${error}`);
  }
}

/**
 * Helper: Make authenticated GET request
 */
export async function authenticatedGet(
  credentialsConfig: ClientCredentialsConfig,
  url: string,
  options?: Omit<OutboundRequestOptions, 'url' | 'method'>
): Promise<Response> {
  return makeAuthenticatedRequest(credentialsConfig, {
    ...options,
    url,
    method: 'GET',
  });
}

/**
 * Helper: Make authenticated POST request
 */
export async function authenticatedPost(
  credentialsConfig: ClientCredentialsConfig,
  url: string,
  body?: any,
  options?: Omit<OutboundRequestOptions, 'url' | 'method' | 'body'>
): Promise<Response> {
  return makeAuthenticatedRequest(credentialsConfig, {
    ...options,
    url,
    method: 'POST',
    body,
  });
}

/**
 * Helper: Make authenticated PUT request
 */
export async function authenticatedPut(
  credentialsConfig: ClientCredentialsConfig,
  url: string,
  body?: any,
  options?: Omit<OutboundRequestOptions, 'url' | 'method' | 'body'>
): Promise<Response> {
  return makeAuthenticatedRequest(credentialsConfig, {
    ...options,
    url,
    method: 'PUT',
    body,
  });
}

/**
 * Helper: Make authenticated DELETE request
 */
export async function authenticatedDelete(
  credentialsConfig: ClientCredentialsConfig,
  url: string,
  options?: Omit<OutboundRequestOptions, 'url' | 'method'>
): Promise<Response> {
  return makeAuthenticatedRequest(credentialsConfig, {
    ...options,
    url,
    method: 'DELETE',
  });
}

/**
 * Helper: Make authenticated PATCH request
 */
export async function authenticatedPatch(
  credentialsConfig: ClientCredentialsConfig,
  url: string,
  body?: any,
  options?: Omit<OutboundRequestOptions, 'url' | 'method' | 'body'>
): Promise<Response> {
  return makeAuthenticatedRequest(credentialsConfig, {
    ...options,
    url,
    method: 'PATCH',
    body,
  });
}

/**
 * Clear the token cache (useful for testing or forced refresh)
 */
export function clearTokenCache(): void {
  tokenCache.clear();
}
