// AsyncLocalStorage context management for request-scoped data storage
import { AsyncLocalStorage } from 'async_hooks';

export type IdAssertion = {
  headerName: string;
  idToken?: string;
  idTokenClaims?: {
    sub?: string; // Subject (user ID)
    name?: string;
    email?: string;
    preferred_username?: string;
    roles?: string[];
    [key: string]: any;
  };
};

export type AccessAssertion = {
  headerName: string;
  accessToken?: string;
  accessTokenClaims?: {
    sub?: string;
    client_id?: string;
    oid?: string; // Object ID
    tid?: string; // Tenant ID
    roles?: string[];
    scp?: string; // Scopes
    [key: string]: any;
  };
};

export type WorkAssertion = {
  headerName: string;
  workToken?: string;
  workTokenClaims?: {
    sub?: string;
    // TODO: Define expected claims for work tokens
    [key: string]: any;
  };
};

export type AssertionType =
  | 'id'
  | 'access'
  | 'work'
  | 'feature-access'
  | 'data-access'
  | 'context-security'
  | 'generic';

export type AssertionStoreEntry = {
  assertionName: string;
  assertionType: AssertionType;
  headerName: string;
  token: string;
  claims: Record<string, any>;
};

export interface RequestContext {
  // Request metadata
  requestId?: string;
  correlationId?: string;
  timestamp?: number;
  assertionStore?: Record<string, AssertionStoreEntry>;
  metadataStore?: Record<string, string>;

  transactionAssertion?: string;

  serviceLineage?: string;
  serviceLineageCurrentPath?: string;
  serviceLineageChildCounter?: number;
}

const ASSERTION_HEADER_PATTERN = /^msp-[a-z0-9-]+-assertion$/;

export function canonicalHeaderName(headerName: string): string {
  return String(headerName || '').trim().toLowerCase();
}

export function isAssertionHeaderName(headerName: string): boolean {
  return ASSERTION_HEADER_PATTERN.test(canonicalHeaderName(headerName));
}

export function inferAssertionTypeFromHeaderName(headerName: string): AssertionType {
  const canonical = canonicalHeaderName(headerName);
  if (canonical.startsWith('msp-auth-access-')) {
    return 'access';
  }
  if (canonical.startsWith('msp-user-id-') || canonical.startsWith('msp-actor-id-')) {
    return 'id';
  }
  if (canonical.startsWith('msp-work-')) {
    return 'work';
  }
  if (canonical.startsWith('msp-feature-access-')) {
    return 'feature-access';
  }
  if (canonical.startsWith('msp-data-access-')) {
    return 'data-access';
  }
  if (canonical.startsWith('msp-context-security-')) {
    return 'context-security';
  }
  return 'generic';
}

// Create AsyncLocalStorage instance
export const requestContextStorage = new AsyncLocalStorage<RequestContext>();

/**
 * Get the current request context from AsyncLocalStorage
 */
export function getRequestContext(): RequestContext | undefined {
  return requestContextStorage.getStore();
}

/**
 * Set or update the request context
 */
export function setRequestContext(context: Partial<RequestContext>): void {
  const currentContext = getRequestContext();
  if (currentContext) {
    Object.assign(currentContext, context);
  }
}

export function getAssertionStore(): Record<string, AssertionStoreEntry> {
  return getRequestContext()?.assertionStore ?? {};
}

export function getAssertionStoreEntry(assertionNameOrHeaderName: string): AssertionStoreEntry | undefined {
  return getAssertionStore()[canonicalHeaderName(assertionNameOrHeaderName)];
}

export function setAssertionStoreEntry(assertionNameOrHeaderName: string, entry: AssertionStoreEntry): void {
  const currentContext = getRequestContext();
  if (!currentContext) {
    return;
  }

  if (!currentContext.assertionStore) {
    currentContext.assertionStore = {};
  }

  const assertionName = canonicalHeaderName(assertionNameOrHeaderName || entry.assertionName || entry.headerName);
  currentContext.assertionStore[assertionName] = {
    ...entry,
    assertionName,
    headerName: canonicalHeaderName(entry.headerName || assertionName),
  };
}

export function getAssertionsByType(assertionType: AssertionType): AssertionStoreEntry[] {
  return Object.values(getAssertionStore()).filter((entry) => entry.assertionType === assertionType);
}

export function removeAssertionStoreEntry(assertionNameOrHeaderName: string): void {
  const currentContext = getRequestContext();
  if (!currentContext?.assertionStore) {
    return;
  }
  delete currentContext.assertionStore[canonicalHeaderName(assertionNameOrHeaderName)];
}

export function getMetadataStore(): Record<string, string> {
  return getRequestContext()?.metadataStore ?? {};
}

export function setMetadataStoreEntry(name: string, value: string): void {
  const currentContext = getRequestContext();
  if (!currentContext) {
    return;
  }

  if (!currentContext.metadataStore) {
    currentContext.metadataStore = {};
  }

  currentContext.metadataStore[canonicalHeaderName(name)] = value;
}

export function getMetadataStoreEntry(name: string): string | undefined {
  return getMetadataStore()[canonicalHeaderName(name)];
}

/**
 * Run a function within a new request context
 */
export function runWithContext<T>(
  context: RequestContext,
  fn: () => T
): T {
  return requestContextStorage.run(context, fn);
}

/**
 * Async version of runWithContext
 */
export async function runWithContextAsync<T>(
  context: RequestContext,
  fn: () => Promise<T>
): Promise<T> {
  return requestContextStorage.run(context, fn);
}

/**
 * Clear the current context (useful for cleanup)
 */
export function clearContext(): void {
  const context = getRequestContext();
  if (context) {
    Object.keys(context).forEach(key => {
      delete (context as any)[key];
    });
  }
}
