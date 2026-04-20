
import { Request, Response, NextFunction } from 'express';
import { ZodError, ZodTypeAny } from 'zod';
import { createResponse } from '../types/api.response';

/**
 * Middleware to validate request body using Zod schema
 */
export const validateRequest = (schema: ZodTypeAny) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            await schema.parseAsync(req.body);
            next();
        } catch (error) {
            if (error instanceof ZodError) {
                return res.status(400).json(
                    createResponse(false, null, 'Validation failed', {
                        code: 'VALIDATION_ERROR',
                        details: error.issues.map(e => ({
                            path: e.path.join('.'),
                            message: e.message
                        }))
                    })
                );
            }
            next(error);
        }
    };
};
