// app.ts
import express from 'express';
import { Express } from 'express';
// import cors from 'cors';
import compression from 'compression';
import cookieParser from 'cookie-parser';

import { getRoutes } from './routes.js';
import { ActivitySet, Config, ServiceActivity } from '../index.js';
import { mspAuthMiddleware } from '../als/authMiddleware.js';

// Express 5 natively supports async route handlers.
export function createApp(config: Partial<Config>, serviceActivities: ActivitySet | ServiceActivity[] | ServiceActivity) {
  const app: Express = express();

  /* // CORS configuration
  const corsOptions = {
    origin: process.env.CORS_ORIGIN || '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    preflightContinue: false,
    optionsSuccessStatus: 204,
    credentials: true,
    maxAge: 86400, // 24 hours
  };
  
  app.use(cors(corsOptions)); */

  // Body parsing
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Cookie parsing
  app.use(cookieParser());

  // Compression
  app.use(compression());

  app.use(mspAuthMiddleware(config))

  // Mount API routes
  app.use('/api/v1', getRoutes(serviceActivities));

  // Health check endpoint
  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', service: 'actorwork', timestamp: new Date().toISOString() });
  });

  // Error handler
  app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error('Error:', err);
    res.status(err.status || 500).json({
      success: false,
      message: err.message || 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? err : undefined
    });
  });

  return app;
}
