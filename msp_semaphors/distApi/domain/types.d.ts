export type SemaphoreLease = {
    leaseId: string;
    name: string;
    holderId: string;
    issuerEpoch: string;
    issuedAtMs: number;
    expiresAtMs: number;
};
export type AcquireSemaphoreRequest = {
    name: string;
    holderId: string;
    ttlMs?: number;
};
export type RenewSemaphoreRequest = {
    leaseId: string;
    holderId: string;
    ttlMs?: number;
};
export type ReleaseSemaphoreRequest = {
    leaseId: string;
    holderId?: string;
};
export type ValidateSemaphoreRequest = {
    leaseId: string;
};
export type AcquireSemaphoreResult = {
    ok: true;
    lease: SemaphoreLease;
} | {
    ok: false;
    reason: 'busy' | 'invalid-ttl';
};
export type RenewSemaphoreResult = {
    ok: true;
    lease: SemaphoreLease;
} | {
    ok: false;
    reason: 'not-found' | 'expired' | 'holder-mismatch' | 'invalid-ttl' | 'issuer-mismatch';
};
export type ReleaseSemaphoreResult = {
    ok: boolean;
    released: boolean;
};
export type ValidateSemaphoreResult = {
    ok: boolean;
    valid: boolean;
    reason?: 'not-found' | 'expired' | 'issuer-mismatch';
    lease?: SemaphoreLease;
};
export type SemaphoreSnapshot = {
    issuerEpoch: string;
    activeLeases: SemaphoreLease[];
};
