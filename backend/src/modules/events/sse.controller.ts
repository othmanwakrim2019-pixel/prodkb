/**
 * SSE Controller — Server-Sent Events endpoint for real-time incident updates.
 *
 * Clients connect via `GET /api/v1/events/stream`. The controller opens an SSE
 * connection and subscribes to the Redis Pub/Sub `incidents:live` channel.
 * Any incident mutation published by `event.publisher.ts` is forwarded to
 * all connected browsers in real-time.
 *
 * @module modules/events/sse.controller
 */

import { Request, Response } from 'express';
import Redis from 'ioredis';
import { logger } from '../../common/utils/logger';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const CHANNEL = 'incidents:live';

export class SSEController {
    /**
     * Opens an SSE stream. Each connected client gets its own Redis subscriber.
     * When the client disconnects, the subscriber is cleaned up.
     */
    static stream(req: Request, res: Response): void {
        // SSE headers
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        res.setHeader('X-Accel-Buffering', 'no'); // Disable Nginx buffering
        res.flushHeaders();

        // Send initial connection event
        res.write(`data: ${JSON.stringify({ type: 'connected', timestamp: new Date().toISOString() })}\n\n`);

        // Create a dedicated Redis subscriber for this client
        const subscriber = new Redis(REDIS_URL, {
            maxRetriesPerRequest: 3,
            lazyConnect: false,
            family: 0,
        });

        subscriber.subscribe(CHANNEL, (err) => {
            if (err) {
                logger.error('SSE: Failed to subscribe to Redis channel', { error: err.message });
                res.end();
                return;
            }
            logger.debug('SSE: Client connected and subscribed');
        });

        subscriber.on('message', (_channel: string, message: string) => {
            res.write(`data: ${message}\n\n`);
        });

        subscriber.on('error', (err) => {
            logger.error('SSE subscriber error', { error: err.message });
        });

        // Heartbeat every 30 seconds to keep the connection alive
        const heartbeat = setInterval(() => {
            res.write(`: heartbeat\n\n`);
        }, 30000);

        // Cleanup on client disconnect
        req.on('close', () => {
            clearInterval(heartbeat);
            subscriber.unsubscribe(CHANNEL);
            subscriber.quit();
            logger.debug('SSE: Client disconnected');
        });
    }
}
