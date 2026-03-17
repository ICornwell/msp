import { Router } from 'express';
export function createSemaphoreRouter(provider) {
    const router = Router();
    router.get('/health', (_req, res) => {
        res.json({ ok: true, issuerEpoch: provider.getIssuerEpoch() });
    });
    router.get('/debug/snapshot', (_req, res) => {
        res.json(provider.snapshot());
    });
    router.post('/acquire', (req, res) => {
        const body = req.body;
        const result = provider.acquire(body);
        if (!result.ok) {
            const status = result.reason === 'busy' ? 423 : 400;
            res.status(status).json(result);
            return;
        }
        res.json(result);
    });
    router.post('/renew', (req, res) => {
        const body = req.body;
        const result = provider.renew(body);
        if (!result.ok) {
            const status = result.reason === 'not-found' ? 404 : 409;
            res.status(status).json(result);
            return;
        }
        res.json(result);
    });
    router.post('/release', (req, res) => {
        const body = req.body;
        const result = provider.release(body);
        if (!result.ok) {
            res.status(409).json(result);
            return;
        }
        res.json(result);
    });
    router.post('/validate', (req, res) => {
        const body = req.body;
        const result = provider.validate(body);
        res.json(result);
    });
    return router;
}
//# sourceMappingURL=semaphores.js.map