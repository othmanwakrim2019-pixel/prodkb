import type { NextFunction, Request, Response } from 'express';
import type { ZodSchema } from 'zod';

export const validateRequest = (schema: ZodSchema) => (
    req: Request,
    _res: Response,
    next: NextFunction
) => {
    try {
        req.body = schema.parse(req.body);
        next();
    } catch (error) {
        next(error);
    }
};
