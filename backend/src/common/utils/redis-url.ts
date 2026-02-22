
/**
 * Shared Redis URL Parser
 * Parses a Redis connection URL into BullMQ-compatible connection options.
 * Used by both the SLA queue and worker to avoid duplication.
 * 
 * @module common/utils/redis-url
 */

export function parseRedisUrl(url: string) {
    const parsed = new URL(url);
    const isTls = parsed.protocol === 'rediss:';

    return {
        host: parsed.hostname || 'localhost',
        port: parseInt(parsed.port || '6379', 10),
        username: parsed.username || undefined,
        password: parsed.password || undefined,
        tls: isTls ? {} : undefined,
        family: 0
    };
}
