
import { Request, Response, NextFunction } from 'express';

declare global {
    namespace Express {
        interface Request {
            pagination: {
                page: number;
                limit: number;
                skip: number;
                sortBy: string;
                sortOrder: 'asc' | 'desc';
            };
        }
    }
}

export const paginationMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const sortBy = (req.query.sortBy as string) || 'createdAt';
    const sortOrder = (req.query.sortOrder as string) === 'asc' ? 'asc' : 'desc';

    const skip = (page - 1) * limit;

    req.pagination = {
        page,
        limit,
        skip,
        sortBy,
        sortOrder
    };

    next();
};
