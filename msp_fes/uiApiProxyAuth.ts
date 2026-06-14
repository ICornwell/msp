import type { Request } from 'express';

import { getConfig, setConfig, validateAccessToken } from 'msp_svr_common';
import { getTokenForService } from 'msp_svr_common';
import type { JWTValidationConfig } from 'msp_common';
import { resolveConfig } from './config.js'
import { config } from 'dotenv';


config();
const runtimeConfig = resolveConfig();
setConfig(runtimeConfig);

type InboundValidationResult =
  | { ok: true }
  | { ok: false; status: number; message: string };

const CLAIM_HEADER_PATTERN = /^msp-x-[a-z0-9]+-[a-z0-9]+-claim$/i;

function parseBearerToken(authorizationHeader: string | undefined): string | undefined {
  if (!authorizationHeader) {
    return undefined;
  }

  const match = authorizationHeader.match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim();
}

function isValidJwtValidationConfig(config: JWTValidationConfig | undefined): config is JWTValidationConfig {
  if (!config) {
    return false;
  }

  if (!Array.isArray(config.trustedIssuers) || config.trustedIssuers.length === 0) {
    return false;
  }

  if (!config.audience || !String(config.audience).trim()) {
    return false;
  }

  return true;
}

function resolveRuntimeJwtValidationConfig(): JWTValidationConfig | undefined {
  const config = getConfig().jwtValidation;
  return isValidJwtValidationConfig(config) ? config : undefined;
}

function assertClientCredentialsStartupConfig(): void {
  const credentials = getConfig().clientCredentials;
  const missingKeys: string[] = [];

  if (!credentials?.clientId?.trim()) {
    missingKeys.push('MSP_BFF_clientId');
  }
  if (!credentials?.clientSecret?.trim()) {
    missingKeys.push('MSP_BFF_clientSecret');
  }
  if (!credentials?.tenantId?.trim()) {
    missingKeys.push('MSP_tenantId');
  }
  if (!credentials?.scope?.trim()) {
    missingKeys.push('MSP_core_clientScopes');
  }
  if (!credentials?.authority?.trim()) {
    missingKeys.push('MSP_authority');
  }

  if (missingKeys.length > 0) {
    console.error(`Missing required client credentials configuration: ${missingKeys.join(', ')}`);
    throw new Error(`Missing required client credentials configuration: ${missingKeys.join(', ')}`);
  }
}

export function assertProxyAuthStartupConfig(): void {
  const jwtValidation = resolveRuntimeJwtValidationConfig();
  if (!jwtValidation) {
    console.error('Missing required JWT validation configuration: MSP_core_issuers and MSP_aud');
    throw new Error('Missing required JWT validation configuration: MSP_core_issuers and MSP_aud');
  }

  assertClientCredentialsStartupConfig();
}

async function validateInboundAccessToken(inboundAccessToken: string): Promise<boolean> {
  const jwtValidation = resolveRuntimeJwtValidationConfig();
  if (!jwtValidation) {
    // Fail-closed if runtime configuration is corrupted after startup.
    console.error('Missing required JWT validation configuration: MSP_core_issuers and MSP_aud');
    return false;
  }

  try {
    await validateAccessToken(inboundAccessToken, jwtValidation);
    return true;
  } catch (error) {
    console.warn(`Invalid bearer token in inbound request: ${error}`);
    return false;
  }
}

export async function validateInboundRequestAuth(req: Request): Promise<InboundValidationResult> {
  const authHeader = Array.isArray(req.headers.authorization)
    ? req.headers.authorization[0]
    : req.headers.authorization;
  const inboundAccessToken = parseBearerToken(authHeader);

  if (!inboundAccessToken) {
    console.warn('Missing bearer token in inbound request');
    // missing bearer is allowed as long as no id token was presented
    // some guest access is normal.
    return { ok: true }
    //   ok: false,
    //   status: 401,
    //   message: 'Missing bearer token',
    // };
  }

  const isValid = await validateInboundAccessToken(inboundAccessToken);
  if (!isValid) {
    console.warn('Invalid bearer token in inbound request');
    return {
      ok: false,
      status: 401,
      message: 'Invalid bearer token',
    };
  }

  return { ok: true };
}

async function getOutboundBearerToken(): Promise<string> {
  const serviceToken = await getTokenForService(false);
  if (!serviceToken?.access || serviceToken.access === 'no token') {
    throw new Error('Could not acquire outbound bearer token');
  }

  return serviceToken.access;
}

export async function buildProxyAuthAndPropagationHeaders(
  req: Request,
  options: { propagateClaims: boolean },
): Promise<Record<string, string>> {
  const outboundBearer = await getOutboundBearerToken();
  const headers: Record<string, string> = {
    Authorization: `Bearer ${outboundBearer}`,
  };

  const correlationId = req.headers['msp-x-correlation-id'];
  if (typeof correlationId === 'string' && correlationId.trim()) {
    headers['MSP-X-CORRELATION-ID'] = correlationId;
  }

  const serviceLineage = req.headers['msp-x-service-lc'];
  if (typeof serviceLineage === 'string' && serviceLineage.trim()) {
    headers['MSP-X-SERVICE-LC'] = serviceLineage;
  }

  if (options.propagateClaims) {
    for (const [name, rawValue] of Object.entries(req.headers)) {
      if (!CLAIM_HEADER_PATTERN.test(name)) {
        continue;
      }

      const value = Array.isArray(rawValue) ? rawValue[0] : rawValue;
      if (typeof value === 'string' && value.trim()) {
        headers[name] = value;
      }
    }
  }

  return headers;
}
