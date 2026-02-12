
import { Request, Response, NextFunction } from 'express';
import { NotFoundError } from '../errors/app.error';

/**
 * 404 Not Found Handler
 */
export const notFoundHandler = (req: Request, res: Response, next: NextFunction) => {
    next(new NotFoundError(`Route not found: ${req.originalUrl}`));
};
