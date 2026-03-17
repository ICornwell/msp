import type { SemaphoreProvider } from '../../domain/SemaphoreProvider.js';
import type { AcquireSemaphoreRequest, AcquireSemaphoreResult, ReleaseSemaphoreRequest, ReleaseSemaphoreResult, RenewSemaphoreRequest, RenewSemaphoreResult, SemaphoreSnapshot, ValidateSemaphoreRequest, ValidateSemaphoreResult } from '../../domain/types.js';
type InMemorySemaphoreProviderOptions = {
    defaultTtlMs?: number;
    warnLongTtlMs?: number;
    maxTtlMs?: number;
};
export declare class InMemorySemaphoreProvider implements SemaphoreProvider {
    private readonly issuerEpoch;
    private readonly leaseByName;
    private readonly leaseById;
    private readonly defaultTtlMs;
    private readonly warnLongTtlMs;
    private readonly maxTtlMs;
    constructor(options?: InMemorySemaphoreProviderOptions);
    getIssuerEpoch(): string;
    acquire(request: AcquireSemaphoreRequest): AcquireSemaphoreResult;
    renew(request: RenewSemaphoreRequest): RenewSemaphoreResult;
    release(request: ReleaseSemaphoreRequest): ReleaseSemaphoreResult;
    validate(request: ValidateSemaphoreRequest): ValidateSemaphoreResult;
    snapshot(): SemaphoreSnapshot;
    private resolveTtl;
    private cleanupExpired;
    private deleteLease;
}
export {};
