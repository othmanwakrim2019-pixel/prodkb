import express from 'express';
import { logger } from './utils/logger';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env';
import authRoutes from './routes/authRoutes';
import apiRoutes from './routes/apiRoutes';
import swaggerUi from 'swagger-ui-express';
import yaml from 'yamljs';
import path from 'path';
import { apiLimiter, authLimiter } from './middleware/rateLimiter';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';

const app = express();

// CORS configuration - MUST be first
const allowedOrigins = [
    env.FRONTEND_URL || 'http://localhost:5173',
    'http://localhost:3000', // Swagger UI
    'http://127.0.0.1:3000'
];

app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);

        logger.info(`Checking origin: ${origin}`);

        if (allowedOrigins.indexOf(origin) === -1) {
            logger.warn(`Blocked by CORS: ${origin}`);
            const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
            return callback(new Error(msg), false);
        }
        return callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Security headers with Helmet.js
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"],
        },
    },
    hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true,
    },
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// Security headers
app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    next();
});

app.use(express.json({ limit: '10mb' }));

// Health check (no rate limiting)
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Auth routes with strict rate limiting
app.use('/auth', authLimiter, authRoutes);

// API routes with general rate limiting
app.use('/api', apiLimiter, apiRoutes);

// Swagger Documentation
const swaggerDocument = yaml.load(path.join(__dirname, 'openapi.yaml'));
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// 404 handler
app.use(notFoundHandler);

// Error handler
app.use(errorHandler);

const PORT = env.PORT || 3000;

export { app };

if (require.main === module) {
    app.listen(PORT, () => {
        logger.info(` ProdKB server running on port ${PORT}`);
        logger.info(` Email notifications: ${process.env.SMTP_HOST ? 'Enabled' : 'Disabled'}`);
        logger.info(' Rate limiting: Enabled');
    });
}
