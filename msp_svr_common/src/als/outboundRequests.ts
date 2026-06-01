// Outbound request handler with automatic token acquisition and claim propagation
import { getAllClaims } from './claimHelpers.js';
import { getTokenForService, clearTokenCahe } from '../auth/auth.js';

export interface OutboundRequestOptions {
  url: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: any;
  excludeClaims?: string[]; // Claims to exclude from propagation
  includeAllClaims?: boolean; // Default: true
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
  requestOptions: OutboundRequestOptions
): Promise<Response> {
  // Acquire access token
  const accessToken = await getTokenForService();
  
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
    console.error(`Error making authenticated request ${requestOptions.method} for ${requestOptions.url}:`, error);
    throw new Error(`Outbound request failed: ${error}`);
  }
}

/**
 * Helper: Make authenticated GET request
 */
export async function authenticatedGet(
  url: string,
  options?: Omit<OutboundRequestOptions, 'url' | 'method'>
): Promise<Response> {
  return makeAuthenticatedRequest({
    ...options,
    url,
    method: 'GET',
  });
}

/**
 * Helper: Make authenticated POST request
 */
export async function authenticatedPost(
  url: string,
  body?: any,
  options?: Omit<OutboundRequestOptions, 'url' | 'method' | 'body'>
): Promise<Response> {
  return makeAuthenticatedRequest( {
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
  url: string,
  body?: any,
  options?: Omit<OutboundRequestOptions, 'url' | 'method' | 'body'>
): Promise<Response> {
  return makeAuthenticatedRequest( {
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
  url: string,
  options?: Omit<OutboundRequestOptions, 'url' | 'method'>
): Promise<Response> {
  return makeAuthenticatedRequest( {
    ...options,
    url,
    method: 'DELETE',
  });
}

/**
 * Helper: Make authenticated PATCH request
 */
export async function authenticatedPatch(
  url: string,
  body?: any,
  options?: Omit<OutboundRequestOptions, 'url' | 'method' | 'body'>
): Promise<Response> {
  return makeAuthenticatedRequest( {
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
  clearTokenCahe();
}
