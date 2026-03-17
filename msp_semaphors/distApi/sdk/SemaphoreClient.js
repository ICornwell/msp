export class SemaphoreClient {
    options;
    constructor(options) {
        this.options = options;
    }
    async acquire(name, holderId, ttlMs) {
        const response = await fetch(`${this.options.baseUrl}/api/v1/semaphores/acquire`, {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ name, holderId, ttlMs }),
        });
        return response.json();
    }
    async renew(leaseId, holderId, ttlMs) {
        const response = await fetch(`${this.options.baseUrl}/api/v1/semaphores/renew`, {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ leaseId, holderId, ttlMs }),
        });
        return response.json();
    }
    async release(leaseId, holderId) {
        const response = await fetch(`${this.options.baseUrl}/api/v1/semaphores/release`, {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ leaseId, holderId }),
        });
        return response.json();
    }
    async validate(leaseId) {
        const response = await fetch(`${this.options.baseUrl}/api/v1/semaphores/validate`, {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ leaseId }),
        });
        return response.json();
    }
}
export function buildSemaphoreHeaders(lease) {
    return {
        'x-msp-semaphore-lease-id': lease.leaseId,
        'x-msp-semaphore-name': lease.name,
        'x-msp-semaphore-holder-id': lease.holderId,
        'x-msp-semaphore-issuer-epoch': lease.issuerEpoch,
    };
}
//# sourceMappingURL=SemaphoreClient.js.map