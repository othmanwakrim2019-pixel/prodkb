import { prisma } from '../../../common/utils/prisma';
import { IncidentStatus } from '../../../constants';
import { IStatusRepository } from '../domain/status.repository';

export class PrismaStatusRepository implements IStatusRepository {
    async findSystemsOrdered() {
        return prisma.system.findMany({ orderBy: { name: 'asc' } });
    }

    async findActiveMaintenance(systemId: string, now: Date) {
        return prisma.maintenanceWindow.findFirst({
            where: {
                systemId,
                scheduledAt: { lte: now },
                endsAt: { gt: now },
                status: { in: ['scheduled', 'active'] },
            },
            select: { title: true, scheduledAt: true, endsAt: true },
        });
    }

    async findOpenIncidentSeverities(systemId: string) {
        return prisma.incident.findMany({
            where: {
                systemId,
                status: { in: [IncidentStatus.OPEN, IncidentStatus.ACKNOWLEDGED, IncidentStatus.IN_PROGRESS] },
            },
            select: { severity: true },
        });
    }

    async findRecentIncidents(systemId: string, since: Date) {
        return prisma.incident.findMany({
            where: { systemId, createdAt: { gte: since } },
            select: { id: true, title: true, severity: true, status: true, resolvedAt: true, createdAt: true },
            orderBy: { createdAt: 'desc' },
            take: 5,
        });
    }

    async countIncidentsSince(systemId: string, since: Date) {
        return prisma.incident.count({
            where: { systemId, createdAt: { gte: since } },
        });
    }

    async countResolvedIncidentsSince(systemId: string, since: Date) {
        return prisma.incident.count({
            where: {
                systemId,
                status: { in: [IncidentStatus.RESOLVED, IncidentStatus.CLOSED] },
                createdAt: { gte: since },
            },
        });
    }

    async findUpcomingMaintenances(now: Date, until: Date) {
        return prisma.maintenanceWindow.findMany({
            where: {
                endsAt: { gt: now },
                scheduledAt: { lte: until },
                status: { in: ['scheduled', 'active'] },
            },
            include: { system: { select: { name: true } } },
            orderBy: { scheduledAt: 'asc' },
        });
    }
}

export const statusRepository = new PrismaStatusRepository();
