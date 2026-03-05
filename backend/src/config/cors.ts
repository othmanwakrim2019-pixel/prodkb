/**
 * CORS Configuration
 *
 * Produces the cors() middleware options.
 * Production: uses CORS_ORIGINS env var (comma-separated allowlist).
 * Development: falls back to localhost origins.
 *
 * @module config/cors
 */

import cors from 'cors';
import { env } from './env';
import { logger } from '../common/utils/logger';

const isProduction = process.env.NODE_ENV === 'production';

const allowedOrigins: string[] = process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(',').map(o => o.trim())
    : isProduction
        ? [env.FRONTEND_URL || '']
        : [
            env.FRONTEND_URL || 'http://localhost:5173',
            'http://localhost:8080',
            'http://localhost:3000',
            'http://127.0.0.1:3000',
        ];

logger.info(`CORS Allowed Origins: ${allowedOrigins.join(', ')}`);

export { allowedOrigins };

export const corsMiddleware = cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (mobile apps, curl, health checks)
        if (!origin) return callback(null, true);

        if (allowedOrigins.indexOf(origin) === -1) {
            logger.warn(`Blocked by CORS: ${origin}`);
            const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
            return callback(new Error(msg), false);
        }
        return callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-CSRF-Token'],
});
