/**
 * Redis Client & URL Parser
 *
 * Exports:
 * - `redis`         — singleton ioredis client for general use
 * - `parseRedisUrl`  — parses a Redis URL into BullMQ-compatible connection options
 *
 * @module common/utils/redis
 */

import Redis, { RedisOptions } from 'ioredis';
import { logger } from './logger';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

// ── URL Parser (used by BullMQ queues and workers) ──

export function parseRedisUrl(url: string) {
    const parsed = new URL(url);
    const isTls = parsed.protocol === 'rediss:';

    return {
        host: parsed.hostname || 'localhost',
        port: parseInt(parsed.port || '6379', 10),
        username: parsed.username || undefined,
        password: parsed.password || undefined,
        tls: isTls ? {} : undefined,
        family: 0,
    };
}

// ── Singleton Client ──

const options: RedisOptions = {
    maxRetriesPerRequest: 3,
    retryStrategy(times) {
        const delay = Math.min(times * 200, 5000);
        logger.warn(`Redis reconnecting — attempt ${times}, delaying ${delay}ms`);
        return delay;
    },
    lazyConnect: false,
    tls: REDIS_URL.startsWith('rediss://') ? {} : undefined,
    family: 0, // Auto-detect IPv4/IPv6
};

const redis = new Redis(REDIS_URL, options);

redis.on('connect', () => {
    logger.info('Redis connected');
});

redis.on('error', (err) => {
    logger.error('Redis connection error', { error: err.message });
});

redis.on('close', () => {
    logger.warn('Redis connection closed');
});

export { redis };
