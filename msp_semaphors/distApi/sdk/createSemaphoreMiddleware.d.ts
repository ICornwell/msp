import type { NextFunction, Request, Response } from 'express';
type CreateSemaphoreMiddlewareOptions = {
    semaphoreBaseUrl: string;
    semaphoreName: string;
    ttlMs?: number;
    holderIdHeader?: string;
};
export declare function createSemaphoreMiddleware(options: CreateSemaphoreMiddlewareOptions): (req: Request, res: Response, next: NextFunction) => Promise<void>;
export {};
