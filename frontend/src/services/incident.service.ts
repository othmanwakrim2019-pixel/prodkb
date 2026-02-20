/**
 * Incident API Service — typed abstraction over all incident endpoints
 */
import { api } from '../lib/api';
import type { Incident, Log } from '../types';

export interface PaginatedResponse<T> {
    data: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export interface IncidentQueryParams {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    severity?: string;
    systemId?: string;
    teamId?: string;
    startDate?: string;
    endDate?: string;
}

export interface DashboardStats {
    createdToday: number;
    resolvedToday: number;
    activeIncidents: number;
    avgResolutionTimeMinutes: number;
    trends: Array<{ date: string; created: number; resolved: number }>;
    statusBreakdown: Array<{ status: string; count: number }>;
    topSystems: Array<{ systemId: string; name: string; count: number }>;
    myWork?: { myTeamQueue: number; myTeamBreaches: number };
}

export const incidentService = {
    getAll: (params?: IncidentQueryParams): Promise<PaginatedResponse<Incident>> =>
        api.get('/api/v1/incidents', { params }).then(r => r.data),

    getById: (id: string): Promise<Incident> =>
        api.get(`/api/v1/incidents/${id}`).then(r => r.data),

    create: (data: Record<string, unknown>): Promise<Incident> =>
        api.post('/api/v1/incidents', data).then(r => r.data),

    update: (id: string, data: Record<string, unknown>): Promise<Incident> =>
        api.put(`/api/v1/incidents/${id}`, data).then(r => r.data),

    delete: (id: string): Promise<void> =>
        api.delete(`/api/v1/incidents/${id}`),

    updateStatus: (id: string, status: string): Promise<Incident> =>
        api.put(`/api/v1/incidents/${id}/status`, { status }).then(r => r.data),

    acknowledge: (id: string): Promise<Incident> =>
        api.post(`/api/v1/incidents/${id}/acknowledge`).then(r => r.data),

    addLog: (id: string, data: { logType: string; rawLog: string }): Promise<Log> =>
        api.post(`/api/v1/incidents/${id}/logs`, data).then(r => r.data),

    uploadFile: (id: string, formData: FormData): Promise<unknown> =>
        api.post(`/api/v1/incidents/${id}/upload`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        }).then(r => r.data),

    downloadFile: (id: string, fileName: string): Promise<Blob> =>
        api.get(`/api/v1/incidents/${id}/files/${fileName}`, {
            responseType: 'blob',
        }).then(r => r.data),

    linkProcedure: (incidentId: string, procedureId: string): Promise<unknown> =>
        api.post(`/api/v1/incidents/${incidentId}/link-procedure/${procedureId}`).then(r => r.data),

    getStats: (params?: { systemId?: string; teamId?: string }): Promise<DashboardStats> =>
        api.get('/api/v1/incidents/stats', { params }).then(r => r.data),

    search: (query: string): Promise<{ procedures: unknown[]; incidents: Incident[] }> =>
        api.get('/api/v1/search', { params: { query } }).then(r => r.data),

    /** Returns the URL for inline file preview (Content-Disposition: inline) */
    getFilePreviewUrl: (id: string, fileName: string): string =>
        `/api/v1/incidents/${id}/files/${fileName}/preview`,

    deleteFile: (id: string, fileName: string): Promise<void> =>
        api.delete(`/api/v1/incidents/${id}/files/${fileName}`),
};
