
import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import { AppError } from '../errors/app.error';
import { createResponse } from '../types/api.response';
import { logger } from '../../common/utils/logger';

export const errorHandler = (
    err: Error,
    req: Request,
    res: Response,
    next: NextFunction
) => {
    // Default to 500 Internal Server Error
    let statusCode = 500;
    let message = 'Internal Server Error';
    let code = 'INTERNAL_ERROR';
    let details: any = undefined;

    // AppError (Known operational errors)
    if (err instanceof AppError) {
        statusCode = err.statusCode;
        message = err.message;
        code = err.code || 'APP_ERROR';
    }
    // Zod Validation Errors
    else if (err instanceof ZodError) {
        statusCode = 400;
        message = 'Validation Error';
        code = 'VALIDATION_ERROR';
        details = err.issues;
    }
    // Prisma Errors
    else if (err instanceof Prisma.PrismaClientKnownRequestError) {
        if (err.code === 'P2002') {
            statusCode = 409;
            message = 'Duplicate entry';
            code = 'DUPLICATE_ENTRY';
        } else if (err.code === 'P2025') {
            statusCode = 404;
            message = 'Record not found';
            code = 'NOT_FOUND';
        } else {
            statusCode = 400;
            message = 'Database Error';
            code = 'DB_ERROR';
            details = err.code;
        }
    }
    // JsonWebTokenError
    else if (err.name === 'JsonWebTokenError') {
        statusCode = 401;
        message = 'Invalid token';
        code = 'INVALID_TOKEN';
    }
    else if (err.name === 'TokenExpiredError') {
        statusCode = 401;
        message = 'Token expired';
        code = 'TOKEN_EXPIRED';
    }

    // Log unexpected errors
    if (statusCode === 500) {
        logger.error('Unexpected Error:', err);
    }

    res.status(statusCode).json(createResponse(false, null, message, { code, details }));
};
