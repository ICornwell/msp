
import { Router } from 'express';
import { DiscoveryProvider } from './discoveryProvider.js';

export function getDiscoveryRouter(provider: DiscoveryProvider): Router {
  const router = Router();

  router.get('/health', (_req, res) => {
    res.json({ ok: true, message: 'Discovery service is healthy' });
  });

  router.get('/.well-known/openid-configuration', async (_req, res) => {
    const result = await provider.getWellKnownConfig();
    res.json(result);
  });

  router.get('/jwks.json', async (_req, res) => {
    const result = await provider.getJwksJson();
    res.json(result);
  });

  // Compatibility alias for deployments expecting /discovery/.well-known/jwks.json
  router.get('/.well-known/jwks.json', async (_req, res) => {
    const result = await provider.getJwksJson();
    res.json(result);
  });

  // Public encryption key — used by UI/BFF to encrypt secrets before sending to vault
  router.get('/encryption-public-key', async (_req, res) => {
    const key = await provider.getEncryptionPublicKey();
    if (!key) {
      res.status(404).json({ error: 'No encryption public key configured' });
      return;
    }
    res.json(key);
  });

  return router;
}
