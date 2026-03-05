export type PlanningPeriod = 'monthly' | 'quarterly' | 'annual';
export type PlanningStatusType = 'pending' | 'running' | 'done' | 'failed' | 'blocked';
export type TaskType = 'BATCH' | 'MANUAL_ACTION';
export type InstanceStatusType = 'active' | 'archived';

export interface PlanningInstance {
    id: string;
    name: string;
    description?: string;
    period: PlanningPeriod;
    startDate: string;
    endDate: string;
    status: InstanceStatusType;
    createdBy: {
        id: string;
        name: string;
        email: string;
    };
    _count: {
        jobs: number;
    };
    createdAt: string;
    updatedAt: string;
}

export interface PlanningJob {
    id: string;
    instanceId: string;
    systemId: string | null;
    jobId: string | null;
    customTaskName: string | null;
    scheduledTime: string;
    dependencies: string[];
    status: PlanningStatusType;
    taskType: TaskType;
    supportContact: string | null;
    notes: string | null;
    positionX: number | null;
    positionY: number | null;
    launchedAt: string | null;
    launchedById: string | null;
    launchedBy: {
        id: string;
        name: string;
    } | null;
    completedAt: string | null;
    completedById: string | null;
    completedBy: {
        id: string;
        name: string;
    } | null;
    system: {
        id: string;
        name: string;
    } | null;
    job: {
        id: string;
        name: string;
        code: string;
    } | null;
    createdAt: string;
    updatedAt: string;
}

export interface CreatePlanningJobPayload {
    instanceId: string;
    systemId?: string;
    jobId?: string;
    customTaskName?: string;
    scheduledTime: string;
    dependencies: string[];
    status?: PlanningStatusType;
    taskType?: TaskType;
    supportContact?: string;
    notes?: string;
}

export interface CreateInstancePayload {
    name: string;
    description?: string;
    period: PlanningPeriod;
    startDate: string;
    endDate: string;
}
