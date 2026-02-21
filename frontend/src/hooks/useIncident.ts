/**
 * useIncident — domain hook for single incident detail page
 * Encapsulates fetching, status updates, log addition, file upload, procedure linking
 */
import { useState, useCallback, useEffect, useRef } from 'react';
import { incidentService } from '../services/incident.service';
import type { Incident } from '../types';

export interface UseIncidentReturn {
    incident: Incident | null;
    loading: boolean;
    error: string | null;
    refresh: () => Promise<void>;
    updateStatus: (status: string) => Promise<boolean>;
    update: (data: Record<string, unknown>) => Promise<boolean>;
    acknowledge: () => Promise<boolean>;
    addLog: (logType: string, content: string) => Promise<boolean>;
    uploadFile: (file: File) => Promise<boolean>;
    downloadFile: (fileName: string) => Promise<void>;
    deleteFile: (fileName: string) => Promise<boolean>;
    unlinkProcedure: () => Promise<boolean>;
}

export function useIncident(id: string | undefined): UseIncidentReturn {
    const [incident, setIncident] = useState<Incident | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const mountedRef = useRef(true);

    useEffect(() => {
        mountedRef.current = true;
        return () => { mountedRef.current = false; };
    }, []);

    const refresh = useCallback(async () => {
        if (!id) return;
        try {
            setLoading(true);
            const data = await incidentService.getById(id);
            if (mountedRef.current) {
                setIncident(data);
                setError(null);
            }
        } catch (err: unknown) {
            const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
                || (err instanceof Error ? err.message : 'Failed to fetch incident');
            if (mountedRef.current) setError(msg);
        } finally {
            if (mountedRef.current) setLoading(false);
        }
    }, [id]);

    useEffect(() => { refresh(); }, [refresh]);

    const handleError = (err: unknown, fallback: string): string => {
        return (err as { response?: { data?: { message?: string } } })?.response?.data?.message
            || (err instanceof Error ? err.message : fallback);
    };

    const updateStatus = useCallback(async (status: string): Promise<boolean> => {
        if (!id) return false;
        try {
            await incidentService.updateStatus(id, status);
            await refresh();
            return true;
        } catch (err) {
            setError(handleError(err, 'Failed to update status'));
            return false;
        }
    }, [id, refresh]);

    const update = useCallback(async (data: Record<string, unknown>): Promise<boolean> => {
        if (!id) return false;
        try {
            await incidentService.update(id, data);
            await refresh();
            return true;
        } catch (err) {
            setError(handleError(err, 'Failed to update incident'));
            return false;
        }
    }, [id, refresh]);

    const acknowledge = useCallback(async (): Promise<boolean> => {
        if (!id) return false;
        try {
            await incidentService.acknowledge(id);
            await refresh();
            return true;
        } catch (err) {
            setError(handleError(err, 'Failed to acknowledge'));
            return false;
        }
    }, [id, refresh]);

    const addLog = useCallback(async (logType: string, content: string): Promise<boolean> => {
        if (!id) return false;
        try {
            await incidentService.addLog(id, { logType, rawLog: content });
            await refresh();
            return true;
        } catch (err) {
            setError(handleError(err, 'Failed to add log'));
            return false;
        }
    }, [id, refresh]);

    const uploadFile = useCallback(async (file: File): Promise<boolean> => {
        if (!id) return false;
        const formData = new FormData();
        formData.append('file', file);
        try {
            await incidentService.uploadFile(id, formData);
            await refresh();
            return true;
        } catch (err) {
            setError(handleError(err, 'Failed to upload file'));
            return false;
        }
    }, [id, refresh]);

    const downloadFile = useCallback(async (fileName: string): Promise<void> => {
        if (!id) return;
        try {
            const blob = await incidentService.downloadFile(id, fileName);
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (err) {
            setError(handleError(err, 'Failed to download file'));
        }
    }, [id]);

    const deleteFile = useCallback(async (fileName: string): Promise<boolean> => {
        if (!id) return false;
        try {
            await incidentService.deleteFile(id, fileName);
            await refresh();
            return true;
        } catch (err) {
            setError(handleError(err, 'Failed to delete file'));
            return false;
        }
    }, [id, refresh]);

    const unlinkProcedure = useCallback(async (): Promise<boolean> => {
        if (!id) return false;
        try {
            await incidentService.update(id, { linkedProcedureId: null });
            await refresh();
            return true;
        } catch (err) {
            setError(handleError(err, 'Failed to unlink procedure'));
            return false;
        }
    }, [id, refresh]);

    return {
        incident, loading, error, refresh,
        updateStatus, update, acknowledge,
        addLog, uploadFile, downloadFile, deleteFile, unlinkProcedure,
    };
}
