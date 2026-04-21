import axios from '../../../utils/axios';
import { unwrapArray, unwrapObject } from '../../../utils/api-response';
import type { System } from '../../../types';
import type {
    CreateInstancePayload,
    CreatePlanningJobPayload,
    InstanceStatusType,
    PlanningInstance,
    PlanningJob,
    PlanningPeriod,
    PlanningStatusType,
} from '../model/planning';

interface ListPlanningInstancesParams {
    period: PlanningPeriod;
    status?: InstanceStatusType;
}

export const planningService = {
    async listSystems(): Promise<System[]> {
        const response = await axios.get('/api/v1/systems');
        return unwrapArray<System>(response.data, ['data', 'items', 'systems']);
    },

    async listInstances(params: ListPlanningInstancesParams): Promise<PlanningInstance[]> {
        const response = await axios.get('/api/v1/planning/instances', { params });
        return unwrapArray<PlanningInstance>(response.data, ['data', 'items', 'instances']);
    },

    async createInstance(payload: CreateInstancePayload) {
        await axios.post('/api/v1/planning/instances', payload);
    },

    async listInstanceJobs(instanceId: string): Promise<PlanningJob[]> {
        const response = await axios.get(`/api/v1/planning/instances/${instanceId}/jobs`);
        return unwrapArray<PlanningJob>(response.data, ['data', 'items', 'jobs']);
    },

    async createJob(payload: CreatePlanningJobPayload) {
        await axios.post('/api/v1/planning/jobs', payload);
    },

    async updateJob(jobId: string, payload: Record<string, unknown>) {
        await axios.put(`/api/v1/planning/jobs/${jobId}`, payload);
    },

    async updateJobStatus(jobId: string, status: PlanningStatusType, notes?: string) {
        await axios.patch(`/api/v1/planning/jobs/${jobId}/status`, { status, notes });
    },

    async updateJobPosition(jobId: string, positionX: number, positionY: number) {
        await axios.patch(`/api/v1/planning/jobs/${jobId}/position`, { positionX, positionY });
    },

    async deleteJob(jobId: string) {
        await axios.delete(`/api/v1/planning/jobs/${jobId}`);
    },

    async archiveInstance(instanceId: string) {
        await axios.patch(`/api/v1/planning/instances/${instanceId}/archive`);
    },

    async reactivateInstance(instanceId: string) {
        await axios.patch(`/api/v1/planning/instances/${instanceId}/reactivate`);
    },

    async deleteInstance(instanceId: string) {
        await axios.delete(`/api/v1/planning/instances/${instanceId}`);
    },

    async cloneInstance(instanceId: string): Promise<PlanningInstance | null> {
        const response = await axios.post(`/api/v1/planning/instances/${instanceId}/clone`);
        return unwrapObject<PlanningInstance>(response.data);
    },

    async importFromCsv(file: File, instanceName: string, period: PlanningPeriod) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('instanceName', instanceName);
        formData.append('period', period);

        const response = await axios.post('/api/v1/planning/import', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });

        return (unwrapObject<{
            instance: { id: string; name: string };
            jobsCreated: number;
            skipped: string[];
            warnings: string[];
        }>(response.data) ?? {
            instance: { id: '', name: '' },
            jobsCreated: 0,
            skipped: [],
            warnings: [],
        });
    },
};
