import { validateAndStoreAccessToken, validateAndStoreClaimToken } from './jwtTokens.js';
import { runWithContext, setClaimStoreEntry, setRequestContext } from './context.js';
import { Config } from '../sharedconfig.js';
import { getConfig } from '../configuredCommon.js';

const CLAIM_HEADER_PATTERN = /^msp-x-([a-z0-9]+)-([a-z0-9]+)-claim$/i;

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


export function mspAuthMiddleware(config?: Partial<Config>) {
 
  return async function (req: any, res: any, next: any) {
      
   if (!config) {
    config = getConfig();
  }
  console.log(`SVR: doing auth middleware invoked for ${config.myUrl}`);
  const authHeader = req.headers.authorization;
  const bearerToken = authHeader?.replace('Bearer ', '');
  
  try {
    // Create new context for this request
    await runWithContext(
      { requestId: req.id, timestamp: Date.now(), work: [], claimStore: {} },
      async () => {
        const jwtValidation = config!.jwtValidation ?? {
          trustedIssuers: [`https://login.microsoftonline.com/${config!.clientCredentials?.tenantId}/v2.0`],
          audience: ['api://default'],
          clockTolerance: 300,
          maxTokenAge: 3600, // Default to Azure AD, can be overridden by config
        };

        if (bearerToken) {
          console.log('SVR: validating bearer token as access token');
          await validateAndStoreAccessToken(bearerToken, jwtValidation);
        } else {
          console.log('SVR: no bearer token provided - defaulting to guest access with limited permissions');
        }

        const correlationId = String(
          req.headers['msp-x-correlation-id'] || req.headers['msp-correlation-id'] || req.id || '',
        ).trim();
        if (correlationId) {
          setRequestContext({ correlationId });
          setClaimStoreEntry('correlation-id', {
            name: 'correlation-id',
            headerName: 'MSP-X-CORRELATION-ID',
            kind: 'meta',
            value: correlationId,
          });
        }

        const incomingServiceLineage = String(
          req.headers['msp-x-service-lc'] || req.headers['msp-service-lc'] || '',
        ).trim();
        const serviceLineage = incomingServiceLineage || buildRootServiceLineage(config as Config);
        setRequestContext({
          serviceLineage,
          serviceLineageCurrentPath: getLastServiceLineagePath(serviceLineage),
          serviceLineageChildCounter: 0,
        });
        setClaimStoreEntry('service-lc', {
          name: 'service-lc',
          headerName: 'MSP-X-SERVICE-LC',
          kind: 'meta',
          value: serviceLineage,
        });

        for (const [rawHeaderName, rawHeaderValue] of Object.entries(req.headers)) {
          const headerName = String(rawHeaderName);
          const match = headerName.match(CLAIM_HEADER_PATTERN);
          if (!match) {
            continue;
          }

          const headerValue = Array.isArray(rawHeaderValue) ? rawHeaderValue[0] : rawHeaderValue;
          const token = String(headerValue || '').replace(/^Bearer\s+/i, '').trim();
          if (!token) {
            continue;
          }

          const claimName = `${match[1].toLowerCase()}-${match[2].toLowerCase()}`;
          await validateAndStoreClaimToken(claimName, headerName, token, jwtValidation);
        }

        console.log('SVR: proceeding with request');
        // Continue processing within this context
        next();
      }
    );
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}
}