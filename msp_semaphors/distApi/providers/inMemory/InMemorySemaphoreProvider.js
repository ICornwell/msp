import { v4 as uuid } from 'uuid';
export class InMemorySemaphoreProvider {
    issuerEpoch = uuid();
    leaseByName = new Map();
    leaseById = new Map();
    defaultTtlMs;
    warnLongTtlMs;
    maxTtlMs;
    constructor(options) {
        this.defaultTtlMs = options?.defaultTtlMs ?? 5000;
        this.warnLongTtlMs = options?.warnLongTtlMs ?? 30000;
        this.maxTtlMs = options?.maxTtlMs ?? 300000;
    }
    getIssuerEpoch() {
        return this.issuerEpoch;
    }
    acquire(request) {
        this.cleanupExpired();
        const ttlMs = this.resolveTtl(request.ttlMs);
        if (!ttlMs)
            return { ok: false, reason: 'invalid-ttl' };
        const existing = this.leaseByName.get(request.name);
        if (existing) {
            return { ok: false, reason: 'busy' };
        }
        const now = Date.now();
        const lease = {
            leaseId: uuid(),
            name: request.name,
            holderId: request.holderId,
            issuerEpoch: this.issuerEpoch,
            issuedAtMs: now,
            expiresAtMs: now + ttlMs,
        };
        this.leaseByName.set(lease.name, lease);
        this.leaseById.set(lease.leaseId, lease);
        return { ok: true, lease };
    }
    renew(request) {
        this.cleanupExpired();
        const existing = this.leaseById.get(request.leaseId);
        if (!existing)
            return { ok: false, reason: 'not-found' };
        if (existing.issuerEpoch !== this.issuerEpoch)
            return { ok: false, reason: 'issuer-mismatch' };
        if (Date.now() > existing.expiresAtMs) {
            this.deleteLease(existing);
            return { ok: false, reason: 'expired' };
        }
        if (existing.holderId !== request.holderId)
            return { ok: false, reason: 'holder-mismatch' };
        const ttlMs = this.resolveTtl(request.ttlMs);
        if (!ttlMs)
            return { ok: false, reason: 'invalid-ttl' };
        const renewed = {
            ...existing,
            expiresAtMs: Date.now() + ttlMs,
        };
        this.leaseById.set(renewed.leaseId, renewed);
        this.leaseByName.set(renewed.name, renewed);
        return { ok: true, lease: renewed };
    }
    release(request) {
        const existing = this.leaseById.get(request.leaseId);
        if (!existing)
            return { ok: true, released: false };
        if (request.holderId && existing.holderId !== request.holderId) {
            return { ok: false, released: false };
        }
        this.deleteLease(existing);
        return { ok: true, released: true };
    }
    validate(request) {
        const existing = this.leaseById.get(request.leaseId);
        if (!existing)
            return { ok: true, valid: false, reason: 'not-found' };
        if (existing.issuerEpoch !== this.issuerEpoch)
            return { ok: true, valid: false, reason: 'issuer-mismatch' };
        if (Date.now() > existing.expiresAtMs) {
            this.deleteLease(existing);
            return { ok: true, valid: false, reason: 'expired' };
        }
        return { ok: true, valid: true, lease: existing };
    }
    snapshot() {
        this.cleanupExpired();
        return {
            issuerEpoch: this.issuerEpoch,
            activeLeases: [...this.leaseById.values()],
        };
    }
    resolveTtl(requestedTtlMs) {
        const ttlMs = requestedTtlMs ?? this.defaultTtlMs;
        if (!Number.isFinite(ttlMs) || ttlMs <= 0 || ttlMs > this.maxTtlMs) {
            return null;
        }
        if (ttlMs > this.warnLongTtlMs) {
            console.warn(`[msp_semaphors] Long TTL requested: ${ttlMs}ms`);
        }
        return Math.floor(ttlMs);
    }
    cleanupExpired() {
        const now = Date.now();
        for (const lease of this.leaseById.values()) {
            if (lease.expiresAtMs <= now) {
                this.deleteLease(lease);
            }
        }
    }
    deleteLease(lease) {
        this.leaseById.delete(lease.leaseId);
        const currentByName = this.leaseByName.get(lease.name);
        if (currentByName?.leaseId === lease.leaseId) {
            this.leaseByName.delete(lease.name);
        }
    }
}
//# sourceMappingURL=InMemorySemaphoreProvider.js.map