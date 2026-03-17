import type { SemaphoreLease } from '../domain/types.js';
type WithSemaphoreOptions = {
    semaphoreName: string;
    ttlMs?: number;
    holderId?: string;
    semaphoreBaseUrl: string;
};
export declare function withSemaphore<T>(options: WithSemaphoreOptions, fn: (lease: SemaphoreLease) => Promise<T>): Promise<T>;
export {};
