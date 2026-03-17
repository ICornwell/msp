import { Router } from 'express';
import type { SemaphoreProvider } from '../../domain/SemaphoreProvider.js';
export declare function createSemaphoreRouter(provider: SemaphoreProvider): Router;
