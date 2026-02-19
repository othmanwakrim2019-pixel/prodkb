export type PlanningPeriod = 'monthly' | 'quarterly' | 'annual';
export type PlanningStatusType = 'pending' | 'running' | 'done';

export interface PlanningJob {
    id: string;
    name: string;
    application: string;
    scheduledTime: string;
    period: PlanningPeriod;
    dependencies: string[];
    status: PlanningStatusType;
    createdAt: string;
    updatedAt: string;
}

export interface CreatePlanningJobPayload {
    name: string;
    application: string;
    scheduledTime: string;
    period: PlanningPeriod;
    dependencies: string[];
    status?: PlanningStatusType;
}
