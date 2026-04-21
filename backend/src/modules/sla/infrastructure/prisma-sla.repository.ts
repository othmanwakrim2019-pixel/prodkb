import { prisma } from '../../../common/utils/prisma';
import { IncidentStatus } from '../../../constants';
import { ISlaRepository, SLAPaginationParams } from '../domain/sla.repository';

export class PrismaSlaRepository implements ISlaRepository {
    async findSLAs(pagination: SLAPaginationParams = {}) {
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
        return prisma.sLA.findUnique({
            where: { id },
            include: {
                _count: {
                    select: {
                        incidents: true,
                    },
                },
            },
        });
    }

    async createSLA(data: {
        name: string;
        description?: string;
        severity: string;
        acknowledgeTimeMinutes: number;
        resolveTimeMinutes: number;
    }) {
        return prisma.sLA.create({ data });
    }

    async updateSLA(
        id: string,
        data: {
            name?: string;
            description?: string | null;
            severity?: string;
            acknowledgeTimeMinutes?: number;
            resolveTimeMinutes?: number;
            isActive?: boolean;
        }
    ) {
        return prisma.sLA.update({
            where: { id },
            data,
        });
    }

    async findSLAWithUsage(id: string) {
        return prisma.sLA.findUnique({
            where: { id },
            include: {
                _count: { select: { incidents: true } },
            },
        });
    }

    async deleteSLA(id: string) {
        return prisma.sLA.delete({ where: { id } });
    }

    async findUnbreachedActiveIncidentsWithSla() {
        return prisma.incident.findMany({
            where: {
                status: {
                    in: [IncidentStatus.OPEN, IncidentStatus.ACKNOWLEDGED, IncidentStatus.IN_PROGRESS],
                },
                slaId: { not: null },
                slaBreached: false,
            },
            include: {
                sla: true,
                system: { select: { id: true, name: true } },
                assignedTeam: { select: { id: true, name: true, emailDistribution: true } },
                createdBy: { select: { name: true, email: true } },
            },
        });
    }

    async markIncidentSlaBreached(id: string, now: Date) {
        return prisma.incident.update({
            where: { id },
            data: {
                slaBreached: true,
                slaBreachNotifiedAt: now,
            },
        });
    }

    async createIncidentLog(data: { incidentId: string; logType: string; rawLog: string }) {
        return prisma.incidentLog.create({ data });
    }

    async findBreachedActiveIncidents() {
        return prisma.incident.findMany({
            where: {
                status: {
                    in: [IncidentStatus.OPEN, IncidentStatus.ACKNOWLEDGED, IncidentStatus.IN_PROGRESS],
                },
                slaBreached: true,
                slaBreachNotifiedAt: { not: null },
            },
            select: { id: true, escalationLevel: true, title: true, severity: true },
        });
    }

    async findIncidentEscalationState(id: string) {
        return prisma.incident.findUnique({
            where: { id },
            select: { escalationLevel: true, assignedTeamId: true },
        });
    }
}

export const slaRepository = new PrismaSlaRepository();
