/**
 * Planning API Service — instances, jobs, scheduling
 * Types derived from OpenAPI spec via openapi-typescript
 */
import { api } from '../lib/api';

// ── Response Types ──

export interface PlanningInstance {
    id: string;
    name: string;
    description?: string;
    status: 'active' | 'archived';
    createdAt: string;
    updatedAt: string;
    _count?: { jobs: number };
}

export interface PlanningJob {
    id: string;
    name: string;
    code: string;
    status: 'pending' | 'running' | 'done' | 'failed';
    position?: { x: number; y: number };
    instanceId: string;
    systemId?: string;
    teamId?: string;
    dependencies?: string[];
    createdAt: string;
    updatedAt: string;
}

// ── Service ──

export const planningService = {
    // ── Instances ──
    getInstances: async (params?: Record<string, unknown>): Promise<PlanningInstance[]> => {
        const response = await api.get('/api/v1/planning/instances', { params });
        return response.data;
    },

    createInstance: async (data: Record<string, unknown>): Promise<PlanningInstance> => {
        const response = await api.post('/api/v1/planning/instances', data);
        return response.data;
    },

    archiveInstance: async (id: string): Promise<PlanningInstance> => {
        const response = await api.patch(`/api/v1/planning/instances/${id}/archive`);
        return response.data;
    },

    reactivateInstance: async (id: string): Promise<PlanningInstance> => {
        const response = await api.patch(`/api/v1/planning/instances/${id}/reactivate`);
        return response.data;
    },

    // ── Jobs ──
    getInstanceJobs: async (instanceId: string): Promise<PlanningJob[]> => {
        const response = await api.get(`/api/v1/planning/instances/${instanceId}/jobs`);
        return response.data;
    },

    createJob: async (data: Record<string, unknown>): Promise<PlanningJob> => {
        const response = await api.post('/api/v1/planning/jobs', data);
        return response.data;
    },

    updateJobStatus: async (jobId: string, status: string): Promise<PlanningJob> => {
        const response = await api.patch(`/api/v1/planning/jobs/${jobId}/status`, { status });
        return response.data;
    },

    updateJobPosition: async (jobId: string, position: { x: number; y: number }): Promise<PlanningJob> => {
        const response = await api.patch(`/api/v1/planning/jobs/${jobId}/position`, position);
        return response.data;
    },

    deleteJob: (jobId: string): Promise<void> =>
        api.delete(`/api/v1/planning/jobs/${jobId}`),
};
