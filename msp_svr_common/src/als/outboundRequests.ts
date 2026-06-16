// Outbound request handler with automatic token acquisition and claim propagation
import {
  getAssertionStore,
  getMetadataStoreEntry,
  getRequestContext,
  setMetadataStoreEntry,
  setRequestContext,
  type AssertionStoreEntry,
} from './context.js';
import { getTokenForService, clearTokenCahe } from '../auth/auth.js';
import { getConfig } from '../configuredCommon.js';

export interface OutboundRequestOptions {
  url: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: any;
  excludeAssertions?: string[]; // Assertion names to exclude from propagation
  includeAllAssertions?: boolean; // Default: true
  includeIdToken?: boolean; // Default: false
}

const HEADER_CORRELATION_ID = 'msp-correlation-id';
const HEADER_SERVICE_LINEAGE = 'msp-service-lc';

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
  setMetadataStoreEntry(HEADER_SERVICE_LINEAGE, serialised);
  return serialised;
}

function getOrCreateCorrelationId(): string {
  const context = getRequestContext();
  const existing = context?.correlationId || getMetadataStoreEntry(HEADER_CORRELATION_ID);
  if (existing) {
    return existing;
  }

  const next = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  setRequestContext({ correlationId: next });
  setMetadataStoreEntry(HEADER_CORRELATION_ID, next);
  return next;
}


/**
 * Get assertion tokens to propagate as headers
 */
function getAssertionHeaders(
  includeAllAssertions: boolean = true,
  excludeAssertions: string[] = []
): Record<string, string> {
  if (!includeAllAssertions) {
    return {};
  }

  const assertionStore = getAssertionStore();
  const headers: Record<string, string> = {};

  for (const [assertionName, entry] of Object.entries(assertionStore) as Array<[string, AssertionStoreEntry]>) {
    if (excludeAssertions.includes(assertionName)) {
      continue;
    }

    if (!entry.token) {
      continue;
    }

    headers[entry.headerName] = entry.token;
  }

  return headers;
}

function collectResponsePropagationHeaders(response: Response): void {
  const correlationFromResponse = response.headers.get(HEADER_CORRELATION_ID);
  if (correlationFromResponse) {
    setRequestContext({ correlationId: correlationFromResponse });
    setMetadataStoreEntry(HEADER_CORRELATION_ID, correlationFromResponse);
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
  
  // Get assertion headers
  const includeAllAssertions = requestOptions.includeAllAssertions ?? true;
  const excludeAssertions = requestOptions.excludeAssertions ?? [];

  const assertionHeaders = getAssertionHeaders(
    includeAllAssertions,
    excludeAssertions,
  );
  
  // Build headers
  const headers: Record<string, string> = {
    'Authorization': `Bearer ${serviceToken.access}`,
    'Content-Type': 'application/json',
    [HEADER_CORRELATION_ID]: getOrCreateCorrelationId(),
    [HEADER_SERVICE_LINEAGE]: buildNextServiceLineage(),
    ...assertionHeaders,
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
