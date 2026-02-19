
import { prisma } from '../../common/utils/prisma';
import { logger } from '../../common/utils/logger';
import { NotFoundError, ValidationError } from '../../common/errors/app.error';
import { PlanningPeriod, PlanningStatus } from '@prisma/client';

export class PlanningService {
    /**
     * Get all planning jobs for a given period.
     */
    async findByPeriod(period: PlanningPeriod) {
        return prisma.planningJob.findMany({
            where: { period },
            orderBy: { scheduledTime: 'asc' },
        });
    }

    /**
     * Find a single planning job by ID.
     */
    async findById(id: string) {
        const job = await prisma.planningJob.findUnique({ where: { id } });
        if (!job) throw new NotFoundError('Planning job not found');
        return job;
    }

    /**
     * Create a new planning job.
     * Validates that all referenced dependency IDs exist and belong to the same period.
     */
    async create(data: {
        name: string;
        application: string;
        scheduledTime: Date;
        period: PlanningPeriod;
        dependencies: string[];
        status?: PlanningStatus;
    }) {
        if (data.dependencies.length > 0) {
            await this.validateDependencies(data.dependencies, data.period);
        }

        return prisma.planningJob.create({
            data: {
                name: data.name,
                application: data.application,
                scheduledTime: data.scheduledTime,
                period: data.period,
                dependencies: data.dependencies,
                status: data.status || PlanningStatus.pending,
            },
        });
    }

    /**
     * Update an existing planning job.
     */
    async update(id: string, data: {
        name?: string;
        application?: string;
        scheduledTime?: Date;
        period?: PlanningPeriod;
        dependencies?: string[];
        status?: PlanningStatus;
    }) {
        const existing = await this.findById(id);

        // If dependencies are being updated, validate them against the target period
        if (data.dependencies && data.dependencies.length > 0) {
            const targetPeriod = data.period || existing.period;
            await this.validateDependencies(data.dependencies, targetPeriod, id);
        }

        return prisma.planningJob.update({
            where: { id },
            data: {
                ...(data.name !== undefined && { name: data.name }),
                ...(data.application !== undefined && { application: data.application }),
                ...(data.scheduledTime !== undefined && { scheduledTime: data.scheduledTime }),
                ...(data.period !== undefined && { period: data.period }),
                ...(data.dependencies !== undefined && { dependencies: data.dependencies }),
                ...(data.status !== undefined && { status: data.status }),
            },
        });
    }

    /**
     * Delete a planning job.
     * Also removes this job's ID from the dependencies arrays of other jobs.
     */
    async delete(id: string) {
        const job = await this.findById(id);

        // Find all jobs in the same period that reference this job as a dependency
        const dependents = await prisma.planningJob.findMany({
            where: { period: job.period },
        });

        // Remove the deleted job's ID from their dependency arrays
        const updatePromises = dependents
            .filter(d => {
                const deps = d.dependencies as string[];
                return deps.includes(id);
            })
            .map(d => {
                const deps = (d.dependencies as string[]).filter(depId => depId !== id);
                return prisma.planningJob.update({
                    where: { id: d.id },
                    data: { dependencies: deps },
                });
            });

        await Promise.all(updatePromises);
        await prisma.planningJob.delete({ where: { id } });

        logger.info(`Deleted planning job ${id} and cleaned up ${updatePromises.length} dependency references`);
        return job;
    }

    /**
     * Mark a job as done, then cascade-activate any dependents whose
     * dependencies are now all satisfied.
     */
    async complete(id: string) {
        const job = await this.findById(id);

        if (job.status === PlanningStatus.done) {
            throw new ValidationError('Job is already marked as done');
        }

        // Mark this job as done
        const completed = await prisma.planningJob.update({
            where: { id },
            data: { status: PlanningStatus.done },
        });

        // Find all jobs in the same period that depend on this job
        const allJobsInPeriod = await prisma.planningJob.findMany({
            where: { period: job.period },
        });

        const activatedJobs: string[] = [];

        for (const candidate of allJobsInPeriod) {
            const deps = candidate.dependencies as string[];
            if (!deps.includes(id)) continue; // Doesn't depend on the completed job
            if (candidate.status !== PlanningStatus.pending) continue; // Already running or done

            // Check if ALL dependencies of this candidate are now done
            const allDepsDone = deps.every(depId => {
                if (depId === id) return true; // The one we just completed
                const depJob = allJobsInPeriod.find(j => j.id === depId);
                return depJob?.status === PlanningStatus.done;
            });

            if (allDepsDone) {
                await prisma.planningJob.update({
                    where: { id: candidate.id },
                    data: { status: PlanningStatus.running },
                });
                activatedJobs.push(candidate.id);
            }
        }

        if (activatedJobs.length > 0) {
            logger.info(`Completing job ${id} activated ${activatedJobs.length} downstream jobs: ${activatedJobs.join(', ')}`);
        }

        return completed;
    }

    /**
     * Validate that all dependency IDs exist and belong to the given period.
     * Optionally exclude a specific job ID (for self-reference prevention during updates).
     */
    private async validateDependencies(depIds: string[], period: PlanningPeriod, excludeId?: string) {
        if (excludeId && depIds.includes(excludeId)) {
            throw new ValidationError('A job cannot depend on itself');
        }

        const existingJobs = await prisma.planningJob.findMany({
            where: {
                id: { in: depIds },
                period,
            },
            select: { id: true },
        });

        const foundIds = new Set(existingJobs.map(j => j.id));
        const missing = depIds.filter(id => !foundIds.has(id));

        if (missing.length > 0) {
            throw new ValidationError(
                `Dependencies not found or not in the same period: ${missing.join(', ')}`
            );
        }
    }
}

export const planningService = new PlanningService();
