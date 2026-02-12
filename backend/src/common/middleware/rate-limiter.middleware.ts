
import rateLimit from 'express-rate-limit';

// General API rate limiter - reasonable for production
export const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 500, // 500 requests per 15 minutes (reasonable for normal usage)
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
});

// Auth endpoints rate limiter (stricter to prevent brute force)
export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // Only 10 login attempts per 15 minutes
    message: { error: 'Too many login attempts, please try again later.' },
    skipSuccessfulRequests: true, // Don't count successful logins
});

// File upload rate limiter
export const uploadLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 20, // Limit to 20 file uploads per hour
    message: 'Too many file uploads, please try again later.',
});
