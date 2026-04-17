/**
 * Incident API Service — typed abstraction over all incident endpoints
 */
import api from '../../../utils/axios';
import { unwrapArray, unwrapObject } from '../../../utils/api-response';
import type { Incident, Job, Log, Procedure, SLA, System, Team } from '../../../types';

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

export interface SimilarIncident {
    id: string;
    title: string;
    status: string;
    severity: string;
    createdAt: string;
    linkedProcedure?: { id: string; title: string } | null;
}

export interface PostMortem {
    id: string;
    summary: string;
    rootCause: string;
    timeline: string;
    impact: string;
    lessonsLearned: string;
    preventiveActions: string;
    status: string;
    createdBy?: { name: string };
    updatedAt: string;
}

export interface WarRoomMessage {
    id: string;
    content: string;
    type: 'message' | 'system_event';
    createdAt: string;
    user: { id: string; name: string };
}

export interface ActivityEntry {
    id: string;
    logType: string;         // 'activity' | 'note' | 'investigation' | 'file' | ...
    rawLog: string | null;
    fileName: string | null;
    mimeType: string | null;
    createdAt: string;
    createdBy: { id: string; name: string; email: string } | null;
}

export const incidentService = {
    getAll: async (params?: IncidentQueryParams): Promise<PaginatedResponse<Incident>> => {
        const response = await api.get('/api/v1/incidents', { params });
        const payload = response.data;

        if (Array.isArray(payload)) {
            return {
                data: payload,
                total: payload.length,
                page: params?.page ?? 1,
                limit: params?.limit ?? payload.length,
                totalPages: 1,
            };
        }

        if (payload?.items && payload?.meta) {
            return {
                data: payload.items,
                total: payload.meta.total,
                page: payload.meta.page,
                limit: payload.meta.limit,
                totalPages: payload.meta.totalPages,
            };
        }

        return payload;
    },

    getById: async (id: string): Promise<Incident> => {
        const response = await api.get(`/api/v1/incidents/${id}`);
        return unwrapObject<Incident>(response.data) as Incident;
    },

    create: async (data: Record<string, unknown>): Promise<Incident> => {
        const response = await api.post('/api/v1/incidents', data);
        return response.data;
    },

    getFormOptions: async (): Promise<{ systems: System[]; teams: Team[]; slas: SLA[] }> => {
        const [systemsResponse, teamsResponse, slasResponse] = await Promise.all([
            api.get('/api/v1/systems'),
            api.get('/api/v1/teams'),
            api.get('/api/v1/slas'),
        ]);

        return {
            systems: unwrapArray<System>(systemsResponse.data, ['data', 'items', 'systems']),
            teams: unwrapArray<Team>(teamsResponse.data, ['data', 'items', 'teams']),
            slas: unwrapArray<SLA>(slasResponse.data, ['data', 'items', 'slas']),
        };
    },

    getSystemJobs: (systemId: string, systems: System[]): Job[] =>
        systems.find((system) => system.id === systemId)?.jobs || [],

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
        return unwrapObject<DashboardStats>(response.data) as DashboardStats;
    },

    searchKnowledgeBase: async (query: string, systemId?: string): Promise<Incident[]> => {
        const response = await api.get('/api/v1/incidents/search', {
            params: { query, systemId, requireProcedure: 'true' },
        });
        return unwrapArray<Incident>(response.data, ['data', 'items', 'incidents']);
    },

    search: async (query: string): Promise<{ procedures: Procedure[]; incidents: Incident[] }> => {
        const response = await api.get('/api/v1/search', { params: { query } });
        const payload = unwrapObject<{ procedures?: Procedure[]; incidents?: Incident[] }>(response.data) ?? {};
        return {
            procedures: unwrapArray<Procedure>(payload.procedures, []),
            incidents: unwrapArray<Incident>(payload.incidents, []),
        };
    },

    findSimilar: async (title: string): Promise<SimilarIncident[]> => {
        const response = await api.get('/api/v1/search', { params: { query: title } });
        const payload = unwrapObject<{ incidents?: SimilarIncident[] }>(response.data) ?? {};
        return unwrapArray<SimilarIncident>(payload.incidents, []).slice(0, 5);
    },

    getPostMortem: async (incidentId: string): Promise<PostMortem | null> => {
        const response = await api.get(`/api/v1/incidents/${incidentId}/postmortem`);
        return unwrapObject<PostMortem>(response.data);
    },

    savePostMortem: async (incidentId: string, form: Record<string, unknown>): Promise<PostMortem> => {
        const response = await api.post(`/api/v1/incidents/${incidentId}/postmortem`, form);
        return unwrapObject<PostMortem>(response.data) as PostMortem;
    },

    getWarRoomMessages: async (incidentId: string): Promise<WarRoomMessage[]> => {
        const response = await api.get(`/api/v1/warroom/${incidentId}/messages`);
        return unwrapArray<WarRoomMessage>(response.data, ['data', 'items', 'messages']);
    },

    /** Returns the URL for inline file preview (Content-Disposition: inline) */
    getFilePreviewUrl: (id: string, fileName: string): string =>
        `/api/v1/incidents/${id}/files/${fileName}/preview`,

    deleteFile: (id: string, fileName: string): Promise<void> =>
        api.delete(`/api/v1/incidents/${id}/files/${fileName}`),

    getActivity: async (incidentId: string): Promise<ActivityEntry[]> => {
        const response = await api.get(`/api/v1/incidents/${incidentId}/activity`);
        const payload = response.data;
        if (Array.isArray(payload)) return payload;
        if (payload?.data && Array.isArray(payload.data)) return payload.data;
        return [];
    },
};

