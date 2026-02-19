export type PlanningPeriod = 'monthly' | 'quarterly' | 'annual';
export type PlanningStatusType = 'pending' | 'running' | 'done';
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
    systemId: string;
    jobId: string;
    scheduledTime: string;
    dependencies: string[];
    status: PlanningStatusType;
    positionX: number | null;
    positionY: number | null;
    completedAt: string | null;
    completedById: string | null;
    completedBy: {
        id: string;
        name: string;
    } | null;
    system: {
        id: string;
        name: string;
    };
    job: {
        id: string;
        name: string;
        code: string;
    };
    createdAt: string;
    updatedAt: string;
}

export interface CreatePlanningJobPayload {
    instanceId: string;
    systemId: string;
    jobId: string;
    scheduledTime: string;
    dependencies: string[];
    status?: PlanningStatusType;
}

export interface CreateInstancePayload {
    name: string;
    description?: string;
    period: PlanningPeriod;
    startDate: string;
    endDate: string;
}
