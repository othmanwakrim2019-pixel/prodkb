
import { prisma } from '../../common/utils/prisma';
import { logger } from '../../common/utils/logger';
import { NotFoundError, ValidationError, ConflictError } from '../../common/errors/app.error';

export interface SystemPaginationParams {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}

export class SystemService {
    async findAllSystems(pagination: SystemPaginationParams = {}) {
        const { page = 1, limit = 100, sortBy = 'name', sortOrder = 'asc' } = pagination;
        const skip = (page - 1) * limit;

        const [data, total] = await Promise.all([
            prisma.system.findMany({
                include: {
                    jobs: {
                        include: {
                            team: true
                        }
                    },
                    procedures: {
                        include: {
                            job: true
                        }
                    }
                },
                skip,
                take: limit,
                orderBy: { [sortBy]: sortOrder },
            }),
            prisma.system.count(),
        ]);

        return {
            data,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }

    /**
     * Create a system
     */
    async createSystem(data: { name: string; description?: string }) {
        const existing = await prisma.system.findUnique({ where: { name: data.name } });
        if (existing) throw new ConflictError('System with this name already exists');

        return prisma.system.create({
            data,
        });
    }

    /**
     * Update a system
     */
    async updateSystem(id: string, data: { name?: string; description?: string | null }) {
        const system = await prisma.system.findUnique({ where: { id } });
        if (!system) throw new NotFoundError('System not found');

        return prisma.system.update({
            where: { id },
            data,
            include: { jobs: true },
        });
    }

    /**
     * Delete a system
     */
    async deleteSystem(id: string) {
        const system = await prisma.system.findUnique({
            where: { id },
            include: {
                _count: {
                    select: { incidents: true, jobs: true, procedures: true }
                }
            }
        });

        if (!system) throw new NotFoundError('System not found');

        const totalUsage = system._count.incidents + system._count.jobs + system._count.procedures;
        if (totalUsage > 0) {
            throw new ValidationError(
                `Cannot delete system: ${system._count.incidents} incidents, ${system._count.jobs} jobs, ${system._count.procedures} procedures depend on it`
            );
        }

        await prisma.system.delete({ where: { id } });
        return system; // Return deleted system for audit details
    }

    async findAllJobs(pagination: SystemPaginationParams = {}) {
        const { page = 1, limit = 100, sortBy = 'name', sortOrder = 'asc' } = pagination;
        const skip = (page - 1) * limit;

        const [data, total] = await Promise.all([
            prisma.job.findMany({
                include: {
                    system: true,
                    team: true
                },
                skip,
                take: limit,
                orderBy: { [sortBy]: sortOrder },
            }),
            prisma.job.count(),
        ]);

        return {
            data,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }

    /**
     * Create a job
     */
    async createJob(data: { name: string; code: string; systemId: string; teamId?: string }) {
        // Validate system exists
        const system = await prisma.system.findUnique({ where: { id: data.systemId } });
        if (!system) throw new ValidationError('Invalid system ID');

        const existing = await prisma.job.findUnique({ where: { code: data.code } });
        if (existing) throw new ConflictError('Job with this code already exists');

        return prisma.job.create({
            data: {
                name: data.name,
                code: data.code,
                systemId: data.systemId,
                teamId: data.teamId,
            },
            include: {
                system: true,
                team: true
            }
        });
    }

    /**
     * Update a job
     */
    async updateJob(id: string, data: { name?: string; code?: string; systemId?: string; teamId?: string | null }) {
        const job = await prisma.job.findUnique({ where: { id } });
        if (!job) throw new NotFoundError('Job not found');

        return prisma.job.update({
            where: { id },
            data,
            include: {
                system: true,
                team: true,
            },
        });
    }

    /**
     * Delete a job
     */
    async deleteJob(id: string) {
        const job = await prisma.job.findUnique({
            where: { id },
            include: {
                _count: {
                    select: { incidents: true, procedures: true }
                }
            }
        });

        if (!job) throw new NotFoundError('Job not found');

        const totalUsage = job._count.incidents + job._count.procedures;
        if (totalUsage > 0) {
            throw new ValidationError(
                `Cannot delete job: ${job._count.incidents} incidents and ${job._count.procedures} procedures depend on it`
            );
        }

        await prisma.job.delete({ where: { id } });
        return job; // Return for audit
    }

    // Helper to get by ID for audit diffs
    async findSystemById(id: string) {
        const system = await prisma.system.findUnique({ where: { id } });
        if (!system) throw new NotFoundError('System not found');
        return system;
    }

    async findJobById(id: string) {
        const job = await prisma.job.findUnique({ where: { id }, include: { system: true, team: true } });
        if (!job) throw new NotFoundError('Job not found');
        return job;
    }
}

export const systemService = new SystemService();
