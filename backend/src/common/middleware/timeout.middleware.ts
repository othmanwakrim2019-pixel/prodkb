
import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

/**
 * Request Timeout Middleware
 * Prevents slow DB queries or external calls from blocking the event loop indefinitely.
 * Returns 408 Request Timeout if the request exceeds the configured duration.
 */

export const requestTimeout = (timeoutMs: number = 30000) => {
    return (req: Request, res: Response, next: NextFunction) => {
        const timer = setTimeout(() => {
            if (!res.headersSent) {
                logger.warn('Request timeout', {
                    method: req.method,
                    path: req.path,
                    timeoutMs,
                    requestId: (req as any).requestId,
                });
                res.status(408).json({
                    success: false,
                    message: 'Request Timeout',
                    error: { code: 'REQUEST_TIMEOUT' },
                });
            }
        }, timeoutMs);

        // Clear timeout when response finishes
        res.on('finish', () => clearTimeout(timer));
        res.on('close', () => clearTimeout(timer));

        next();
    };
};
