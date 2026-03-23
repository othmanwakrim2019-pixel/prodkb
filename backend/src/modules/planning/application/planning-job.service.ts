import { PlanningStatus, TaskType, InstanceStatus, type PlanningJob } from '@prisma/client';
import { logger } from '../../../common/utils/logger';
import { NotFoundError, ValidationError } from '../../../common/errors/app.error';
import { validatePlanningTransition } from './planning.rules';
import { planningRepository } from '../repositories/planning.repository';

export class PlanningJobService {
    async findByInstance(instanceId: string) {
        return planningRepository.findJobsByInstance(instanceId);
    }

    async findById(id: string) {
        const job = await planningRepository.findJobById(id);
        if (!job) throw new NotFoundError('Planning job not found');
        return job;
    }

    async create(data: {
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
    }) {
        const instance = await planningRepository.findInstanceRef(data.instanceId);
        if (!instance) throw new NotFoundError('Planning instance not found');
        if (instance.status === InstanceStatus.archived) {
            throw new ValidationError('Cannot add jobs to an archived planning instance');
        }

        if (data.dependencies.length > 0) {
            await this.validateDependencies(data.dependencies, data.instanceId);
        }

        return planningRepository.createJob(data);
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

            const allJobs = await planningRepository.findJobsByInstanceRaw(existing.instanceId);
            if (this.detectCycle(id, data.dependencies, allJobs)) {
                throw new ValidationError('Circular dependency detected');
            }
        }

        return planningRepository.updateJob(id, {
            ...(data.systemId !== undefined && { systemId: data.systemId }),
            ...(data.jobId !== undefined && { jobId: data.jobId }),
            ...(data.scheduledTime !== undefined && { scheduledTime: data.scheduledTime }),
            ...(data.dependencies !== undefined && { dependencies: data.dependencies }),
            ...(data.taskType !== undefined && { taskType: data.taskType }),
            ...(data.supportContact !== undefined && { supportContact: data.supportContact }),
            ...(data.notes !== undefined && { notes: data.notes }),
        });
    }

    async delete(id: string) {
        const job = await this.findById(id);

        const siblings = await planningRepository.findJobsByInstanceRaw(job.instanceId);
        const cleanupPromises = siblings
            .filter((sibling) => (sibling.dependencies as string[]).includes(id))
            .map((sibling) => {
                const dependencies = (sibling.dependencies as string[]).filter((depId) => depId !== id);
                return planningRepository.updateJobDependencies(sibling.id, dependencies);
            });

        await Promise.all(cleanupPromises);
        await planningRepository.deleteJob(id);

        logger.info(`Deleted planning job ${id}, cleaned ${cleanupPromises.length} dependency references`);
        return job;
    }

    async updateStatus(id: string, newStatus: PlanningStatus, userId?: string, notes?: string) {
        const job = await this.findById(id);
        validatePlanningTransition(job.status, newStatus);

        if (newStatus === PlanningStatus.running) {
            const dependencies = job.dependencies as string[];

            if (dependencies.length > 0) {
                const depJobs = await planningRepository.findJobStatusesByIds(dependencies);
                const notDone = depJobs.filter((depJob) => depJob.status !== PlanningStatus.done);
                if (notDone.length > 0) {
                    throw new ValidationError(`Cannot start this task: ${notDone.length} dependency(ies) are not yet completed.`);
                }
            }

            const earlierBlocking = await planningRepository.findEarlierBlockingJobs(job.instanceId, job.scheduledTime, id);
            if (earlierBlocking.length > 0) {
                const blockedDate = new Date(earlierBlocking[0].scheduledTime).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
                throw new ValidationError(`Cannot start this task: there are earlier-scheduled tasks (${blockedDate}) that have not been completed yet.`);
            }
        }

        if (job.taskType === TaskType.MANUAL_ACTION && newStatus === PlanningStatus.done && !notes) {
            throw new ValidationError('A confirmation note is required when marking a manual action as done');
        }

        const updateData: Record<string, unknown> = { status: newStatus };
        if (newStatus === PlanningStatus.running) {
            updateData.launchedAt = new Date();
            updateData.launchedById = userId || null;
        }
        if (newStatus === PlanningStatus.done) {
            updateData.completedAt = new Date();
            updateData.completedById = userId || null;
            if (notes) updateData.notes = notes;
        }
        if (newStatus === PlanningStatus.pending) {
            updateData.completedAt = null;
            updateData.completedById = null;
            updateData.launchedAt = null;
            updateData.launchedById = null;
        }

        const updated = await planningRepository.updateJob(id, updateData);

        if (newStatus === PlanningStatus.done) {
            await this.cascadeActivation(id, job.instanceId);
        }

        return updated;
    }

    async complete(id: string, userId?: string, notes?: string) {
        return this.updateStatus(id, PlanningStatus.done, userId, notes);
    }

    async updatePosition(id: string, positionX: number, positionY: number) {
        return planningRepository.updateJob(id, { positionX, positionY });
    }

    async updatePositions(positions: Array<{ id: string; positionX: number; positionY: number }>) {
        await planningRepository.updateJobPositions(positions);
    }

    private async cascadeActivation(completedJobId: string, instanceId: string) {
        const allJobs = await planningRepository.findJobsByInstanceRaw(instanceId);
        const autoStarted: string[] = [];
        const unblocked: string[] = [];

        for (const candidate of allJobs) {
            const dependencies = candidate.dependencies as string[];
            if (!dependencies.includes(completedJobId)) continue;
            if (candidate.status !== PlanningStatus.blocked && candidate.status !== PlanningStatus.pending) continue;

            const allDepsDone = dependencies.every((depId) => {
                if (depId === completedJobId) return true;
                const depJob = allJobs.find((job) => job.id === depId);
                return depJob?.status === PlanningStatus.done;
            });

            if (!allDepsDone) continue;

            if (candidate.taskType === TaskType.BATCH) {
                await planningRepository.updateJob(candidate.id, {
                    status: PlanningStatus.running,
                    launchedAt: new Date(),
                });
                autoStarted.push(candidate.id);
            } else {
                await planningRepository.updateJob(candidate.id, { status: PlanningStatus.pending });
                unblocked.push(candidate.id);
            }
        }

        if (autoStarted.length > 0) {
            logger.info(`Job ${completedJobId} done -> auto-started ${autoStarted.length} downstream BATCH job(s): ${autoStarted.join(', ')}`);
        }
        if (unblocked.length > 0) {
            logger.info(`Job ${completedJobId} done -> unblocked ${unblocked.length} MANUAL job(s) awaiting user: ${unblocked.join(', ')}`);
        }
    }

    private async validateDependencies(depIds: string[], instanceId: string, excludeId?: string) {
        if (excludeId && depIds.includes(excludeId)) {
            throw new ValidationError('A job cannot depend on itself');
        }

        const existing = await planningRepository.findJobsByIdsInInstance(depIds, instanceId);
        const foundIds = new Set(existing.map((job) => job.id));
        const missing = depIds.filter((id) => !foundIds.has(id));
        if (missing.length > 0) {
            throw new ValidationError(`Dependencies not found in this instance: ${missing.join(', ')}`);
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
            const job = allJobs.find((candidate) => candidate.id === current);
            if (job) stack.push(...(job.dependencies as string[]));
        }
        return false;
    }
}

export const planningJobService = new PlanningJobService();
