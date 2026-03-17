import type {
  AcquireSemaphoreRequest,
  AcquireSemaphoreResult,
  ReleaseSemaphoreRequest,
  ReleaseSemaphoreResult,
  RenewSemaphoreRequest,
  RenewSemaphoreResult,
  SemaphoreSnapshot,
  ValidateSemaphoreRequest,
  ValidateSemaphoreResult,
} from './types.js';

export interface SemaphoreProvider {
  getIssuerEpoch(): string;
  acquire(request: AcquireSemaphoreRequest): AcquireSemaphoreResult;
  renew(request: RenewSemaphoreRequest): RenewSemaphoreResult;
  release(request: ReleaseSemaphoreRequest): ReleaseSemaphoreResult;
  validate(request: ValidateSemaphoreRequest): ValidateSemaphoreResult;
  snapshot(): SemaphoreSnapshot;
}
