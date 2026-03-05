/**
 * Event Publisher — publishes incident lifecycle events to Redis Pub/Sub.
 * Any subscriber (e.g., SSE controller) listening on the channel receives
 * the event in real-time, enabling live dashboards without page refresh.
 *
 * @module modules/events/event.publisher
 */

import Redis from 'ioredis';
import { logger } from '../../common/utils/logger';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const CHANNEL = 'incidents:live';

// Dedicated publisher connection (ioredis requires separate client for pub/sub)
const publisher = new Redis(REDIS_URL, {
    maxRetriesPerRequest: 3,
    lazyConnect: false,
    family: 0,
});

publisher.on('error', (err) => {
    logger.error('Event publisher Redis error', { error: err.message });
});

export interface IncidentEvent {
    type: 'incident.created' | 'incident.updated' | 'incident.resolved' | 'incident.deleted' | 'log.added';
    incidentId: string;
    data: {
        id: string;
        title?: string;
        status?: string;
        severity?: string;
        systemName?: string;
        [key: string]: unknown;
    };
    timestamp: string;
}

export const eventPublisher = {
    channel: CHANNEL,

    async emit(event: IncidentEvent): Promise<void> {
        try {
            await publisher.publish(CHANNEL, JSON.stringify(event));
            logger.debug('Event published', { type: event.type, incidentId: event.incidentId });
        } catch (err) {
            logger.error('Failed to publish event', { error: (err as Error).message });
        }
    },

    async close(): Promise<void> {
        await publisher.quit();
    },
};
