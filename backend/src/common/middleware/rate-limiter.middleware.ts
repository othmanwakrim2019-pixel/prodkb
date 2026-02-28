
import rateLimit from 'express-rate-limit';
import { RedisStore } from 'rate-limit-redis';
import Redis from 'ioredis';
import { logger } from '../utils/logger';

// ── Redis client for rate limiting (separate from auth cache) ──
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
let redisClient: Redis | null = null;

try {
    redisClient = new Redis(REDIS_URL, {
        maxRetriesPerRequest: 1,
    });
    redisClient.on('error', (err) => {
        logger.warn('Rate limiter Redis error', { error: err.message });
    });
} catch {
    logger.warn('Rate limiter Redis init failed — using in-memory store');
}

/**
 * Create a rate limiter with Redis store (falls back to in-memory if Redis unavailable)
 */
function createLimiter(opts: { windowMs: number; max: number; message: string | object; skipSuccessfulRequests?: boolean; prefix: string }) {
    const storeOpts = redisClient ? {
        store: new RedisStore({
            // @ts-expect-error — type mismatch between ioredis and rate-limit-redis
            sendCommand: (...args: string[]) => redisClient!.call(...(args as [string, ...string[]])),
            prefix: `rl:${opts.prefix}:`,
        }),
    } : {};

    return rateLimit({
        windowMs: opts.windowMs,
        max: opts.max,
        message: opts.message,
        standardHeaders: true,
        legacyHeaders: false,
        skipSuccessfulRequests: opts.skipSuccessfulRequests,
        // Combine the validated IP key with User-Agent so each device is treated
        // separately even on shared NAT networks.
        // validate: { xForwardedForHeader: false } suppresses the IPv6 subnet warning
        // while we keep the exact IP via trust proxy set in server.ts.
        validate: { xForwardedForHeader: false },
        keyGenerator: (req) => {
            const ip = req.ip || req.socket.remoteAddress || 'unknown';
            const ua = req.headers['user-agent'] || 'unknown-ua';
            return `${ip}::${ua.slice(0, 80)}`;
        },
        ...storeOpts,
    });
}

// General API rate limiter — reasonable for production
export const apiLimiter = createLimiter({
    windowMs: 15 * 60 * 1000,
    max: 500,
    message: 'Too many requests from this IP, please try again later.',
    prefix: 'api',
});

// Auth endpoints rate limiter (stricter to prevent brute force)
export const authLimiter = createLimiter({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: { error: 'Too many login attempts, please try again later.' },
    skipSuccessfulRequests: true,
    prefix: 'auth',
});

// File upload rate limiter
export const uploadLimiter = createLimiter({
    windowMs: 60 * 60 * 1000,
    max: 20,
    message: 'Too many file uploads, please try again later.',
    prefix: 'upload',
});

