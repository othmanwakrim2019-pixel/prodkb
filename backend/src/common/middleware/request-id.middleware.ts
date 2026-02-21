
import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';
import { requestContextStorage, RequestContext } from '../utils/request-context';

/**
 * Request ID Middleware — generates a unique correlation ID for each request
 * and seeds AsyncLocalStorage so every downstream log line includes the requestId.
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

    // Seed AsyncLocalStorage context for the entire request lifecycle
    const context: RequestContext = {
        requestId: id,
        method: req.method,
        path: req.originalUrl || req.path,
    };

    requestContextStorage.run(context, () => {
        (req as any)._requestContext = context;
        next();
    });
};

