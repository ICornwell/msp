// app.ts
import express from 'express';
import cors from 'cors';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import apiRoutes from './routes.js';
// Express 5 natively supports async route handlers.
const app = express();
// CORS configuration
const corsOptions = {
    origin: process.env.CORS_ORIGIN || '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    preflightContinue: false,
    optionsSuccessStatus: 204,
    credentials: true,
    maxAge: 86400, // 24 hours
};
app.use(cors(corsOptions));
// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
// Cookie parsing
app.use(cookieParser());
// Compression
app.use(compression());
// Mount API routes
app.use('/api/v1', apiRoutes);
// Health check endpoint
app.get('/health', (_req, res) => {
    res.json({ status: 'ok', service: 'actorwork', timestamp: new Date().toISOString() });
});
// Error handler
app.use((err, _req, res, _next) => {
    console.error('Error:', err);
    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? err : undefined
    });
});
export default app;
//# sourceMappingURL=api.js.map