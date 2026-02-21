
/**
 * Shared Redis URL Parser
 * Parses a Redis connection URL into BullMQ-compatible connection options.
 * Used by both the SLA queue and worker to avoid duplication.
 * 
 * @module common/utils/redis-url
 */

export function parseRedisUrl(url: string) {
    const parsed = new URL(url);
    return {
        host: parsed.hostname || 'localhost',
        port: parseInt(parsed.port || '6379', 10),
        password: parsed.password || undefined,
    };
}
