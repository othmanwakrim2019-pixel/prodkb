/**
 * Incident API Service — typed abstraction over all incident endpoints
 */
import api from '../utils/axios';
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
    getAll: async (params?: IncidentQueryParams): Promise<PaginatedResponse<Incident>> => {
        const response = await api.get('/api/v1/incidents', { params });
        return response.data;
    },

    getById: async (id: string): Promise<Incident> => {
        const response = await api.get(`/api/v1/incidents/${id}`);
        return response.data;
    },

    create: async (data: Record<string, unknown>): Promise<Incident> => {
        const response = await api.post('/api/v1/incidents', data);
        return response.data;
    },

    update: async (id: string, data: Record<string, unknown>): Promise<Incident> => {
        const response = await api.put(`/api/v1/incidents/${id}`, data);
        return response.data;
    },

    delete: (id: string): Promise<void> =>
        api.delete(`/api/v1/incidents/${id}`),

    updateStatus: async (id: string, status: string): Promise<Incident> => {
        const response = await api.put(`/api/v1/incidents/${id}/status`, { status });
        return response.data;
    },

    acknowledge: async (id: string): Promise<Incident> => {
        const response = await api.post(`/api/v1/incidents/${id}/acknowledge`);
        return response.data;
    },

    addLog: async (id: string, data: { logType: string; rawLog: string }): Promise<Log> => {
        const response = await api.post(`/api/v1/incidents/${id}/logs`, data);
        return response.data;
    },

    uploadFile: async (id: string, formData: FormData): Promise<unknown> => {
        const response = await api.post(`/api/v1/incidents/${id}/upload`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return response.data;
    },

    downloadFile: async (id: string, fileName: string): Promise<Blob> => {
        const response = await api.get(`/api/v1/incidents/${id}/files/${fileName}`, {
            responseType: 'blob',
        });
        return response.data;
    },

    linkProcedure: async (incidentId: string, procedureId: string): Promise<unknown> => {
        const response = await api.post(`/api/v1/incidents/${incidentId}/link-procedure/${procedureId}`);
        return response.data;
    },

    getStats: async (params?: { systemId?: string; teamId?: string }): Promise<DashboardStats> => {
        const response = await api.get('/api/v1/incidents/stats', { params });
        return response.data;
    },

    search: async (query: string): Promise<{ procedures: unknown[]; incidents: Incident[] }> => {
        const response = await api.get('/api/v1/search', { params: { query } });
        return response.data;
    },

    /** Returns the URL for inline file preview (Content-Disposition: inline) */
    getFilePreviewUrl: (id: string, fileName: string): string =>
        `/api/v1/incidents/${id}/files/${fileName}/preview`,

    deleteFile: (id: string, fileName: string): Promise<void> =>
        api.delete(`/api/v1/incidents/${id}/files/${fileName}`),
};

