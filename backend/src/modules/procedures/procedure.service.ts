
import { prisma } from '../../common/utils/prisma';
import { NotFoundError } from '../../common/errors/app.error';

// ── Typed DTOs (eliminates `any`) ──
export interface CreateProcedureDTO {
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
}

export interface UpdateProcedureDTO {
    title?: string;
    description?: string;
    resolutionSteps?: string;
    systemId?: string;
    jobId?: string | null;
    rootCause?: string | null;
    workaround?: string | null;
    commands?: string | null;
    errorCode?: string | null;
    tags?: string | null;
}

export interface ProcedurePaginationParams {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}

export class ProcedureService {
    async findAll(search?: string, pagination: ProcedurePaginationParams = {}) {
        const { page = 1, limit = 100, sortBy = 'updatedAt', sortOrder = 'desc' } = pagination;
        const skip = (page - 1) * limit;

        const where: Record<string, unknown> = {};
        if (search) {
            where.OR = [
                { title: { contains: search } },
                { description: { contains: search } },
                { errorCode: { contains: search } },
                { tags: { contains: search } },
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

    async findById(id: string) {
        const procedure = await prisma.procedure.findUnique({
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

        if (!procedure) throw new NotFoundError('Procedure not found');
        return procedure;
    }

    async create(data: CreateProcedureDTO, userId: string) {
        return prisma.procedure.create({
            data: {
                ...data,
                createdById: userId,
            },
        });
    }

    async update(id: string, data: UpdateProcedureDTO, userId: string) {
        const procedure = await prisma.procedure.findUnique({ where: { id } });
        if (!procedure) throw new NotFoundError('Procedure not found');

        return prisma.procedure.update({
            where: { id },
            data: {
                ...data,
                updatedById: userId,
            },
        });
    }

    async delete(id: string) {
        const procedure = await prisma.procedure.findUnique({ where: { id } });
        if (!procedure) throw new NotFoundError('Procedure not found');

        await prisma.procedure.delete({ where: { id } });
        return procedure;
    }
}

export const procedureService = new ProcedureService();
