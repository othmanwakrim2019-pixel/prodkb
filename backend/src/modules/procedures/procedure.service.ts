
import { prisma } from '../../common/utils/prisma';
import { NotFoundError, ValidationError } from '../../common/errors/app.error';

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
        const procedure = await prisma.procedure.findUnique({
            where: { id },
            include: {
                _count: { select: { incidents: true } }
            }
        });
        if (!procedure) throw new NotFoundError('Procedure not found');

        if (procedure._count.incidents > 0) {
            throw new ValidationError(
                `Impossible de supprimer la procédure "${procedure.title}" car elle est liée à ${procedure._count.incidents} incident(s). Veuillez d'abord retirer cette procédure des incidents concernés.`
            );
        }

        await prisma.procedure.delete({ where: { id } });
        return procedure;
    }

    /**
     * Compute effectiveness stats for a procedure.
     * Compares avg MTTR for incidents linked to this procedure
     * vs incidents on the same system without any procedure linked.
     */
    async getEffectivenessStats(id: string) {
        const procedure = await prisma.procedure.findUnique({ where: { id } });
        if (!procedure) throw new NotFoundError('Procedure not found');

        // Avg MTTR for incidents linked to THIS procedure
        const withProcedure = await prisma.incident.aggregate({
            where: {
                linkedProcedureId: id,
                status: 'resolved',
                timeToResolve: { not: null },
            },
            _avg: { timeToResolve: true },
            _count: { id: true },
        });

        // Avg MTTR for incidents on the same system WITHOUT any procedure
        const withoutProcedure = await prisma.incident.aggregate({
            where: {
                systemId: procedure.systemId,
                linkedProcedureId: null,
                status: 'resolved',
                timeToResolve: { not: null },
            },
            _avg: { timeToResolve: true },
            _count: { id: true },
        });

        const avgMttrWith = Math.round(withProcedure._avg.timeToResolve ?? 0);
        const avgMttrWithout = Math.round(withoutProcedure._avg.timeToResolve ?? 0);
        const improvementPercent = avgMttrWithout > 0
            ? Math.round(((avgMttrWithout - avgMttrWith) / avgMttrWithout) * 100)
            : 0;

        return {
            procedureId: id,
            procedureTitle: procedure.title,
            linkedIncidentCount: withProcedure._count.id,
            avgMttrWithProcedure: avgMttrWith,       // minutes
            unlinkedIncidentCount: withoutProcedure._count.id,
            avgMttrWithoutProcedure: avgMttrWithout,  // minutes
            improvementPercent,                        // positive = faster with procedure
        };
    }
}

export const procedureService = new ProcedureService();
