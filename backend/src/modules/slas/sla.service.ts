
import { prisma } from '../../common/utils/prisma';
import { NotFoundError } from '../../common/errors/app.error';

// ── Typed DTOs (eliminates `any`) ──
export interface CreateSLADTO {
    name: string;
    description?: string;
    severity: string;
    acknowledgeTimeMinutes: number;
    resolveTimeMinutes: number;
}

export interface UpdateSLADTO {
    name?: string;
    description?: string | null;
    severity?: string;
    acknowledgeTimeMinutes?: number;
    resolveTimeMinutes?: number;
    isActive?: boolean;
}

export interface SLAPaginationParams {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}

export class SlaService {
    async findAllSLAs(pagination: SLAPaginationParams = {}) {
        const { page = 1, limit = 100, sortBy = 'severity', sortOrder = 'asc' } = pagination;
        const skip = (page - 1) * limit;

        const [data, total] = await Promise.all([
            prisma.sLA.findMany({
                include: {
                    _count: {
                        select: {
                            incidents: true,
                        },
                    },
                },
                orderBy: [
                    { [sortBy]: sortOrder },
                    { name: 'asc' },
                ],
                skip,
                take: limit,
            }),
            prisma.sLA.count(),
        ]);

        return {
            data,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }

    async findSLAById(id: string) {
        const sla = await prisma.sLA.findUnique({
            where: { id },
            include: {
                _count: {
                    select: {
                        incidents: true,
                    },
                },
            },
        });

        if (!sla) throw new NotFoundError('SLA not found');
        return sla;
    }

    async createSLA(data: CreateSLADTO) {
        return prisma.sLA.create({
            data,
        });
    }

    async updateSLA(id: string, data: UpdateSLADTO) {
        await this.findSLAById(id);

        return prisma.sLA.update({
            where: { id },
            data,
        });
    }

    async deleteSLA(id: string) {
        const sla = await this.findSLAById(id);

        await prisma.sLA.delete({
            where: { id },
        });

        return sla;
    }
}

export const slaService = new SlaService();
