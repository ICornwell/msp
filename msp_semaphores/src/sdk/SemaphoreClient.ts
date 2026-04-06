import type {
  AcquireSemaphoreResult,
  ReleaseSemaphoreResult,
  RenewSemaphoreResult,
  SemaphoreLease,
  ValidateSemaphoreResult,
} from '../domain/types.js';

type SemaphoreClientOptions = {
  baseUrl: string;
};

export class SemaphoreClient {
  constructor(private readonly options: SemaphoreClientOptions) {}

  async acquire(name: string, holderId: string, ttlMs?: number): Promise<AcquireSemaphoreResult> {
    const response = await fetch(`${this.options.baseUrl}/api/v1/semaphores/acquire`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name, holderId, ttlMs }),
    });
    return response.json() as Promise<AcquireSemaphoreResult>;
  }

  async renew(leaseId: string, holderId: string, ttlMs?: number): Promise<RenewSemaphoreResult> {
    const response = await fetch(`${this.options.baseUrl}/api/v1/semaphores/renew`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ leaseId, holderId, ttlMs }),
    });
    return response.json() as Promise<RenewSemaphoreResult>;
  }

  async release(leaseId: string, holderId?: string): Promise<ReleaseSemaphoreResult> {
    const response = await fetch(`${this.options.baseUrl}/api/v1/semaphores/release`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ leaseId, holderId }),
    });
    return response.json() as Promise<ReleaseSemaphoreResult>;
  }

  async validate(leaseId: string): Promise<ValidateSemaphoreResult> {
    const response = await fetch(`${this.options.baseUrl}/api/v1/semaphores/validate`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ leaseId }),
    });
    return response.json() as Promise<ValidateSemaphoreResult>;
  }
}

export function buildSemaphoreHeaders(lease: SemaphoreLease): Record<string, string> {
  return {
    'x-msp-semaphore-lease-id': lease.leaseId,
    'x-msp-semaphore-name': lease.name,
    'x-msp-semaphore-holder-id': lease.holderId,
    'x-msp-semaphore-issuer-epoch': lease.issuerEpoch,
  };
}
