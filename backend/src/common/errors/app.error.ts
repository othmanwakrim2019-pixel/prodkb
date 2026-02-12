
export class AppError extends Error {
    public readonly statusCode: number;
    public readonly isOperational: boolean;
    public readonly code?: string;

    constructor(message: string, statusCode: number = 500, code?: string, isOperational: boolean = true) {
        super(message);
        this.statusCode = statusCode;
        this.code = code;
        this.isOperational = isOperational;

        Object.setPrototypeOf(this, new.target.prototype);
        Error.captureStackTrace(this);
    }
}

export class NotFoundError extends AppError {
    constructor(message: string = 'Not Found') {
        super(message, 404, 'NOT_FOUND');
    }
}

export class ValidationError extends AppError {
    constructor(message: string = 'Validation Error') {
        super(message, 400, 'VALIDATION_ERROR');
    }
}

export class UnauthorizedError extends AppError {
    constructor(message: string = 'Unauthorized') {
        super(message, 401, 'UNAUTHORIZED');
    }
}

export class ForbiddenError extends AppError {
    constructor(message: string = 'Forbidden') {
        super(message, 403, 'FORBIDDEN');
    }
}

export class AuthenticationError extends AppError {
    constructor(message: string = 'Authentication failed') {
        super(message, 401, 'AUTHENTICATION_ERROR');
    }
}

export class ConflictError extends AppError {
    constructor(message: string = 'Conflict') {
        super(message, 409, 'CONFLICT');
    }
}
