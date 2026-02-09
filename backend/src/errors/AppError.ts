/**
 * Custom application error classes for structured error handling
 * @module errors/AppError
 */

/**
 * Base application error class
 * All custom errors extend from this
 */
export class AppError extends Error {
    public readonly statusCode: number;
    public readonly isOperational: boolean;
    public readonly code: string;

    constructor(
        message: string,
        statusCode: number = 500,
        code: string = 'INTERNAL_ERROR',
        isOperational: boolean = true
    ) {
        super(message);
        this.statusCode = statusCode;
        this.code = code;
        this.isOperational = isOperational;

        // Maintains proper stack trace
        Error.captureStackTrace(this, this.constructor);
    }
}

/**
 * 400 Bad Request - Invalid input data
 */
export class ValidationError extends AppError {
    public readonly details?: Record<string, string[]>;

    constructor(message: string = 'Validation failed', details?: Record<string, string[]>) {
        super(message, 400, 'VALIDATION_ERROR');
        this.details = details;
    }
}

/**
 * 401 Unauthorized - Authentication required
 */
export class AuthenticationError extends AppError {
    constructor(message: string = 'Authentication required') {
        super(message, 401, 'AUTHENTICATION_ERROR');
    }
}

/**
 * 403 Forbidden - Insufficient permissions
 */
export class AuthorizationError extends AppError {
    constructor(message: string = 'Insufficient permissions') {
        super(message, 403, 'AUTHORIZATION_ERROR');
    }
}

/**
 * 404 Not Found - Resource not found
 */
export class NotFoundError extends AppError {
    constructor(resource: string = 'Resource') {
        super(`${resource} not found`, 404, 'NOT_FOUND');
    }
}

/**
 * 409 Conflict - Resource already exists
 */
export class ConflictError extends AppError {
    constructor(message: string = 'Resource already exists') {
        super(message, 409, 'CONFLICT');
    }
}

/**
 * 429 Too Many Requests - Rate limit exceeded
 */
export class RateLimitError extends AppError {
    constructor(message: string = 'Too many requests') {
        super(message, 429, 'RATE_LIMIT_EXCEEDED');
    }
}

/**
 * 500 Internal Server Error - Unexpected error
 */
export class InternalError extends AppError {
    constructor(message: string = 'Internal server error') {
        super(message, 500, 'INTERNAL_ERROR', false);
    }
}

/**
 * 503 Service Unavailable - External service error
 */
export class ServiceUnavailableError extends AppError {
    constructor(service: string = 'Service') {
        super(`${service} is unavailable`, 503, 'SERVICE_UNAVAILABLE');
    }
}
