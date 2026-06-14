// AsyncLocalStorage context management for request-scoped data storage
import { AsyncLocalStorage } from 'async_hooks';

export type IdToken={
  idToken?: string;
  idTokenClaims?: {
    sub?: string; // Subject (user ID)
    name?: string;
    email?: string;
    preferred_username?: string;
    roles?: string[];
    [key: string]: any;
  };
}

export type AccessToken={
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
}

export type WorkToken={
  workToken?: string;
  workTokenClaims?: {
    sub?: string;
    // TODO: Define expected claims for work tokens
    [key: string]: any;
  };
}

export type ClaimStoreEntry = {
  name: string;
  headerName: string;
  kind: 'jwt' | 'meta';
  token?: string;
  claims?: Record<string, any>;
  value?: string;
};

export interface RequestContext extends IdToken, AccessToken {
  
  
  // Request metadata
  requestId?: string;
  correlationId?: string;
  timestamp?: number;

  work: WorkToken[];

  transactionToken?: string

  claimStore?: Record<string, ClaimStoreEntry>;
  serviceLineage?: string;
  serviceLineageCurrentPath?: string;
  serviceLineageChildCounter?: number;
}

// Create AsyncLocalStorage instance
export const requestContextStorage = new AsyncLocalStorage<RequestContext>();

/**
 * Get the current request context from AsyncLocalStorage
 */
export function getRequestContext(): RequestContext | undefined {
  console.warn('SVR: Getting from ALS context');
  return requestContextStorage.getStore();
}

/**
 * Set or update the request context
 */
export function setRequestContext(context: Partial<RequestContext>): void {
  const currentContext = getRequestContext();
  if (currentContext) {
    console.log(`SVR: updating request context with ${JSON.stringify(context)}`);
    Object.assign(currentContext, context);
  } else {
    console.warn('SVR: No active request context found to set');
  }
}

export function getClaimStore(): Record<string, ClaimStoreEntry> {
  return getRequestContext()?.claimStore ?? {};
}

export function setClaimStoreEntry(name: string, entry: ClaimStoreEntry): void {
  const currentContext = getRequestContext();
  if (!currentContext) {
    console.warn(`SVR: No active request context found to store claim ${name}`);
    return;
  }

  if (!currentContext.claimStore) {
    currentContext.claimStore = {};
  }

  currentContext.claimStore[name] = entry;
}

/**
 * Run a function within a new request context
 */
export function runWithContext<T>(
  context: RequestContext,
  fn: () => T
): T {
  console.log(`SVR: running function within new synchronous request context: ${JSON.stringify(context)}`);
  return requestContextStorage.run(context, fn);
}

/**
 * Async version of runWithContext
 */
export async function runWithContextAsync<T>(
  context: RequestContext,
  fn: () => Promise<T>
): Promise<T> {
  console.log(`SVR: running function within new async request context: ${JSON.stringify(context)}`);
  return requestContextStorage.run(context, fn);
}

/**
 * Clear the current context (useful for cleanup)
 */
export function clearContext(): void {
  console.log('SVR: clearing request context');
  const context = getRequestContext();
  if (context) {
    Object.keys(context).forEach(key => {
      delete (context as any)[key];
    });
  }
}
