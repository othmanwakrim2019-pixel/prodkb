
/**
 * CSRF Protection Middleware — Double-Submit Cookie Pattern
 *
 * How it works:
 * 1. On login, the server sets a `csrf_token` cookie (readable by JS, NOT httpOnly)
 * 2. The frontend reads this cookie and sends it as the `X-CSRF-Token` header on every mutation
 * 3. This middleware validates that the header matches the cookie
 *
 * Why this works:
 * - An attacker from a different origin cannot read cookies (Same-Origin Policy)
 * - So they cannot extract the CSRF token to put in the header
 * - Cross-origin requests will have the cookie but NOT the header → blocked
 *
 * Exempt: GET, HEAD, OPTIONS (safe methods), and any routes explicitly excluded
 */

import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { logger } from '../utils/logger';

const CSRF_COOKIE_NAME = 'csrf_token';
const CSRF_HEADER_NAME = 'x-csrf-token';
const SAFE_METHODS = ['GET', 'HEAD', 'OPTIONS'];

// Paths exempt from CSRF (e.g., login itself, webhooks that use HMAC)
const EXEMPT_PATHS = [
    '/auth/login',
    '/auth/v1/login',
    '/auth/refresh',
    '/auth/v1/refresh',
    '/health',
    '/api-docs',
];

/**
 * Generate a new CSRF token (32 random bytes, hex-encoded)
 */
export function generateCsrfToken(): string {
    return crypto.randomBytes(32).toString('hex');
}

/**
 * Set the CSRF cookie on the response.
 * Called after login and token refresh.
 */
export function setCsrfCookie(res: Response, token: string): void {
    res.cookie(CSRF_COOKIE_NAME, token, {
        httpOnly: false,     // JS must be able to read this
        secure: process.env.SECURITY_MODE === 'strict',
        sameSite: 'strict',
        path: '/',
        maxAge: 30 * 24 * 60 * 60 * 1000,
    });
}

/**
 * Clear the CSRF cookie on logout.
 */
export function clearCsrfCookie(res: Response): void {
    res.clearCookie(CSRF_COOKIE_NAME, {
        httpOnly: false,
        secure: process.env.SECURITY_MODE === 'strict',
        sameSite: 'strict',
        path: '/',
    });
}

/**
 * CSRF validation middleware.
 * Validates that the X-CSRF-Token header matches the csrf_token cookie.
 */
export const csrfProtection = (req: Request, res: Response, next: NextFunction) => {
    // Skip safe methods
    if (SAFE_METHODS.includes(req.method)) {
        return next();
    }

    // Skip exempt paths
    const isExempt = EXEMPT_PATHS.some(p => req.path.startsWith(p) || req.originalUrl.startsWith(p));
    if (isExempt) {
        return next();
    }

    const cookieToken = req.cookies?.[CSRF_COOKIE_NAME];
    const headerToken = req.headers[CSRF_HEADER_NAME] as string;

    if (!cookieToken || !headerToken) {
        logger.warn('CSRF validation failed: missing token', {
            path: req.path,
            hasCookie: !!cookieToken,
            hasHeader: !!headerToken,
        });
        res.status(403).json({
            success: false,
            message: 'CSRF token missing',
            error: { code: 'CSRF_MISSING' },
        });
        return;
    }

    const cookieBuffer = Buffer.from(cookieToken);
    const headerBuffer = Buffer.from(headerToken);

    // Constant-time comparison to prevent timing attacks. timingSafeEqual
    // throws when lengths differ, so reject mismatched lengths explicitly.
    if (cookieBuffer.length !== headerBuffer.length || !crypto.timingSafeEqual(cookieBuffer, headerBuffer)) {
        logger.warn('CSRF validation failed: token mismatch', { path: req.path });
        res.status(403).json({
            success: false,
            message: 'CSRF token invalid',
            error: { code: 'CSRF_INVALID' },
        });
        return;
    }

    next();
};

export { CSRF_COOKIE_NAME };
