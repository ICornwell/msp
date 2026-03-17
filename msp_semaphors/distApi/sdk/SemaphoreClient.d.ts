import type { AcquireSemaphoreResult, ReleaseSemaphoreResult, RenewSemaphoreResult, SemaphoreLease, ValidateSemaphoreResult } from '../domain/types.js';
type SemaphoreClientOptions = {
    baseUrl: string;
};
export declare class SemaphoreClient {
    private readonly options;
    constructor(options: SemaphoreClientOptions);
    acquire(name: string, holderId: string, ttlMs?: number): Promise<AcquireSemaphoreResult>;
    renew(leaseId: string, holderId: string, ttlMs?: number): Promise<RenewSemaphoreResult>;
    release(leaseId: string, holderId?: string): Promise<ReleaseSemaphoreResult>;
    validate(leaseId: string): Promise<ValidateSemaphoreResult>;
}
export declare function buildSemaphoreHeaders(lease: SemaphoreLease): Record<string, string>;
export {};
