// JWT Token validation and verification using jose
import { createRemoteJWKSet, jwtVerify, JWTPayload } from 'jose';
import {
  canonicalHeaderName,
  getRequestContext,
  inferAssertionTypeFromHeaderName,
  setAssertionStoreEntry,
} from './context.js';
import { JWTValidationConfig } from 'msp_common';
import {
  AUTH_ACCESS_PRIMARY_ASSERTION_HEADER,
  AuthorizationAccessAssertionFromValidatedToken,
  setNamedAuthorizationAccessAssertion,
  setUserIdAssertion,
  UserIdAssertionFromValidatedToken,
} from './assertionHelpers.js';


export interface ValidatedToken {
  payload: JWTPayload;
  raw: string;
  header: any;
}

// Cache for JWKS endpoints to avoid repeated lookups
const jwksCache = new Map<string, ReturnType<typeof createRemoteJWKSet>>();

/**
 * Get JWKS endpoint for an issuer using OIDC discovery
 */
async function getJWKSEndpoint(issuer: string): Promise<string> {
  const wellKnownUrl = `${issuer.replace(/\/$/, '')}/.well-known/openid-configuration`;
  
  try {
    const response = await fetch(wellKnownUrl);
    if (!response.ok) {
      console.log(`SVR: failed to fetch OIDC discovery document from ${wellKnownUrl}: ${response.statusText}`);
      throw new Error(`Failed to fetch OIDC discovery document: ${response.statusText}`);
    }
    
    const discoveryDoc = await response.json();
    return discoveryDoc.jwks_uri;
  } catch (error) {
    throw new Error(`OIDC discovery failed for ${issuer}: ${error}`);
  }
}

/**
 * Get or create a JWKS instance for an issuer
 */
async function getJWKS(issuer: string): Promise<ReturnType<typeof createRemoteJWKSet>> {
  if (!jwksCache.has(issuer)) {
    const jwksUri = await getJWKSEndpoint(issuer);
    const jwks = createRemoteJWKSet(new URL(jwksUri));
    jwksCache.set(issuer, jwks);
  }
  
  return jwksCache.get(issuer)!;
}

/**
 * Decode JWT without verification (to get issuer and claims)
 */
function decodeJWT(token: string): { header: any; payload: any } {
  const parts = token.split('.');
  if (parts.length !== 3) {
    console.log('SVR: failing auth: invalid JWT format');
    throw new Error('Invalid JWT format');
  }
  
  const header = JSON.parse(Buffer.from(parts[0], 'base64url').toString());
  const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString());
  
  return { header, payload };
}

type ValidationOptions = {
  validateAudience?: boolean;
  maxTokenAge?: number;
};

async function validateJwtToken(
  token: string,
  config: JWTValidationConfig,
  options: ValidationOptions = {},
): Promise<ValidatedToken> {
  const { payload: decodedPayload } = decodeJWT(token);

  if (!config.trustedIssuers.includes(decodedPayload.iss)) {
    throw new Error(`Untrusted issuer: ${decodedPayload.iss}`);
  }

  const JWKS = await getJWKS(decodedPayload.iss);
  const verifyOptions: any = {
    issuer: config.trustedIssuers,
    clockTolerance: config.clockTolerance || 60,
  };

  if (options.validateAudience !== false && config.audience) {
    verifyOptions.audience = config.audience
  }

  if (options.maxTokenAge ?? config.maxTokenAge) {
    verifyOptions.maxTokenAge = options.maxTokenAge ?? config.maxTokenAge;
  }

  const result = await jwtVerify(token, JWKS, verifyOptions);
  return {
    payload: result.payload,
    raw: token,
    header: result.protectedHeader,
  };
}

/**
 * Validate an ID token (from UI authentication)
 */
export async function validateIdToken(
  token: string,
  config: JWTValidationConfig
): Promise<ValidatedToken> {
  try {
    return await validateJwtToken(token, config, {
      validateAudience: true,
      maxTokenAge: config.maxTokenAge,
    });
  } catch (error) {
    console.log(`SVR: failing auth: ID token validation error: ${error}`);
    throw new Error(`ID token validation failed: ${error}`);
  }
}

/**
 * Validate an access token (service-to-service)
 */
export async function validateAccessToken(
  token: string,
  config: JWTValidationConfig
): Promise<ValidatedToken> {
  try {
    return await validateJwtToken(token, config, {
      validateAudience: true,
    });
  } catch (error) {
    throw new Error(`Access token validation failed: ${error}`);
  }
}

export async function validateClaimToken(
  token: string,
  config: JWTValidationConfig,
): Promise<ValidatedToken> {
  try {
    return await validateJwtToken(token, config, {
      validateAudience: false,
    });
  } catch (error) {
    console.log(`SVR: failing auth: claim token validation error: ${error}`);
    throw new Error(`Claim token validation failed: ${error}`);
  }
}

/**
 * Validate and store ID token in ALS
 */
export async function validateAndStoreIdToken(
  token: string,
  config: JWTValidationConfig
): Promise<void> {
  const requestContext = getRequestContext();
  if (!requestContext) {
    console.warn('SVR: No active request context found to store ID token');
    return;
  }
 
  // Special handling for guest token - skip validation and set minimal context
  if (token === "!GuestToken!") {
    setUserIdAssertion(UserIdAssertionFromValidatedToken({ payload: { sub: 'guest' }, raw: token, header: {} }));
    return;
  }
  const validated: ValidatedToken = await validateIdToken(token, config);
  
  setUserIdAssertion(UserIdAssertionFromValidatedToken(validated))
}

/**
 * Validate and store access token in ALS
 */
export async function validateAndStoreAccessToken(
  token: string,
  config: JWTValidationConfig,
  assertionHeaderName: string = AUTH_ACCESS_PRIMARY_ASSERTION_HEADER,
): Promise<void> {
  const validated = await validateAccessToken(token, config);

  const assertion = AuthorizationAccessAssertionFromValidatedToken(validated);
  assertion.headerName = canonicalHeaderName(assertionHeaderName || assertion.headerName);
  setNamedAuthorizationAccessAssertion(assertion.headerName, assertion);
}

export async function validateAndStoreClaimToken(
  assertionHeaderName: string,
  headerName: string,
  token: string,
  config: JWTValidationConfig,
): Promise<void> {
  const validated = await validateClaimToken(token, config);
  const canonical = canonicalHeaderName(assertionHeaderName || headerName);
  setAssertionStoreEntry(canonical, {
    assertionName: canonical,
    assertionType: inferAssertionTypeFromHeaderName(canonical),
    headerName: canonicalHeaderName(headerName),
    token: validated.raw,
    claims: validated.payload as Record<string, any>,
  });
}

/**
 * Clear JWKS cache (useful for testing or forced refresh)
 */
export function clearJWKSCache(): void {
  jwksCache.clear();
}
