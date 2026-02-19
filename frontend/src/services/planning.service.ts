/**
 * Planning API Service — instances, jobs, scheduling
 */
import { api } from '../lib/api';

export const planningService = {
    // ── Instances ──
    getInstances: (params?: Record<string, unknown>): Promise<unknown> =>
        api.get('/api/v1/planning/instances', { params }).then(r => r.data),

    createInstance: (data: Record<string, unknown>): Promise<unknown> =>
        api.post('/api/v1/planning/instances', data).then(r => r.data),

    archiveInstance: (id: string): Promise<unknown> =>
        api.patch(`/api/v1/planning/instances/${id}/archive`).then(r => r.data),

    reactivateInstance: (id: string): Promise<unknown> =>
        api.patch(`/api/v1/planning/instances/${id}/reactivate`).then(r => r.data),

    // ── Jobs ──
    getInstanceJobs: (instanceId: string): Promise<unknown> =>
        api.get(`/api/v1/planning/instances/${instanceId}/jobs`).then(r => r.data),

    createJob: (data: Record<string, unknown>): Promise<unknown> =>
        api.post('/api/v1/planning/jobs', data).then(r => r.data),

    updateJobStatus: (jobId: string, status: string): Promise<unknown> =>
        api.patch(`/api/v1/planning/jobs/${jobId}/status`, { status }).then(r => r.data),

    updateJobPosition: (jobId: string, position: { x: number; y: number }): Promise<unknown> =>
        api.patch(`/api/v1/planning/jobs/${jobId}/position`, position).then(r => r.data),

    deleteJob: (jobId: string): Promise<void> =>
        api.delete(`/api/v1/planning/jobs/${jobId}`),
};
