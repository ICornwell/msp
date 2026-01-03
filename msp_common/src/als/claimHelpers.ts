// Helper functions to retrieve JWT claims from AsyncLocalStorage
import { getRequestContext } from './context.js';

/**
 * Get the current user ID from ID token claims
 */
export function getUserId(): string | undefined {
  const context = getRequestContext();
  return context?.idTokenClaims?.sub || context?.idTokenClaims?.oid;
}

/**
 * Get the current user name from ID token claims
 */
export function getUserName(): string | undefined {
  const context = getRequestContext();
  return context?.idTokenClaims?.name || 
         context?.idTokenClaims?.preferred_username ||
         context?.idTokenClaims?.email;
}

/**
 * Get the current user email from ID token claims
 */
export function getUserEmail(): string | undefined {
  const context = getRequestContext();
  return context?.idTokenClaims?.email || context?.idTokenClaims?.upn;
}

/**
 * Get user roles from ID token claims
 */
export function getUserRoles(): string[] {
  const context = getRequestContext();
  const roles = context?.idTokenClaims?.roles;
  
  if (Array.isArray(roles)) {
    return roles;
  }
  
  if (typeof roles === 'string') {
    return [roles];
  }
  
  return [];
}

/**
 * Check if user has a specific role
 */
export function hasRole(role: string): boolean {
  return getUserRoles().includes(role);
}

/**
 * Check if user has any of the specified roles
 */
export function hasAnyRole(roles: string[]): boolean {
  const userRoles = getUserRoles();
  return roles.some(role => userRoles.includes(role));
}

/**
 * Check if user has all of the specified roles
 */
export function hasAllRoles(roles: string[]): boolean {
  const userRoles = getUserRoles();
  return roles.every(role => userRoles.includes(role));
}

/**
 * Get a specific claim from ID token
 */
export function getIdTokenClaim(claimName: string): any {
  const context = getRequestContext();
  return context?.idTokenClaims?.[claimName];
}

/**
 * Get all ID token claims
 */
export function getAllIdTokenClaims(): Record<string, any> | undefined {
  const context = getRequestContext();
  return context?.idTokenClaims;
}

/**
 * Get a specific claim from access token
 */
export function getAccessTokenClaim(claimName: string): any {
  const context = getRequestContext();
  return context?.accessTokenClaims?.[claimName];
}

/**
 * Get all access token claims
 */
export function getAllAccessTokenClaims(): Record<string, any> | undefined {
  const context = getRequestContext();
  return context?.accessTokenClaims;
}

/**
 * Get client ID from access token (for service-to-service calls)
 */
export function getClientId(): string | undefined {
  const context = getRequestContext();
  return context?.accessTokenClaims?.client_id || 
         context?.accessTokenClaims?.azp || 
         context?.accessTokenClaims?.appid;
}

/**
 * Get tenant ID from token claims
 */
export function getTenantId(): string | undefined {
  const context = getRequestContext();
  return context?.accessTokenClaims?.tid || context?.idTokenClaims?.tid;
}

/**
 * Get the current request ID
 */
export function getRequestId(): string | undefined {
  const context = getRequestContext();
  return context?.requestId;
}

/**
 * Get the correlation ID for tracing across services
 */
export function getCorrelationId(): string | undefined {
  const context = getRequestContext();
  return context?.correlationId;
}

/**
 * Get a custom claim value
 */
export function getCustomClaim(claimName: string): any {
  const context = getRequestContext();
  return context?.customClaims?.[claimName];
}

/**
 * Get all custom claims
 */
export function getAllCustomClaims(): Record<string, any> | undefined {
  const context = getRequestContext();
  return context?.customClaims;
}

/**
 * Get scopes from access token
 */
export function getScopes(): string[] {
  const context = getRequestContext();
  const scopes = context?.accessTokenClaims?.scp || context?.accessTokenClaims?.scope;
  
  if (typeof scopes === 'string') {
    return scopes.split(' ');
  }
  
  if (Array.isArray(scopes)) {
    return scopes;
  }
  
  return [];
}

/**
 * Check if a specific scope is present
 */
export function hasScope(scope: string): boolean {
  return getScopes().includes(scope);
}

/**
 * Get all claims from both ID and access tokens combined
 */
export function getAllClaims(): Record<string, any> {
  const context = getRequestContext();
  return {
    ...context?.idTokenClaims,
    ...context?.accessTokenClaims,
    ...context?.customClaims,
  };
}
