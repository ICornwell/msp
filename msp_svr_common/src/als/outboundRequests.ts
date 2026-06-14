// Outbound request handler with automatic token acquisition and claim propagation
import { getRequestContext, setClaimStoreEntry, setRequestContext, type ClaimStoreEntry } from './context.js';
import { getTokenForService, clearTokenCahe } from '../auth/auth.js';
import { getConfig } from '../configuredCommon.js';

export interface OutboundRequestOptions {
  url: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: any;
  excludeClaims?: string[]; // Claim-store names to exclude from propagation
  includeAllClaims?: boolean; // Default: true
  includeIdToken?: boolean; // Default: false
}


function toClaimHeaderName(claimName: string): string {
  return `MSP-X-${claimName.split('-').map(part => part.toUpperCase()).join('-')}-CLAIM`;
}

function getServiceName(): string {
  const product = getConfig().product;
  if (!product) {
    return 'unknown-service';
  }
  return [product.domain, product.name, product.version, product.variantName].filter(Boolean).join('/');
}

function parseServiceLineage(lineage?: string): Array<{ path: string; service: string; timestamp: string }> {
  if (!lineage) {
    return [];
  }

  return lineage
    .split(',')
    .map(entry => entry.trim())
    .filter(Boolean)
    .map(entry => {
      const [path, service, timestamp] = entry.split('|');
      return { path, service, timestamp };
    })
    .filter(entry => entry.path && entry.service && entry.timestamp);
}

function serialiseServiceLineage(entries: Array<{ path: string; service: string; timestamp: string }>): string {
  return entries.map(entry => `${entry.path}|${entry.service}|${entry.timestamp}`).join(',');
}

function sortServiceLineageEntries(entries: Array<{ path: string; service: string; timestamp: string }>) {
  const byPath = (path: string) => path.split('.').map(part => Number(part));
  return [...entries].sort((a, b) => {
    const ap = byPath(a.path);
    const bp = byPath(b.path);
    const max = Math.max(ap.length, bp.length);
    for (let i = 0; i < max; i++) {
      const av = ap[i] ?? 0;
      const bv = bp[i] ?? 0;
      if (av !== bv) {
        return av - bv;
      }
    }
    return 0;
  });
}

function buildNextServiceLineage(): string {
  const context = getRequestContext();
  const existingEntries = parseServiceLineage(context?.serviceLineage);
  const selfService = getServiceName();

  const baseEntries = existingEntries.length > 0
    ? existingEntries
    : [{ path: '1', service: selfService, timestamp: new Date().toISOString() }];

  const currentPath = context?.serviceLineageCurrentPath || baseEntries[baseEntries.length - 1]?.path || '1';
  const nextIndex = (context?.serviceLineageChildCounter ?? 0) + 1;
  const nextPath = `${currentPath}.${nextIndex}`;
  const nextEntries = [
    ...baseEntries,
    { path: nextPath, service: selfService, timestamp: new Date().toISOString() },
  ];
  const serialised = serialiseServiceLineage(sortServiceLineageEntries(nextEntries));

  setRequestContext({
    serviceLineage: serialised,
    serviceLineageCurrentPath: currentPath,
    serviceLineageChildCounter: nextIndex,
  });
  setClaimStoreEntry('service-lc', {
    name: 'service-lc',
    headerName: 'MSP-X-SERVICE-LC',
    kind: 'meta',
    value: serialised,
  });
  return serialised;
}

function getOrCreateCorrelationId(): string {
  const context = getRequestContext();
  const existing = context?.correlationId || context?.claimStore?.['correlation-id']?.value;
  if (existing) {
    return existing;
  }

  const next = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  setRequestContext({ correlationId: next });
  setClaimStoreEntry('correlation-id', {
    name: 'correlation-id',
    headerName: 'MSP-X-CORRELATION-ID',
    kind: 'meta',
    value: next,
  });
  return next;
}


/**
 * Get claim tokens to propagate as headers
 */
function getClaimHeaders(
  includeAllClaims: boolean = true,
  excludeClaims: string[] = []
): Record<string, string> {
  if (!includeAllClaims) {
    return {};
  }
  
  const claimStore = getRequestContext()?.claimStore ?? {};
  const headers: Record<string, string> = {};

  for (const [claimName, entry] of Object.entries(claimStore) as Array<[string, ClaimStoreEntry]>) {
    if (excludeClaims.includes(claimName)) {
      continue;
    }

    if (claimName === 'correlation-id' || claimName === 'service-lc') {
      continue;
    }

    const headerValue = entry.token ?? entry.value;
    if (!headerValue) {
      continue;
    }

    headers[entry.headerName || toClaimHeaderName(claimName)] = headerValue;
  }

  return headers;
}

function collectResponsePropagationHeaders(response: Response): void {
  const serviceLineage =
    response.headers.get('MSP-X-SERVICE-LC') || response.headers.get('MSP-SERVICE-LC');
  if (serviceLineage) {
    const localEntries = parseServiceLineage(getRequestContext()?.serviceLineage);
    const responseEntries = parseServiceLineage(serviceLineage);
    const mergedByPath = new Map<string, { path: string; service: string; timestamp: string }>();

    for (const entry of localEntries) {
      mergedByPath.set(entry.path, entry);
    }
    for (const entry of responseEntries) {
      mergedByPath.set(entry.path, entry);
    }

    const mergedEntries = sortServiceLineageEntries(Array.from(mergedByPath.values()));
    const mergedLineage = serialiseServiceLineage(mergedEntries);

    setRequestContext({
      serviceLineage: mergedLineage,
    });
    setClaimStoreEntry('service-lc', {
      name: 'service-lc',
      headerName: 'MSP-X-SERVICE-LC',
      kind: 'meta',
      value: mergedLineage,
    });
  }
}

/**
 * Make an outbound HTTP request with automatic token acquisition and claim propagation
 */
export async function makeAuthenticatedRequest(
  requestOptions: OutboundRequestOptions
): Promise<Response> {
  // Acquire access token
  const serviceToken = await getTokenForService(requestOptions.includeIdToken ?? false);
  
  // Get claim headers
  const claimHeaders = getClaimHeaders(
    requestOptions.includeAllClaims ?? true,
    requestOptions.excludeClaims || []
  );
  
  // Build headers
  const headers: Record<string, string> = {
    'Authorization': `Bearer ${serviceToken.access}`,
    'Content-Type': 'application/json',
    'MSP-X-CORRELATION-ID': getOrCreateCorrelationId(),
    'MSP-X-SERVICE-LC': buildNextServiceLineage(),
    ...claimHeaders,
    ...requestOptions.headers, // Allow override
  };

  const requestContext = getRequestContext();
  if (requestOptions.includeIdToken && requestContext?.idToken) {
    headers['MSP-X-ACTOR-ID-CLAIM'] = requestContext.idToken;
  }
  
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
    collectResponsePropagationHeaders(response);
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
