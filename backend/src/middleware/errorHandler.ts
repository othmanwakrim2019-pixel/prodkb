/**
 * Centralized error handling middleware
 * Standardizes error responses across the application
 * @module middleware/errorHandler
 */

import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { AppError, ValidationError } from '../errors/AppError';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';

/**
 * Standard error response format
 */
interface ErrorResponse {
    error: string;
    code: string;
    statusCode: number;
    details?: Record<string, string[]>;
    timestamp: string;
    path: string;
}

/**
 * Global error handler middleware
 * Catches all errors and returns standardized responses
 */
export function errorHandler(
    err: Error,
    req: Request,
    res: Response,
    _next: NextFunction
): void {
    // Default error values
    let statusCode = 500;
    let code = 'INTERNAL_ERROR';
    let message = 'An unexpected error occurred';
    let details: Record<string, string[]> | undefined;

    // Handle AppError (our custom errors)
    if (err instanceof AppError) {
        statusCode = err.statusCode;
        code = err.code;
        message = err.message;

        if (err instanceof ValidationError && err.details) {
            details = err.details;
        }

        // Log based on severity
        if (statusCode >= 500) {
            logger.error('Server error', {
                error: message,
                code,
                path: req.path,
                method: req.method,
                stack: err.stack,
            });
        } else {
            logger.warn('Client error', {
                error: message,
                code,
                path: req.path,
                method: req.method,
            });
        }
    }
    // Handle Zod validation errors
    else if (err instanceof ZodError) {
        statusCode = 400;
        code = 'VALIDATION_ERROR';
        message = 'Validation failed';
        details = {};

        for (const issue of err.issues) {
            const field = issue.path.join('.');
            if (!details[field]) {
                details[field] = [];
            }
            details[field].push(issue.message);
        }

        logger.warn('Validation error', {
            path: req.path,
            method: req.method,
            errors: details,
        });
    }
    // Handle Prisma errors
    else if (err instanceof Prisma.PrismaClientKnownRequestError) {
        switch (err.code) {
            case 'P2002': // Unique constraint violation
                statusCode = 409;
                code = 'CONFLICT';
                message = 'Resource already exists';
                break;
            case 'P2025': // Record not found
                statusCode = 404;
                code = 'NOT_FOUND';
                message = 'Resource not found';
                break;
            case 'P2003': // Foreign key constraint violation
                statusCode = 400;
                code = 'VALIDATION_ERROR';
                message = 'Invalid reference';
                break;
            default:
                logger.error('Prisma error', {
                    code: err.code,
                    message: err.message,
                    path: req.path,
                });
        }
    }
    // Handle JWT errors
    else if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
        statusCode = 401;
        code = 'AUTHENTICATION_ERROR';
        message = err.name === 'TokenExpiredError' ? 'Token expired' : 'Invalid token';

        logger.warn('JWT error', {
            error: err.name,
            path: req.path,
        });
    }
    // Handle other errors
    else {
        logger.error('Unhandled error', {
            error: err.message,
            name: err.name,
            stack: err.stack,
            path: req.path,
            method: req.method,
        });
    }

    // Build response
    const errorResponse: ErrorResponse = {
        error: message,
        code,
        statusCode,
        timestamp: new Date().toISOString(),
        path: req.path,
    };

    if (details) {
        errorResponse.details = details;
    }

    // Send response
    res.status(statusCode).json(errorResponse);
}

/**
 * 404 Not Found handler
 * For routes that don't match any endpoint
 */
export function notFoundHandler(req: Request, res: Response, _next: NextFunction): void {
    logger.warn(`Route not found: ${req.method} ${req.path}`);

    res.status(404).json({
        error: 'Route not found',
        code: 'NOT_FOUND',
        statusCode: 404,
        timestamp: new Date().toISOString(),
        path: req.path,
    });
}

/**
 * Async handler wrapper
 * Catches errors from async route handlers and passes to error middleware
 */
export function asyncHandler<T>(
    fn: (req: Request, res: Response, next: NextFunction) => Promise<T>
): (req: Request, res: Response, next: NextFunction) => void {
    return (req: Request, res: Response, next: NextFunction) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
}
