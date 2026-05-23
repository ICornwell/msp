import { validateAndStoreIdToken } from './jwtTokens.js';
import { runWithContext } from './context.js';
import { Config } from '../sharedconfig.js';


export function mspAuthMiddleware(config: Partial<Config>) {
  return async function (req: any, res: any, next: any) {
  
  const authHeader = req.headers.authorization;
  let token = authHeader?.replace('Bearer ', '');
  
  if (!token) {
    token = "!GuestToken!";
  }
  
  try {
    // Create new context for this request
    await runWithContext(
      { requestId: req.id, timestamp: Date.now(), work: [] }, // Initial context with request metadata
      async () => {
        // Validate and store in ALS
        await validateAndStoreIdToken(token, config.jwtValidation ?? {
          trustedIssuers: [`https://login.microsoftonline.com/${config.clientCredentials?.tenantId}/v2.0`],
          audience: 'api://default',
          clockTolerance: 300,
          maxTokenAge: 3600 // Default to Azure AD, can be overridden by config
        });
        
        // Continue processing within this context
        next();
      }
    );
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}
}