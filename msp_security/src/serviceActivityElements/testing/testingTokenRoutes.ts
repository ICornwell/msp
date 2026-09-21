import { Router } from 'express';
import {
  getTestingIssuerConfig,
  getTestingJwks,
  issueTestingToken,
  type TestingTokenRequest,
} from './testingTokenIssuer.js';

export function getTestingTokenRouter(myUrl: string): Router {
  const router = Router();
  const config = getTestingIssuerConfig(myUrl);

  router.get('/.well-known/openid-configuration', (_req, res) => {
    res.json({
      issuer: config.issuer,
      token_endpoint: `${config.issuer}/token`,
      jwks_uri: `${config.issuer}/jwks.json`,
      grant_types_supported: ['urn:ietf:params:oauth:grant-type:token-exchange', 'client_credentials'],
      token_endpoint_auth_methods_supported: ['none'],
      scopes_supported: ['*'],
      claims_supported: ['iss', 'sub', 'aud', 'iat', 'exp', 'jti', 'scope', 'roles', 'permissions', 'tenant_id'],
      token_signing_alg_values_supported: ['RS256'],
    });
  });

  router.get('/jwks.json', (_req, res) => {
    try {
      res.json(getTestingJwks(config));
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      res.status(404).json({ error: message });
    }
  });

  router.post('/token', async (req, res) => {
    try {
      const body = req.body as TestingTokenRequest & {
        client_id?: string;
        audience?: string | string[];
      };
      const scope = body.scope;
      const audience = body.audience
        || (typeof scope === 'string' ? scope.replace(/\.default\b/g, '') : scope);
      const token = await issueTestingToken(config, {
        ...body,
        subject: body.subject || body.client_id,
        audience,
      });
      res.json(token);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const status = message.includes('disabled') ? 404 : 400;
      res.status(status).json({
        error: status === 404 ? 'invalid_request' : 'invalid_grant',
        error_description: message,
      });
    }
  });

  return router;
}
