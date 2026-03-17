import type { NextFunction, Request, Response } from 'express';
import { v4 as uuid } from 'uuid';
import { SemaphoreClient } from './SemaphoreClient.js';

type CreateSemaphoreMiddlewareOptions = {
  semaphoreBaseUrl: string;
  semaphoreName: string;
  ttlMs?: number;
  holderIdHeader?: string;
};

export function createSemaphoreMiddleware(options: CreateSemaphoreMiddlewareOptions) {
  const client = new SemaphoreClient({ baseUrl: options.semaphoreBaseUrl });
  const holderIdHeader = options.holderIdHeader ?? 'x-request-id';

  return async function semaphoreMiddleware(req: Request, res: Response, next: NextFunction) {
    const holderFromHeader = req.headers[holderIdHeader] || req.headers[holderIdHeader.toLowerCase()];
    const holderId = Array.isArray(holderFromHeader) ? holderFromHeader[0] : holderFromHeader || uuid();

    const acquire = await client.acquire(options.semaphoreName, holderId, options.ttlMs);
    if (!acquire.ok) {
      res.status(423).json({
        success: false,
        message: `Semaphore busy for '${options.semaphoreName}'`,
        reason: acquire.reason,
      });
      return;
    }

    const release = async () => {
      await client.release(acquire.lease.leaseId, holderId);
    };

    res.on('finish', release);
    res.on('close', release);

    next();
  };
}
