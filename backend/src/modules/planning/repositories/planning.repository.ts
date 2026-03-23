import { InstanceStatus, PlanningPeriod, PlanningStatus, TaskType } from '@prisma/client';
import { prisma } from '../../../common/utils/prisma';

const instanceSummaryInclude = {
    createdBy: { select: { id: true, name: true, email: true } },
    _count: { select: { jobs: true } },
} as const;

const jobIncludeRelations = {
    system: { select: { id: true, name: true } },
    job: { select: { id: true, name: true, code: true } },
    completedBy: { select: { id: true, name: true } },
    launchedBy: { select: { id: true, name: true } },
} as const;

export class PlanningRepository {
    async findInstances(filters?: { period?: PlanningPeriod; status?: InstanceStatus }) {
        const where: Record<string, unknown> = {};
        if (filters?.period) where.period = filters.period;
        if (filters?.status) where.status = filters.status;

        return prisma.planningInstance.findMany({
            where,
            include: instanceSummaryInclude,
            orderBy: { createdAt: 'desc' },
        });
    }

    async findInstanceById(id: string) {
        return prisma.planningInstance.findUnique({
            where: { id },
            include: instanceSummaryInclude,
        });
    }

    async findInstanceRecord(id: string) {
        return prisma.planningInstance.findUnique({ where: { id } });
    }

    async findInstanceWithJobs(id: string) {
        return prisma.planningInstance.findUnique({
            where: { id },
            include: { jobs: true },
        });
    }

    async createInstance(data: {
        name: string;
        description?: string;
        period: PlanningPeriod;
        startDate: Date;
        endDate: Date;
        createdById: string;
        status?: InstanceStatus;
    }) {
        return prisma.planningInstance.create({
            data: {
                name: data.name,
                description: data.description,
                period: data.period,
                startDate: data.startDate,
                endDate: data.endDate,
                createdById: data.createdById,
                ...(data.status && { status: data.status }),
            },
            include: {
                createdBy: { select: { id: true, name: true, email: true } },
            },
        });
    }

    async updateInstanceStatus(id: string, status: InstanceStatus) {
        return prisma.planningInstance.update({
            where: { id },
            data: { status },
        });
    }

    async deleteInstance(id: string) {
        return prisma.planningInstance.delete({ where: { id } });
    }

    async findJobsByInstance(instanceId: string) {
        return prisma.planningJob.findMany({
            where: { instanceId },
            include: jobIncludeRelations,
            orderBy: { scheduledTime: 'asc' },
        });
    }

    async findJobsByInstanceRaw(instanceId: string) {
        return prisma.planningJob.findMany({
            where: { instanceId },
        });
    }

    async findJobById(id: string) {
        return prisma.planningJob.findUnique({
            where: { id },
            include: jobIncludeRelations,
        });
    }

    async findInstanceRef(id: string) {
        return prisma.planningInstance.findUnique({ where: { id } });
    }

    async createJob(data: {
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
    }) {
        return prisma.planningJob.create({
            data: {
                instanceId: data.instanceId,
                systemId: data.systemId ?? undefined,
                jobId: data.jobId ?? undefined,
                customTaskName: data.customTaskName ?? undefined,
                scheduledTime: data.scheduledTime,
                dependencies: data.dependencies,
                status: data.status || PlanningStatus.pending,
                taskType: data.taskType || TaskType.BATCH,
                supportContact: data.supportContact,
                notes: data.notes,
                positionX: data.positionX,
                positionY: data.positionY,
            },
            include: jobIncludeRelations,
        });
    }

    async updateJob(
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
    ) {
        return prisma.planningJob.update({
            where: { id },
            data,
            include: jobIncludeRelations,
        });
    }

    async updateJobDependencies(id: string, dependencies: string[]) {
        return prisma.planningJob.update({
            where: { id },
            data: { dependencies },
        });
    }

    async deleteJob(id: string) {
        return prisma.planningJob.delete({ where: { id } });
    }

    async findJobsByIdsInInstance(depIds: string[], instanceId: string) {
        return prisma.planningJob.findMany({
            where: { id: { in: depIds }, instanceId },
            select: { id: true },
        });
    }

    async findJobStatusesByIds(ids: string[]) {
        return prisma.planningJob.findMany({
            where: { id: { in: ids } },
            select: { id: true, status: true },
        });
    }

    async findEarlierBlockingJobs(instanceId: string, scheduledTime: Date, excludedJobId: string) {
        return prisma.planningJob.findMany({
            where: {
                instanceId,
                scheduledTime: { lt: scheduledTime },
                status: { in: [PlanningStatus.pending, PlanningStatus.running] },
                id: { not: excludedJobId },
            },
            select: { id: true, scheduledTime: true },
            take: 1,
        });
    }

    async updateJobPositions(positions: Array<{ id: string; positionX: number; positionY: number }>) {
        await Promise.all(
            positions.map((position) =>
                prisma.planningJob.update({
                    where: { id: position.id },
                    data: { positionX: position.positionX, positionY: position.positionY },
                })
            )
        );
    }

    async findSystemByNameInsensitive(name: string) {
        return prisma.system.findFirst({
            where: { name: { equals: name, mode: 'insensitive' } },
        });
    }

    async findJobByCodeAndSystem(code: string, systemId: string) {
        return prisma.job.findFirst({
            where: { code: { equals: code, mode: 'insensitive' }, systemId },
        });
    }

    async createImportedInstanceWithJobs(params: {
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
    }) {
        const { instanceName, period, startDate, endDate, createdById, jobs, resolvedDeps } = params;

        return prisma.$transaction(async (tx) => {
            const instance = await tx.planningInstance.create({
                data: {
                    name: instanceName,
                    period,
                    startDate,
                    endDate,
                    createdById,
                    status: InstanceStatus.active,
                },
            });

            const createdJobIds: string[] = [];
            for (const job of jobs) {
                const created = await tx.planningJob.create({
                    data: {
                        instanceId: instance.id,
                        taskType: job.taskType === 'BATCH' ? TaskType.BATCH : TaskType.MANUAL_ACTION,
                        scheduledTime: job.scheduledTime,
                        systemId: job.systemId ?? undefined,
                        jobId: job.jobId ?? undefined,
                        customTaskName: job.customTaskName ?? undefined,
                        supportContact: job.supportContact ?? undefined,
                        status: PlanningStatus.pending,
                        dependencies: [],
                    },
                });
                createdJobIds.push(created.id);
            }

            for (let index = 0; index < jobs.length; index++) {
                const depIndexes = resolvedDeps.get(index) || [];
                if (depIndexes.length > 0) {
                    await tx.planningJob.update({
                        where: { id: createdJobIds[index] },
                        data: { dependencies: depIndexes.map((depIndex) => createdJobIds[depIndex]) },
                    });
                }
            }

            return instance;
        });
    }
}

export const planningRepository = new PlanningRepository();
