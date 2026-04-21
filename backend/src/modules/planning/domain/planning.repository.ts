import { InstanceStatus, PlanningPeriod, PlanningStatus, TaskType } from '@prisma/client';

export interface IPlanningRepository {
    findInstances(filters?: { period?: PlanningPeriod; status?: InstanceStatus }): Promise<any[]>;
    findInstanceById(id: string): Promise<any | null>;
    findInstanceRecord(id: string): Promise<any | null>;
    findInstanceWithJobs(id: string): Promise<any | null>;
    createInstance(data: {
        name: string;
        description?: string;
        period: PlanningPeriod;
        startDate: Date;
        endDate: Date;
        createdById: string;
        status?: InstanceStatus;
    }): Promise<any>;
    updateInstanceStatus(id: string, status: InstanceStatus): Promise<any>;
    deleteInstance(id: string): Promise<any>;
    findJobsByInstance(instanceId: string): Promise<any[]>;
    findJobsByInstanceRaw(instanceId: string): Promise<any[]>;
    findJobById(id: string): Promise<any | null>;
    findInstanceRef(id: string): Promise<any | null>;
    createJob(data: {
        instanceId: string;
        systemId?: string;
        jobId?: string;
        customTaskName?: string;
        scheduledTime: Date;
        dependencies: string[];
        status?: PlanningStatus;
        taskType?: TaskType;
        supportContact?: string;
        notes?: string;
        positionX?: number;
        positionY?: number;
    }): Promise<any>;
    updateJob(
        id: string,
        data: {
            systemId?: string;
            jobId?: string;
            scheduledTime?: Date;
            dependencies?: string[];
            taskType?: TaskType;
            supportContact?: string | null;
            notes?: string | null;
            status?: PlanningStatus;
            launchedAt?: Date | null;
            launchedById?: string | null;
            completedAt?: Date | null;
            completedById?: string | null;
            positionX?: number;
            positionY?: number;
        }
    ): Promise<any>;
    updateJobDependencies(id: string, dependencies: string[]): Promise<any>;
    deleteJob(id: string): Promise<any>;
    findJobsByIdsInInstance(depIds: string[], instanceId: string): Promise<{ id: string }[]>;
    findJobStatusesByIds(ids: string[]): Promise<{ id: string; status: PlanningStatus }[]>;
    findEarlierBlockingJobs(instanceId: string, scheduledTime: Date, excludedJobId: string): Promise<{ id: string; scheduledTime: Date }[]>;
    updateJobPositions(positions: Array<{ id: string; positionX: number; positionY: number }>): Promise<void>;
    findSystemByNameInsensitive(name: string): Promise<any | null>;
    findJobByCodeAndSystem(code: string, systemId: string): Promise<any | null>;
    createImportedInstanceWithJobs(params: {
        instanceName: string;
        period: PlanningPeriod;
        startDate: Date;
        endDate: Date;
        createdById: string;
        jobs: Array<{
            taskType: 'BATCH' | 'MANUAL';
            scheduledTime: Date;
            customTaskName?: string;
            systemId?: string;
            jobId?: string;
            supportContact?: string;
        }>;
        resolvedDeps: Map<number, number[]>;
    }): Promise<any>;
}
