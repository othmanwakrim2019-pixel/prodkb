
import Redis from 'ioredis';
import { logger } from './logger';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

const redis = new Redis(REDIS_URL, {
    maxRetriesPerRequest: 3,
    retryStrategy(times) {
        const delay = Math.min(times * 200, 5000);
        logger.warn(`Redis reconnecting — attempt ${times}, delaying ${delay}ms`);
        return delay;
    },
    lazyConnect: false,
});

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
