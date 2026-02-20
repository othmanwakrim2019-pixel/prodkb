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
    getInstances: (params?: Record<string, unknown>): Promise<PlanningInstance[]> =>
        api.get('/api/v1/planning/instances', { params }).then(r => r.data),

    createInstance: (data: Record<string, unknown>): Promise<PlanningInstance> =>
        api.post('/api/v1/planning/instances', data).then(r => r.data),

    archiveInstance: (id: string): Promise<PlanningInstance> =>
        api.patch(`/api/v1/planning/instances/${id}/archive`).then(r => r.data),

    reactivateInstance: (id: string): Promise<PlanningInstance> =>
        api.patch(`/api/v1/planning/instances/${id}/reactivate`).then(r => r.data),

    // ── Jobs ──
    getInstanceJobs: (instanceId: string): Promise<PlanningJob[]> =>
        api.get(`/api/v1/planning/instances/${instanceId}/jobs`).then(r => r.data),

    createJob: (data: Record<string, unknown>): Promise<PlanningJob> =>
        api.post('/api/v1/planning/jobs', data).then(r => r.data),

    updateJobStatus: (jobId: string, status: string): Promise<PlanningJob> =>
        api.patch(`/api/v1/planning/jobs/${jobId}/status`, { status }).then(r => r.data),

    updateJobPosition: (jobId: string, position: { x: number; y: number }): Promise<PlanningJob> =>
        api.patch(`/api/v1/planning/jobs/${jobId}/position`, position).then(r => r.data),

    deleteJob: (jobId: string): Promise<void> =>
        api.delete(`/api/v1/planning/jobs/${jobId}`),
};
