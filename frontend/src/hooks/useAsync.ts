/**
 * useAsync — generic async state management hook
 * Replaces the recurring useState(loading)/useState(error)/useEffect(fetch) pattern
 */
import { useState, useCallback, useEffect, useRef } from 'react';

export interface AsyncState<T> {
    data: T | null;
    loading: boolean;
    error: string | null;
}

export interface UseAsyncReturn<T> extends AsyncState<T> {
    execute: (...args: unknown[]) => Promise<T | null>;
    refresh: () => Promise<T | null>;
    setData: (data: T | null) => void;
    reset: () => void;
}

/**
 * @param asyncFn — the async function to execute
 * @param immediate — whether to execute immediately on mount (default: false)
 */
export function useAsync<T>(
    asyncFn: (...args: unknown[]) => Promise<T>,
    immediate = false
): UseAsyncReturn<T> {
    const [state, setState] = useState<AsyncState<T>>({
        data: null,
        loading: immediate,
        error: null,
    });

    const lastArgsRef = useRef<unknown[]>([]);
    const mountedRef = useRef(true);

    useEffect(() => {
        mountedRef.current = true;
        return () => { mountedRef.current = false; };
    }, []);

    const execute = useCallback(async (...args: unknown[]): Promise<T | null> => {
        lastArgsRef.current = args;
        setState(prev => ({ ...prev, loading: true, error: null }));

        try {
            const result = await asyncFn(...args);
            if (mountedRef.current) {
                setState({ data: result, loading: false, error: null });
            }
            return result;
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'An unexpected error occurred';
            // Extract axios error message if available
            const axiosMsg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
            if (mountedRef.current) {
                setState({ data: null, loading: false, error: axiosMsg || message });
            }
            return null;
        }
    }, [asyncFn]);

    const refresh = useCallback(() => {
        return execute(...lastArgsRef.current);
    }, [execute]);

    const setData = useCallback((data: T | null) => {
        setState(prev => ({ ...prev, data }));
    }, []);

    const reset = useCallback(() => {
        setState({ data: null, loading: false, error: null });
    }, []);

    useEffect(() => {
        if (immediate) {
            execute();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return { ...state, execute, refresh, setData, reset };
}
