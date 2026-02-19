/**
 * useIncidents — hook for paginated incident list with filters
 */
import { useState, useCallback, useEffect, useRef } from 'react';
import { incidentService, type IncidentQueryParams, type PaginatedResponse } from '../services/incident.service';
import type { Incident } from '../types';

export interface UseIncidentsReturn {
    incidents: Incident[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    loading: boolean;
    error: string | null;
    refresh: () => Promise<void>;
    setPage: (page: number) => void;
    setLimit: (limit: number) => void;
    deleteIncident: (id: string) => Promise<boolean>;
}

export function useIncidents(params?: IncidentQueryParams): UseIncidentsReturn {
    const [data, setData] = useState<PaginatedResponse<Incident>>({
        data: [], total: 0, page: 1, limit: 10, totalPages: 0,
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState(params?.page || 1);
    const [limit, setLimit] = useState(params?.limit || 10);
    const mountedRef = useRef(true);

    useEffect(() => {
        mountedRef.current = true;
        return () => { mountedRef.current = false; };
    }, []);

    const refresh = useCallback(async () => {
        try {
            setLoading(true);
            const result = await incidentService.getAll({ ...params, page, limit });
            if (mountedRef.current) {
                setData(result);
                setError(null);
            }
        } catch (err: unknown) {
            const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error
                || 'Failed to fetch incidents';
            if (mountedRef.current) setError(msg);
        } finally {
            if (mountedRef.current) setLoading(false);
        }
    }, [params, page, limit]);

    useEffect(() => { refresh(); }, [refresh]);

    const deleteIncident = useCallback(async (id: string): Promise<boolean> => {
        try {
            await incidentService.delete(id);
            await refresh();
            return true;
        } catch {
            setError('Failed to delete incident');
            return false;
        }
    }, [refresh]);

    return {
        incidents: data.data,
        total: data.total,
        page: data.page,
        limit: data.limit,
        totalPages: data.totalPages,
        loading,
        error,
        refresh,
        setPage,
        setLimit,
        deleteIncident,
    };
}
