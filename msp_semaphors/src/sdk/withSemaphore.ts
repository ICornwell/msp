import { v4 as uuid } from 'uuid';
import type { SemaphoreLease } from '../domain/types.js';
import { SemaphoreClient } from './SemaphoreClient.js';

type WithSemaphoreOptions = {
  semaphoreName: string;
  ttlMs?: number;
  holderId?: string;
  semaphoreBaseUrl: string;
};

export async function withSemaphore<T>(
  options: WithSemaphoreOptions,
  fn: (lease: SemaphoreLease) => Promise<T>
): Promise<T> {
  const holderId = options.holderId ?? uuid();
  const client = new SemaphoreClient({ baseUrl: options.semaphoreBaseUrl });

  const acquire = await client.acquire(options.semaphoreName, holderId, options.ttlMs);
  if (!acquire.ok) {
    throw new Error(`Failed to acquire semaphore '${options.semaphoreName}': ${acquire.reason}`);
  }

  try {
    return await fn(acquire.lease);
  } finally {
    await client.release(acquire.lease.leaseId, holderId);
  }
}
