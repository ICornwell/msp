// JWT Token validation and verification using jose
import { createRemoteJWKSet, jwtVerify, JWTPayload } from 'jose';
import { setRequestContext } from './context.js';

export interface JWTValidationConfig {
  trustedIssuers: string[];
  audience?: string | string[];
  clockTolerance?: number; // in seconds
  maxTokenAge?: number; // in seconds
}

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
    throw new Error('Invalid JWT format');
  }
  
  const header = JSON.parse(Buffer.from(parts[0], 'base64url').toString());
  const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString());
  
  return { header, payload };
}

/**
 * Validate an ID token (from UI authentication)
 */
export async function validateIdToken(
  token: string,
  config: JWTValidationConfig
): Promise<ValidatedToken> {
  try {
    // Decode to check issuer first
    const { payload: decodedPayload } = decodeJWT(token);
    
    // Check if issuer is trusted
    if (!config.trustedIssuers.includes(decodedPayload.iss)) {
      throw new Error(`Untrusted issuer: ${decodedPayload.iss}`);
    }
    
    // Get JWKS for the issuer
    const JWKS = await getJWKS(decodedPayload.iss);
    
    // Verify the token
    const verifyOptions: any = {
      issuer: config.trustedIssuers,
      clockTolerance: config.clockTolerance || 60,
    };
    
    if (config.audience) {
      verifyOptions.audience = config.audience;
    }
    
    if (config.maxTokenAge) {
      verifyOptions.maxTokenAge = config.maxTokenAge;
    }
    
    const result = await jwtVerify(token, JWKS, verifyOptions);
    
    return {
      payload: result.payload,
      raw: token,
      header: result.protectedHeader,
    };
  } catch (error) {
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
    // Decode to check issuer first
    const { payload: decodedPayload } = decodeJWT(token);
    
    // Check if issuer is trusted
    if (!config.trustedIssuers.includes(decodedPayload.iss)) {
      throw new Error(`Untrusted issuer: ${decodedPayload.iss}`);
    }
    
    // Get JWKS for the issuer
    const JWKS = await getJWKS(decodedPayload.iss);
    
    // Verify the token
    const verifyOptions: any = {
      issuer: config.trustedIssuers,
      clockTolerance: config.clockTolerance || 60,
    };
    
    if (config.audience) {
      verifyOptions.audience = config.audience;
    }
    
    const result = await jwtVerify(token, JWKS, verifyOptions);
    
    return {
      payload: result.payload,
      raw: token,
      header: result.protectedHeader,
    };
  } catch (error) {
    throw new Error(`Access token validation failed: ${error}`);
  }
}

/**
 * Validate and store ID token in ALS
 */
export async function validateAndStoreIdToken(
  token: string,
  config: JWTValidationConfig
): Promise<void> {
  const validated = await validateIdToken(token, config);
  
  setRequestContext({
    idToken: validated.raw,
    idTokenClaims: validated.payload as any,
  });
}

/**
 * Validate and store access token in ALS
 */
export async function validateAndStoreAccessToken(
  token: string,
  config: JWTValidationConfig
): Promise<void> {
  const validated = await validateAccessToken(token, config);
  
  setRequestContext({
    accessToken: validated.raw,
    accessTokenClaims: validated.payload as any,
  });
}

/**
 * Clear JWKS cache (useful for testing or forced refresh)
 */
export function clearJWKSCache(): void {
  jwksCache.clear();
}
