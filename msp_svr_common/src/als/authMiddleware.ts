import { validateAndStoreAccessToken, validateAndStoreIdToken } from './jwtTokens.js';
import { runWithContext } from './context.js';
import { Config } from '../sharedconfig.js';
import { getConfig } from '../configuredCommon.js';


export function mspAuthMiddleware(config?: Partial<Config>) {
 
  return async function (req: any, res: any, next: any) {
   if (!config) {
    config = getConfig();
  }
  const authHeader = req.headers.authorization;
  const idTokenHeader = req.headers['x-msp-id-token'];
  const bearerToken = authHeader?.replace('Bearer ', '');
  
  try {
    // Create new context for this request
    await runWithContext(
      { requestId: req.id, timestamp: Date.now(), work: [] }, // Initial context with request metadata
      async () => {
        const jwtValidation = config!.jwtValidation ?? {
          trustedIssuers: [`https://login.microsoftonline.com/${config!.clientCredentials?.tenantId}/v2.0`],
          audience: 'api://default',
          clockTolerance: 300,
          maxTokenAge: 3600, // Default to Azure AD, can be overridden by config
        };

        if (bearerToken) {
          try {
            await validateAndStoreIdToken(bearerToken, jwtValidation);
          } catch {
            await validateAndStoreAccessToken(bearerToken, jwtValidation);
          }
        }

        if (typeof idTokenHeader === 'string' && idTokenHeader.trim().length > 0) {
          const forwardedIdToken = idTokenHeader.replace('Bearer ', '');
          await validateAndStoreIdToken(forwardedIdToken, jwtValidation);
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