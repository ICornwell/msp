import { validateAndStoreAccessToken, validateAndStoreClaimToken } from './jwtTokens.js';
import {
  canonicalHeaderName,
  inferAssertionTypeFromHeaderName,
  isAssertionHeaderName,
  runWithContext,
  setMetadataStoreEntry,
  setRequestContext,
} from './context.js';
import { Config } from '../sharedconfig.js';
import { getConfig } from '../configuredCommon.js';

const HEADER_CORRELATION_ID = 'msp-correlation-id';
const HEADER_SERVICE_LINEAGE = 'msp-service-lc';
const HEADER_AUTHORIZATION = 'authorization';
const HEADER_AUTH_ACCESS_PRIMARY = 'msp-auth-access-1-assertion';

export type InboundRequestAuthPolicyResult =
  | { status: number; message?: string }
  | number
  | 'ok'
  | undefined
  | null;

export type InboundRequestAuthPolicy =
  () => InboundRequestAuthPolicyResult | Promise<InboundRequestAuthPolicyResult>;

function normalisePolicyResult(result: InboundRequestAuthPolicyResult): { status: number; message?: string } {
  if (result === undefined || result === null || result === 'ok') {
    return { status: 200 };
  }

  if (typeof result === 'number') {
    return { status: result };
  }

  return result;
}

function getServiceName(config: Config): string {
  const product = config.product;
  return [product.domain, product.name, product.version, product.variantName].filter(Boolean).join('/');
}

function buildRootServiceLineage(config: Config): string {
  return `1|${getServiceName(config)}|${new Date().toISOString()}`;
}

function getLastServiceLineagePath(lineage: string): string {
  const lastEntry = lineage.split(',').map((entry) => entry.trim()).filter(Boolean).pop();
  return lastEntry?.split('|')[0] || '1';
}


export function mspAuthMiddleware(
  config?: Partial<Config>,
  inboundRequestAuthPolicy?: InboundRequestAuthPolicy,
) {
 
  return async function (req: any, res: any, next: any) {
      
   if (!config) {
    config = getConfig();
  }
  console.log(`SVR: doing auth middleware invoked for ${config.myUrl}`);
  const authHeader = req.headers[HEADER_AUTHORIZATION];
  const bearerToken = authHeader?.replace('Bearer ', '');
  
  try {
    // Create new context for this request
    await runWithContext(
      {
        requestId: req.id,
        timestamp: Date.now(),
        assertionStore: {},
        metadataStore: {},
      },
      async () => {
        const jwtValidation = config!.jwtValidation ?? {
          trustedIssuers: [`https://login.microsoftonline.com/${config!.clientCredentials?.tenantId}/v2.0`],
            audience: ['api://default'],
          clockTolerance: 300,
          maxTokenAge: 3600, // Default to Azure AD, can be overridden by config
        };

        if (bearerToken) {
            await validateAndStoreAccessToken(bearerToken, jwtValidation, HEADER_AUTH_ACCESS_PRIMARY);
            await validateAndStoreClaimToken(
              HEADER_AUTH_ACCESS_PRIMARY,
              HEADER_AUTH_ACCESS_PRIMARY,
              bearerToken,
              jwtValidation,
            );
        } else {
            // Guest/no bearer requests are allowed and enforced by service policy.
        }

        const correlationId = String(
            req.headers[HEADER_CORRELATION_ID] || req.id || '',
        ).trim();
        if (correlationId) {
          setRequestContext({ correlationId });
            setMetadataStoreEntry(HEADER_CORRELATION_ID, correlationId);
        }

        const incomingServiceLineage = String(
            req.headers[HEADER_SERVICE_LINEAGE] || '',
        ).trim();
        const serviceLineage = incomingServiceLineage || buildRootServiceLineage(config as Config);
        setRequestContext({
          serviceLineage,
          serviceLineageCurrentPath: getLastServiceLineagePath(serviceLineage),
          serviceLineageChildCounter: 0,
        });
          setMetadataStoreEntry(HEADER_SERVICE_LINEAGE, serviceLineage);

        for (const [rawHeaderName, rawHeaderValue] of Object.entries(req.headers)) {
            const headerName = canonicalHeaderName(rawHeaderName);
            if (!isAssertionHeaderName(headerName)) {
            continue;
          }

          const headerValue = Array.isArray(rawHeaderValue) ? rawHeaderValue[0] : rawHeaderValue;
          const token = String(headerValue || '').replace(/^Bearer\s+/i, '').trim();
          if (!token) {
            continue;
          }

            if (headerName === HEADER_AUTH_ACCESS_PRIMARY && bearerToken && token === bearerToken) {
              continue;
            }

            if (inferAssertionTypeFromHeaderName(headerName) === 'access') {
              await validateAndStoreAccessToken(token, jwtValidation, headerName);
            }

            await validateAndStoreClaimToken(headerName, headerName, token, jwtValidation);
        }

        if (inboundRequestAuthPolicy) {
          const policyResult = normalisePolicyResult(await inboundRequestAuthPolicy());
          if (policyResult.status >= 400 && policyResult.status < 500) {
            return res.status(policyResult.status).json({
              error: policyResult.message || 'Rejected by inbound request auth policy',
            });
          }
        }

        // Continue processing within this context
        next();
      }
    );
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}
}