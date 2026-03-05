/**
 * Helmet & Security Headers Configuration
 *
 * Configures HTTP security headers via helmet.
 * Behaviour controlled by SECURITY_MODE env var:
 *   - "strict" → HSTS, CSP, secure cookies (for HTTPS/domain deployments)
 *   - unset    → HTTP-friendly, clears HSTS cache, relaxed CSP
 *
 * @module config/helmet
 */

import helmet from 'helmet';
import { RequestHandler, Request, Response, NextFunction } from 'express';
import { logger } from '../common/utils/logger';

const SECURITY_MODE = process.env.SECURITY_MODE === 'strict';
logger.info(`Security mode: ${SECURITY_MODE ? 'STRICT (HTTPS required)' : 'OFF (HTTP friendly)'}`);

export { SECURITY_MODE };

/**
 * Primary helmet middleware — CSP, HSTS, etc.
 */
export const helmetMiddleware: RequestHandler = helmet({
    hsts: SECURITY_MODE
        ? { maxAge: 31536000, includeSubDomains: true, preload: true }
        : false,
    contentSecurityPolicy: SECURITY_MODE
        ? {
            directives: {
                defaultSrc: ["'self'"],
                styleSrc: ["'self'", "'unsafe-inline'"],
                scriptSrc: ["'self'", "'unsafe-inline'"],
                imgSrc: ["'self'", 'data:', 'https:'],
            },
        }
        : false,
    crossOriginOpenerPolicy: false,
    originAgentCluster: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
});

/**
 * Additional security headers — always applied regardless of mode.
 * When NOT in strict mode, also clears any cached HSTS.
 */
export function securityHeaders(req: Request, res: Response, next: NextFunction): void {
    if (!SECURITY_MODE) {
        res.setHeader('Strict-Transport-Security', 'max-age=0');
    }
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    next();
}
