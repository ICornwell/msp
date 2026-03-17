import { v4 as uuid } from 'uuid';
import { SemaphoreClient } from './SemaphoreClient.js';
export async function withSemaphore(options, fn) {
    const holderId = options.holderId ?? uuid();
    const client = new SemaphoreClient({ baseUrl: options.semaphoreBaseUrl });
    const acquire = await client.acquire(options.semaphoreName, holderId, options.ttlMs);
    if (!acquire.ok) {
        throw new Error(`Failed to acquire semaphore '${options.semaphoreName}': ${acquire.reason}`);
    }
    try {
        return await fn(acquire.lease);
    }
    finally {
        await client.release(acquire.lease.leaseId, holderId);
    }
}
//# sourceMappingURL=withSemaphore.js.map