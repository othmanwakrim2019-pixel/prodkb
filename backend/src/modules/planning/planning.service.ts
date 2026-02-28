
import { prisma } from '../../common/utils/prisma';
import { logger } from '../../common/utils/logger';
import { NotFoundError, ValidationError } from '../../common/errors/app.error';
import { PlanningPeriod, PlanningStatus, TaskType, InstanceStatus, type PlanningJob } from '@prisma/client';

// --- State Transition Validation ---

// BATCH:        pending → running → done/failed | done → pending (reopen)
// MANUAL_ACTION: pending → done/failed/blocked    | done → pending (reopen)
const ALLOWED_TRANSITIONS: Record<PlanningStatus, PlanningStatus[]> = {
    [PlanningStatus.pending]: [PlanningStatus.running, PlanningStatus.done, PlanningStatus.failed, PlanningStatus.blocked],
    [PlanningStatus.running]: [PlanningStatus.done, PlanningStatus.failed, PlanningStatus.pending],
    [PlanningStatus.done]: [PlanningStatus.pending], // allow reopening
    [PlanningStatus.failed]: [PlanningStatus.pending, PlanningStatus.running],
    [PlanningStatus.blocked]: [PlanningStatus.pending],
};

function validateTransition(from: PlanningStatus, to: PlanningStatus): void {
    if (!ALLOWED_TRANSITIONS[from]?.includes(to)) {
        throw new ValidationError(`Status transition from '${from}' to '${to}' is not allowed`);
    }
}

// --- Planning Instance Service ---

export class PlanningInstanceService {

    async findAll(filters?: { period?: PlanningPeriod; status?: InstanceStatus }) {
        const where: Record<string, unknown> = {};
        if (filters?.period) where.period = filters.period;
        if (filters?.status) where.status = filters.status;

        return prisma.planningInstance.findMany({
            where,
            include: {
                createdBy: { select: { id: true, name: true, email: true } },
                _count: { select: { jobs: true } },
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    async findById(id: string) {
        const instance = await prisma.planningInstance.findUnique({
            where: { id },
            include: {
                createdBy: { select: { id: true, name: true, email: true } },
                _count: { select: { jobs: true } },
            },
        });
        if (!instance) throw new NotFoundError('Planning instance not found');
        return instance;
    }

    async create(data: {
        name: string;
        description?: string;
        period: PlanningPeriod;
        startDate: Date;
        endDate: Date;
        createdById: string;
    }) {
        return prisma.planningInstance.create({
            data: {
                name: data.name,
                description: data.description,
                period: data.period,
                startDate: data.startDate,
                endDate: data.endDate,
                createdById: data.createdById,
            },
            include: {
                createdBy: { select: { id: true, name: true, email: true } },
            },
        });
    }

    async archive(id: string) {
        await this.findById(id);
        return prisma.planningInstance.update({
            where: { id },
            data: { status: InstanceStatus.archived },
        });
    }

    async reactivate(id: string) {
        await this.findById(id);
        return prisma.planningInstance.update({
            where: { id },
            data: { status: InstanceStatus.active },
        });
    }

    /**
     * Clone an existing planning instance for the next month.
     * Copies all jobs, advances scheduledTime by 1 month, resets statuses to pending.
     */
    async cloneForNextMonth(instanceId: string, createdById: string) {
        const source = await prisma.planningInstance.findUnique({
            where: { id: instanceId },
            include: { jobs: true },
        });
        if (!source) throw new NotFoundError('Planning instance not found');

        // Advance start/end dates by 1 month
        const advanceMonth = (d: Date) => {
            const next = new Date(d);
            next.setMonth(next.getMonth() + 1);
            return next;
        };

        const newInstance = await prisma.planningInstance.create({
            data: {
                name: source.name.replace(/\d{4}$/, '') + new Date(advanceMonth(source.startDate)).getFullYear()
                    || `${source.name} (Clone)`,
                description: source.description ?? undefined,
                period: source.period,
                startDate: advanceMonth(source.startDate),
                endDate: advanceMonth(source.endDate),
                createdById,
                status: InstanceStatus.active,
            },
        });

        // Map old job IDs to new job IDs to fix dependency references
        const idMap = new Map<string, string>();
        const createdJobs: PlanningJob[] = [];

        for (const job of source.jobs) {
            const newJob = await prisma.planningJob.create({
                data: {
                    instanceId: newInstance.id,
                    systemId: job.systemId,
                    jobId: job.jobId,
                    scheduledTime: advanceMonth(job.scheduledTime),
                    dependencies: [], // fill after all created
                    status: PlanningStatus.pending,
                    taskType: job.taskType,
                    supportContact: job.supportContact ?? undefined,
                    notes: undefined,
                    positionX: job.positionX ?? undefined,
                    positionY: job.positionY ?? undefined,
                },
            });
            idMap.set(job.id, newJob.id);
            createdJobs.push(newJob);
        }

        // Now fix dependency references using the id map
        for (let i = 0; i < source.jobs.length; i++) {
            const oldJob = source.jobs[i];
            const newJobId = idMap.get(oldJob.id)!;
            const oldDeps = oldJob.dependencies as string[];
            const newDeps = oldDeps.map(depId => idMap.get(depId) || depId);

            if (newDeps.length > 0) {
                await prisma.planningJob.update({
                    where: { id: newJobId },
                    data: { dependencies: newDeps },
                });
            }
        }

        logger.info(`Cloned planning instance ${instanceId} → ${newInstance.id} with ${createdJobs.length} jobs`);

        return prisma.planningInstance.findUnique({
            where: { id: newInstance.id },
            include: {
                createdBy: { select: { id: true, name: true, email: true } },
                _count: { select: { jobs: true } },
            },
        });
    }
}

// --- Planning Job Service ---

export class PlanningJobService {

    private includeRelations = {
        system: { select: { id: true, name: true } },
        job: { select: { id: true, name: true, code: true } },
        completedBy: { select: { id: true, name: true } },
        launchedBy: { select: { id: true, name: true } },
    };

    async findByInstance(instanceId: string) {
        return prisma.planningJob.findMany({
            where: { instanceId },
            include: this.includeRelations,
            orderBy: { scheduledTime: 'asc' },
        });
    }

    async findById(id: string) {
        const job = await prisma.planningJob.findUnique({
            where: { id },
            include: this.includeRelations,
        });
        if (!job) throw new NotFoundError('Planning job not found');
        return job;
    }

    async create(data: {
        instanceId: string;
        systemId: string;
        jobId: string;
        scheduledTime: Date;
        dependencies: string[];
        status?: PlanningStatus;
        taskType?: TaskType;
        supportContact?: string;
        notes?: string;
    }) {
        const instance = await prisma.planningInstance.findUnique({ where: { id: data.instanceId } });
        if (!instance) throw new NotFoundError('Planning instance not found');
        if (instance.status === InstanceStatus.archived) {
            throw new ValidationError('Cannot add jobs to an archived planning instance');
        }

        if (data.dependencies.length > 0) {
            await this.validateDependencies(data.dependencies, data.instanceId);
        }

        return prisma.planningJob.create({
            data: {
                instanceId: data.instanceId,
                systemId: data.systemId,
                jobId: data.jobId,
                scheduledTime: data.scheduledTime,
                dependencies: data.dependencies,
                status: data.status || PlanningStatus.pending,
                taskType: data.taskType || TaskType.BATCH,
                supportContact: data.supportContact,
                notes: data.notes,
            },
            include: this.includeRelations,
        });
    }

    async update(id: string, data: {
        systemId?: string;
        jobId?: string;
        scheduledTime?: Date;
        dependencies?: string[];
        taskType?: TaskType;
        supportContact?: string | null;
        notes?: string | null;
    }) {
        const existing = await this.findById(id);

        if (data.dependencies && data.dependencies.length > 0) {
            await this.validateDependencies(data.dependencies, existing.instanceId, id);

            const allJobs = await prisma.planningJob.findMany({
                where: { instanceId: existing.instanceId },
            });
            if (this.detectCycle(id, data.dependencies, allJobs)) {
                throw new ValidationError('Circular dependency detected');
            }
        }

        return prisma.planningJob.update({
            where: { id },
            data: {
                ...(data.systemId !== undefined && { systemId: data.systemId }),
                ...(data.jobId !== undefined && { jobId: data.jobId }),
                ...(data.scheduledTime !== undefined && { scheduledTime: data.scheduledTime }),
                ...(data.dependencies !== undefined && { dependencies: data.dependencies }),
                ...(data.taskType !== undefined && { taskType: data.taskType }),
                ...(data.supportContact !== undefined && { supportContact: data.supportContact }),
                ...(data.notes !== undefined && { notes: data.notes }),
            },
            include: this.includeRelations,
        });
    }

    async delete(id: string) {
        const job = await this.findById(id);

        const siblings = await prisma.planningJob.findMany({
            where: { instanceId: job.instanceId },
        });

        const cleanupPromises = siblings
            .filter(s => {
                const deps = s.dependencies as string[];
                return deps.includes(id);
            })
            .map(s => {
                const deps = (s.dependencies as string[]).filter(depId => depId !== id);
                return prisma.planningJob.update({
                    where: { id: s.id },
                    data: { dependencies: deps },
                });
            });

        await Promise.all(cleanupPromises);
        await prisma.planningJob.delete({ where: { id } });

        logger.info(`Deleted planning job ${id}, cleaned ${cleanupPromises.length} dependency references`);
        return job;
    }

    /**
     * Update job status with type-aware transitions and tracking timestamps.
     */
    async updateStatus(id: string, newStatus: PlanningStatus, userId?: string, notes?: string) {
        const job = await this.findById(id);
        validateTransition(job.status, newStatus);

        // For MANUAL_ACTION going to done, require a note
        if (job.taskType === TaskType.MANUAL_ACTION && newStatus === PlanningStatus.done && !notes) {
            throw new ValidationError('A confirmation note is required when marking a manual action as done');
        }

        const updateData: Record<string, unknown> = { status: newStatus };

        if (newStatus === PlanningStatus.running && job.taskType === TaskType.BATCH) {
            updateData.launchedAt = new Date();
            updateData.launchedById = userId || null;
        }

        if (newStatus === PlanningStatus.done) {
            updateData.completedAt = new Date();
            updateData.completedById = userId || null;
            if (notes) updateData.notes = notes;
        }

        if (newStatus === PlanningStatus.pending) {
            // Clear all tracking when reopened
            updateData.completedAt = null;
            updateData.completedById = null;
            updateData.launchedAt = null;
            updateData.launchedById = null;
        }

        const updated = await prisma.planningJob.update({
            where: { id },
            data: updateData,
            include: this.includeRelations,
        });

        // If marked done, cascade-activate dependents
        if (newStatus === PlanningStatus.done) {
            await this.cascadeActivation(id, job.instanceId);
        }

        return updated;
    }

    async complete(id: string, userId?: string, notes?: string) {
        return this.updateStatus(id, PlanningStatus.done, userId, notes);
    }

    async updatePosition(id: string, positionX: number, positionY: number) {
        return prisma.planningJob.update({
            where: { id },
            data: { positionX, positionY },
        });
    }

    async updatePositions(positions: Array<{ id: string; positionX: number; positionY: number }>) {
        const updates = positions.map(pos =>
            prisma.planningJob.update({
                where: { id: pos.id },
                data: { positionX: pos.positionX, positionY: pos.positionY },
            })
        );
        await Promise.all(updates);
    }

    // --- Private helpers ---

    private async cascadeActivation(completedJobId: string, instanceId: string) {
        const allJobs = await prisma.planningJob.findMany({
            where: { instanceId },
        });

        const activated: string[] = [];

        for (const candidate of allJobs) {
            const deps = candidate.dependencies as string[];
            if (!deps.includes(completedJobId)) continue;
            if (candidate.status !== PlanningStatus.blocked && candidate.status !== PlanningStatus.pending) continue;

            const allDepsDone = deps.every(depId => {
                if (depId === completedJobId) return true;
                const depJob = allJobs.find(j => j.id === depId);
                return depJob?.status === PlanningStatus.done;
            });

            if (allDepsDone) {
                await prisma.planningJob.update({
                    where: { id: candidate.id },
                    data: { status: PlanningStatus.pending },
                });
                activated.push(candidate.id);
            }
        }

        if (activated.length > 0) {
            logger.info(`Completing job ${completedJobId} unblocked ${activated.length} downstream jobs: ${activated.join(', ')}`);
        }
    }

    private async validateDependencies(depIds: string[], instanceId: string, excludeId?: string) {
        if (excludeId && depIds.includes(excludeId)) {
            throw new ValidationError('A job cannot depend on itself');
        }

        const existing = await prisma.planningJob.findMany({
            where: { id: { in: depIds }, instanceId },
            select: { id: true },
        });

        const foundIds = new Set(existing.map(j => j.id));
        const missing = depIds.filter(id => !foundIds.has(id));

        if (missing.length > 0) {
            throw new ValidationError(
                `Dependencies not found in this instance: ${missing.join(', ')}`
            );
        }
    }

    private detectCycle(jobId: string, deps: string[], allJobs: PlanningJob[]): boolean {
        const visited = new Set<string>();
        const stack = [...deps];
        while (stack.length > 0) {
            const current = stack.pop()!;
            if (current === jobId) return true;
            if (visited.has(current)) continue;
            visited.add(current);
            const job = allJobs.find(j => j.id === current);
            if (job) stack.push(...(job.dependencies as string[]));
        }
        return false;
    }
}

export const planningInstanceService = new PlanningInstanceService();
export const planningJobService = new PlanningJobService();
