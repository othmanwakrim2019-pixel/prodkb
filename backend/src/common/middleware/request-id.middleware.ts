
import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';

/**
 * Request ID Middleware
 * Generates a unique correlation ID for each request, enabling log tracing
 * across audit logs, error logs, and downstream services.
 */

declare global {
    namespace Express {
        interface Request {
            requestId: string;
        }
    }
}

export const requestIdMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const id = (req.headers['x-request-id'] as string) || randomUUID();
    req.requestId = id;
    res.setHeader('X-Request-Id', id);
    next();
};
