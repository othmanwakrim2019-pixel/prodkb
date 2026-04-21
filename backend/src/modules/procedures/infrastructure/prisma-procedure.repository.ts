import { prisma } from '../../../common/utils/prisma';
import { IProcedureRepository, ProcedurePaginationParams } from '../domain/procedure.repository';

export class PrismaProcedureRepository implements IProcedureRepository {
    async findProcedures(search?: string, pagination: ProcedurePaginationParams = {}) {
        const { page = 1, limit = 100, sortBy = 'updatedAt', sortOrder = 'desc' } = pagination;
        const skip = (page - 1) * limit;

        const where: Record<string, unknown> = {};
        if (search) {
            where.OR = [
                { title: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
                { errorCode: { contains: search, mode: 'insensitive' } },
                { tags: { contains: search, mode: 'insensitive' } },
            ];
        }

        const [data, total] = await Promise.all([
            prisma.procedure.findMany({
                where,
                include: {
                    system: true,
                    job: true,
                    _count: { select: { incidents: true } },
                },
                skip,
                take: limit,
                orderBy: { [sortBy]: sortOrder },
            }),
            prisma.procedure.count({ where }),
        ]);

        return {
            data,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }

    async findProcedureById(id: string) {
        return prisma.procedure.findUnique({
            where: { id },
            include: {
                system: true,
                job: true,
                incidents: {
                    select: { id: true, title: true, status: true, createdAt: true },
                },
                createdBy: { select: { name: true } },
            },
        });
    }

    async createProcedure(data: {
        title: string;
        description: string;
        resolutionSteps: string;
        systemId: string;
        jobId?: string;
        rootCause?: string;
        workaround?: string;
        commands?: string;
        errorCode?: string;
        tags?: string;
        createdById: string;
    }) {
        return prisma.procedure.create({ data });
    }

    async findProcedureRecord(id: string) {
        return prisma.procedure.findUnique({ where: { id } });
    }

    async updateProcedure(id: string, data: Record<string, unknown>) {
        return prisma.procedure.update({
            where: { id },
            data,
        });
    }

    async findProcedureWithUsage(id: string) {
        return prisma.procedure.findUnique({
            where: { id },
            include: {
                _count: { select: { incidents: true } },
            },
        });
    }

    async deleteProcedure(id: string) {
        return prisma.procedure.delete({ where: { id } });
    }

    async aggregateIncidentsWithProcedure(id: string) {
        return prisma.incident.aggregate({
            where: {
                linkedProcedureId: id,
                status: 'resolved',
                timeToResolve: { not: null },
            },
            _avg: { timeToResolve: true },
            _count: { id: true },
        });
    }

    async aggregateIncidentsWithoutProcedure(systemId: string) {
        return prisma.incident.aggregate({
            where: {
                systemId,
                linkedProcedureId: null,
                status: 'resolved',
                timeToResolve: { not: null },
            },
            _avg: { timeToResolve: true },
            _count: { id: true },
        });
    }
}

export const procedureRepository = new PrismaProcedureRepository();
