// AsyncLocalStorage context management for request-scoped data storage
import { AsyncLocalStorage } from 'async_hooks';

export interface RequestContext {
  // ID Token claims (from UI authentication)
  idToken?: string;
  idTokenClaims?: {
    sub?: string; // Subject (user ID)
    name?: string;
    email?: string;
    preferred_username?: string;
    roles?: string[];
    [key: string]: any;
  };
  
  // Access Token claims (service-to-service)
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
  
  // Request metadata
  requestId?: string;
  correlationId?: string;
  timestamp?: number;
  
  // Custom context data
  customClaims?: Record<string, any>;
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
