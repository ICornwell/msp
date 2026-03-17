import { v4 as uuid } from 'uuid';
import { SemaphoreClient } from './SemaphoreClient.js';
export function createSemaphoreMiddleware(options) {
    const client = new SemaphoreClient({ baseUrl: options.semaphoreBaseUrl });
    const holderIdHeader = options.holderIdHeader ?? 'x-request-id';
    return async function semaphoreMiddleware(req, res, next) {
        const holderFromHeader = req.headers[holderIdHeader] || req.headers[holderIdHeader.toLowerCase()];
        const holderId = Array.isArray(holderFromHeader) ? holderFromHeader[0] : holderFromHeader || uuid();
        const acquire = await client.acquire(options.semaphoreName, holderId, options.ttlMs);
        if (!acquire.ok) {
            res.status(423).json({
                success: false,
                message: `Semaphore busy for '${options.semaphoreName}'`,
                reason: acquire.reason,
            });
            return;
        }
        const release = async () => {
            await client.release(acquire.lease.leaseId, holderId);
        };
        res.on('finish', release);
        res.on('close', release);
        next();
    };
}
//# sourceMappingURL=createSemaphoreMiddleware.js.map