import { prisma } from '../../../common/utils/prisma';

export interface SystemPaginationParams {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}

class SystemRepository {
    async findSystems(pagination: SystemPaginationParams = {}) {
        const { page = 1, limit = 100, sortBy = 'name', sortOrder = 'asc' } = pagination;
        const skip = (page - 1) * limit;

        const [data, total] = await Promise.all([
            prisma.system.findMany({
                include: {
                    jobs: {
                        include: {
                            team: true,
                        },
                    },
                    procedures: {
                        include: {
                            job: true,
                        },
                    },
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

    async findSystemByName(name: string) {
        return prisma.system.findUnique({ where: { name } });
    }

    async createSystem(data: { name: string; description?: string }) {
        return prisma.system.create({ data });
    }

    async findSystemById(id: string) {
        return prisma.system.findUnique({ where: { id } });
    }

    async updateSystem(id: string, data: { name?: string; description?: string | null }) {
        return prisma.system.update({
            where: { id },
            data,
            include: { jobs: true },
        });
    }

    async findSystemWithUsage(id: string) {
        return prisma.system.findUnique({
            where: { id },
            include: {
                _count: {
                    select: { incidents: true, jobs: true, procedures: true },
                },
            },
        });
    }

    async deleteSystem(id: string) {
        await prisma.system.delete({ where: { id } });
    }

    async findJobs(pagination: SystemPaginationParams = {}) {
        const { page = 1, limit = 100, sortBy = 'name', sortOrder = 'asc' } = pagination;
        const skip = (page - 1) * limit;

        const [data, total] = await Promise.all([
            prisma.job.findMany({
                include: {
                    system: true,
                    team: true,
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

    async findSystemRef(id: string) {
        return prisma.system.findUnique({ where: { id } });
    }

    async findJobByCode(code: string) {
        return prisma.job.findUnique({ where: { code } });
    }

    async createJob(data: { name: string; code: string; systemId: string; teamId?: string }) {
        return prisma.job.create({
            data: {
                name: data.name,
                code: data.code,
                systemId: data.systemId,
                teamId: data.teamId,
            },
            include: {
                system: true,
                team: true,
            },
        });
    }

    async findJobById(id: string) {
        return prisma.job.findUnique({
            where: { id },
            include: {
                system: true,
                team: true,
            },
        });
    }

    async updateJob(id: string, data: { name?: string; code?: string; systemId?: string; teamId?: string | null }) {
        return prisma.job.update({
            where: { id },
            data,
            include: {
                system: true,
                team: true,
            },
        });
    }

    async findJobWithUsage(id: string) {
        return prisma.job.findUnique({
            where: { id },
            include: {
                _count: {
                    select: { incidents: true, procedures: true },
                },
            },
        });
    }

    async deleteJob(id: string) {
        await prisma.job.delete({ where: { id } });
    }
}

export const systemRepository = new SystemRepository();
