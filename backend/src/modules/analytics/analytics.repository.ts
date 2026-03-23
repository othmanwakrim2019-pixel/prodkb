import { prisma } from '../../common/utils/prisma';
import { IncidentStatus } from '../../constants';

export class AnalyticsRepository {
    async findResolvedIncidentsForMttr(startDate: Date) {
        return prisma.incident.findMany({
            where: {
                resolvedAt: { gte: startDate },
                timeToResolve: { not: null },
                status: { in: [IncidentStatus.RESOLVED, IncidentStatus.CLOSED] },
            },
            select: {
                resolvedAt: true,
                timeToResolve: true,
            },
            orderBy: { resolvedAt: 'asc' },
        });
    }

    async countSlaTrackedIncidents(startDate: Date) {
        return prisma.incident.count({
            where: {
                createdAt: { gte: startDate },
                slaId: { not: null },
            },
        });
    }

    async countSlaBreachedIncidents(startDate: Date) {
        return prisma.incident.count({
            where: {
                createdAt: { gte: startDate },
                slaId: { not: null },
                slaBreached: true,
            },
        });
    }

    async findTeamsWithIncidentMetrics(startDate: Date) {
        return prisma.team.findMany({
            select: {
                id: true,
                name: true,
                incidents: {
                    where: { createdAt: { gte: startDate } },
                    select: {
                        timeToAcknowledge: true,
                        timeToResolve: true,
                        slaBreached: true,
                    },
                },
            },
        });
    }

    async groupIncidentsBySeverity(startDate: Date) {
        return prisma.incident.groupBy({
            by: ['severity'],
            where: { createdAt: { gte: startDate } },
            _count: { severity: true },
        });
    }
}

export const analyticsRepository = new AnalyticsRepository();
