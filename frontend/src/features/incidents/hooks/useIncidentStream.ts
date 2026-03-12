import { useEffect, useCallback, useRef, useState } from 'react';

export interface IncidentEvent {
    type: 'incident.created' | 'incident.updated' | 'incident.resolved' | 'incident.deleted' | 'log.added' | 'connected';
    incidentId?: string;
    data?: {
        id: string;
        title?: string;
        status?: string;
        severity?: string;
        systemName?: string;
        [key: string]: unknown;
    };
    timestamp: string;
}

interface UseIncidentStreamOptions {
    /** Called when any incident event is received */
    onEvent?: (event: IncidentEvent) => void;
    /** Auto-reconnect on error (default: true) */
    autoReconnect?: boolean;
    /** Filter by specific incident ID (only receive events for this incident) */
    incidentId?: string;
}

/**
 * Custom hook that connects to the SSE endpoint and receives real-time
 * incident updates. Uses the native EventSource API.
 *
 * Usage:
 * ```tsx
 * useIncidentStream({
 *   onEvent: (event) => {
 *     if (event.type === 'incident.updated') refreshList();
 *   },
 * });
 * ```
 */
export function useIncidentStream({ onEvent, autoReconnect = true, incidentId }: UseIncidentStreamOptions = {}) {
    const [isConnected, setIsConnected] = useState(false);
    const [lastEvent, setLastEvent] = useState<IncidentEvent | null>(null);
    const eventSourceRef = useRef<EventSource | null>(null);
    const onEventRef = useRef(onEvent);

    // Keep callback ref fresh without triggering reconnect
    useEffect(() => {
        onEventRef.current = onEvent;
    }, [onEvent]);

    const connect = useCallback(() => {
        // Close existing connection
        if (eventSourceRef.current) {
            eventSourceRef.current.close();
        }

        const url = `/api/v1/events/stream`;
        const es = new EventSource(url, { withCredentials: true });
        eventSourceRef.current = es;

        es.onopen = () => {
            setIsConnected(true);
        };

        es.onmessage = (msg) => {
            try {
                const event: IncidentEvent = JSON.parse(msg.data);

                // Filter by incidentId if specified
                if (incidentId && event.incidentId && event.incidentId !== incidentId) {
                    return;
                }

                setLastEvent(event);
                onEventRef.current?.(event);
            } catch {
                // Ignore parse errors (e.g., heartbeat comments)
            }
        };

        es.onerror = () => {
            setIsConnected(false);
            es.close();

            if (autoReconnect) {
                // Reconnect after 5 seconds
                setTimeout(() => {
                    connect();
                }, 5000);
            }
        };
    }, [incidentId, autoReconnect]);

    useEffect(() => {
        connect();

        return () => {
            if (eventSourceRef.current) {
                eventSourceRef.current.close();
                eventSourceRef.current = null;
            }
        };
    }, [connect]);

    return { isConnected, lastEvent };
}
