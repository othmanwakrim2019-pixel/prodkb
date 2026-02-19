/**
 * useCrud — generic CRUD hook for admin pages
 * Eliminates the repeated fetch/create/update/delete boilerplate across
 * UserManagement, SystemManagement, TeamManagement, SLAManagement, RoleManager
 */
import { useState, useCallback, useEffect, useRef } from 'react';

interface CrudService<T> {
    getAll: (...args: unknown[]) => Promise<T[]>;
    create?: (data: Record<string, unknown>) => Promise<T>;
    update?: (id: string, data: Record<string, unknown>) => Promise<T>;
    delete?: (id: string) => Promise<void>;
}

export interface UseCrudReturn<T> {
    items: T[];
    loading: boolean;
    error: string | null;
    refresh: () => Promise<void>;
    create: (data: Record<string, unknown>) => Promise<boolean>;
    update: (id: string, data: Record<string, unknown>) => Promise<boolean>;
    remove: (id: string) => Promise<boolean>;
    clearError: () => void;
}

export function useCrud<T>(service: CrudService<T>): UseCrudReturn<T> {
    const [items, setItems] = useState<T[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const mountedRef = useRef(true);

    useEffect(() => {
        mountedRef.current = true;
        return () => { mountedRef.current = false; };
    }, []);

    const refresh = useCallback(async () => {
        try {
            setLoading(true);
            const data = await service.getAll();
            if (mountedRef.current) {
                setItems(data);
                setError(null);
            }
        } catch (err: unknown) {
            const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error
                || 'Failed to fetch data';
            if (mountedRef.current) setError(msg);
        } finally {
            if (mountedRef.current) setLoading(false);
        }
    }, [service]);

    useEffect(() => { refresh(); }, [refresh]);

    const create = useCallback(async (data: Record<string, unknown>): Promise<boolean> => {
        if (!service.create) return false;
        try {
            await service.create(data);
            await refresh();
            return true;
        } catch (err: unknown) {
            const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error
                || 'Failed to create';
            setError(msg);
            return false;
        }
    }, [service, refresh]);

    const update = useCallback(async (id: string, data: Record<string, unknown>): Promise<boolean> => {
        if (!service.update) return false;
        try {
            await service.update(id, data);
            await refresh();
            return true;
        } catch (err: unknown) {
            const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error
                || 'Failed to update';
            setError(msg);
            return false;
        }
    }, [service, refresh]);

    const remove = useCallback(async (id: string): Promise<boolean> => {
        if (!service.delete) return false;
        try {
            await service.delete(id);
            await refresh();
            return true;
        } catch (err: unknown) {
            const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error
                || 'Failed to delete';
            setError(msg);
            return false;
        }
    }, [service, refresh]);

    const clearError = useCallback(() => setError(null), []);

    return { items, loading, error, refresh, create, update, remove, clearError };
}
