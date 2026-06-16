// app.ts
import express from 'express';
import { Express } from 'express';
// import cors from 'cors';
import compression from 'compression';
import cookieParser from 'cookie-parser';

import { getRoutes } from './routes.js';
import { ActivitySet, Config, ServiceActivity } from '../index.js';
import { InboundRequestAuthPolicy, mspAuthMiddleware } from '../als/authMiddleware.js';
import { SERVICE_TYPE } from './server.js';

// Express 5 natively supports async route handlers.
export function createApp(
  config: Partial<Config>,
  serviceType: SERVICE_TYPE,
  serviceActivities: ActivitySet | ServiceActivity[] | ServiceActivity,
  inboundRequestAuthPolicy?: InboundRequestAuthPolicy,
) {
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

  app.use(mspAuthMiddleware(config, inboundRequestAuthPolicy))

  // Mount API routes
  console.log(`Mounting API routes for service type: ${serviceType}`);
  app.use('/api/v1', getRoutes(serviceType, serviceActivities));

  // Health check endpoint
  console.log('Registering health check endpoint at /health');
  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', service: 'actorwork', timestamp: new Date().toISOString() });
  });

  // Error handler
  console.log('Registering error handler');
  app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error('Error:', err);
    res.status(err.status || 500).json({
      success: false,
      message: err.message || 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? err : undefined
    });
  });

  console.log('Express app created with configured middleware and routes');

  return app;
}
