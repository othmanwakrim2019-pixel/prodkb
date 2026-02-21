
/**
 * Request Context — AsyncLocalStorage-based context propagation
 * 
 * Automatically propagates requestId, userId, method, and path through
 * the entire call chain without manual parameter passing.
 * Used by the logger to auto-inject context into every log line.
 *
 * @module common/utils/request-context
 */

import { AsyncLocalStorage } from 'async_hooks';

export interface RequestContext {
    requestId: string;
    userId?: string;
    method?: string;
    path?: string;
}

export const requestContextStorage = new AsyncLocalStorage<RequestContext>();

/**
 * Get the current request context (if any).
 * Returns undefined if called outside a request lifecycle.
 */
export function getRequestContext(): RequestContext | undefined {
    return requestContextStorage.getStore();
}
