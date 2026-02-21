import { prisma } from '../../../common/utils/prisma';
import { IncidentStatus } from '../../../constants';
import { IncidentStats } from './incident-shared';

export interface StatsFilters {
    startDate?: Date;
    endDate?: Date;
    systemId?: string;
    teamId?: string;
    userId?: string;
    userRole?: string;
    userTeamIds?: string[];
}

export class IncidentAnalyticsService {
    async getStats(filters: StatsFilters): Promise<IncidentStats> {
        const { startDate, endDate, systemId, teamId, userRole, userTeamIds } = filters;
        const now = new Date();
        const start = startDate || new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
        const end = endDate || new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

        const isAdmin = userRole === 'ADMIN';
        const scopeFilter: Record<string, unknown> = {};
        if (!isAdmin && userTeamIds && userTeamIds.length > 0) {
            scopeFilter.assignedTeamId = { in: userTeamIds };
        } else if (!isAdmin) {
            scopeFilter.assignedTeamId = { in: [] };
        }

        const where: Record<string, unknown> = {
            createdAt: { gte: start, lte: end },
            ...scopeFilter,
        };
        if (systemId) where.systemId = systemId;
        if (teamId) where.assignedTeamId = teamId;

        const activeWhere: Record<string, unknown> = {
            ...scopeFilter,
            status: { in: [IncidentStatus.OPEN, IncidentStatus.IN_PROGRESS] },
        };
        if (systemId) activeWhere.systemId = systemId;
        if (teamId) activeWhere.assignedTeamId = teamId;

        const resolvedWhere: Record<string, unknown> = {
            ...scopeFilter,
            resolvedAt: { gte: start, lte: end },
        };
        if (systemId) resolvedWhere.systemId = systemId;
        if (teamId) resolvedWhere.assignedTeamId = teamId;

        const closedWhere: Record<string, unknown> = {
            ...scopeFilter,
            status: IncidentStatus.CLOSED,
            createdAt: { gte: start, lte: end },
        };
        if (systemId) closedWhere.systemId = systemId;
        if (teamId) closedWhere.assignedTeamId = teamId;

        const [created, resolved, active, closed] = await Promise.all([
            prisma.incident.count({ where }),
            prisma.incident.count({ where: resolvedWhere }),
            prisma.incident.count({ where: activeWhere }),
            prisma.incident.count({ where: closedWhere }),
        ]);

        const avgResult = await prisma.incident.aggregate({
            where: {
                ...resolvedWhere,
                status: { in: [IncidentStatus.RESOLVED, IncidentStatus.CLOSED] },
                timeToResolve: { not: null },
            },
            _avg: { timeToResolve: true },
        });
        const avgResolutionTime = Math.round(avgResult._avg.timeToResolve || 0);

        const statusCounts = await prisma.incident.groupBy({
            by: ['status'],
            where,
            _count: { status: true }
        });
        const statusBreakdown = statusCounts.map(s => ({ status: s.status, count: s._count.status }));

        interface TrendRow { day: Date; count: bigint }
        const createdByDay = await prisma.$queryRaw<TrendRow[]>`
            SELECT DATE_TRUNC('day', "createdAt") AS day, COUNT(*)::bigint AS count
            FROM "Incident"
            WHERE "createdAt" >= ${start} AND "createdAt" <= ${end}
            GROUP BY day ORDER BY day
        `;

        const resolvedByDay = await prisma.$queryRaw<TrendRow[]>`
            SELECT DATE_TRUNC('day', "resolvedAt") AS day, COUNT(*)::bigint AS count
            FROM "Incident"
            WHERE "resolvedAt" IS NOT NULL AND "resolvedAt" >= ${start} AND "resolvedAt" <= ${end}
            GROUP BY day ORDER BY day
        `;

        const trendMap = new Map<string, { created: number; resolved: number }>();
        const cursor = new Date(start);
        while (cursor <= end) {
            const key = cursor.toISOString().split('T')[0];
            trendMap.set(key, { created: 0, resolved: 0 });
            cursor.setDate(cursor.getDate() + 1);
        }
        for (const row of createdByDay) {
            const key = new Date(row.day).toISOString().split('T')[0];
            const entry = trendMap.get(key);
            if (entry) entry.created = Number(row.count);
        }
        for (const row of resolvedByDay) {
            const key = new Date(row.day).toISOString().split('T')[0];
            const entry = trendMap.get(key);
            if (entry) entry.resolved = Number(row.count);
        }
        const trends = Array.from(trendMap.entries()).map(([date, data]) => ({ date, created: data.created, resolved: data.resolved }));

        const topSystemsRaw = await prisma.incident.groupBy({
            by: ['systemId'],
            where,
            _count: { id: true },
            orderBy: { _count: { id: 'desc' } },
            take: 5,
        });

        const systemIds = topSystemsRaw.map(s => s.systemId);
        const systemNames = systemIds.length > 0
            ? await prisma.system.findMany({ where: { id: { in: systemIds } }, select: { id: true, name: true } })
            : [];
        const nameMap = new Map(systemNames.map(s => [s.id, s.name]));
        const topSystems = topSystemsRaw.map(s => ({ systemId: s.systemId, name: nameMap.get(s.systemId) || 'Unknown', count: s._count.id }));

        const myTeamFilter: Record<string, unknown> = {};
        if (userTeamIds && userTeamIds.length > 0) {
            myTeamFilter.assignedTeamId = { in: userTeamIds };
        } else {
            myTeamFilter.assignedTeamId = { in: [] };
        }

        const [myTeamQueue, myTeamBreaches] = await Promise.all([
            prisma.incident.count({ where: { ...myTeamFilter, status: { in: [IncidentStatus.OPEN, IncidentStatus.IN_PROGRESS] } } }),
            prisma.incident.count({ where: { ...myTeamFilter, slaBreached: true, status: { in: [IncidentStatus.OPEN, IncidentStatus.IN_PROGRESS] } } }),
        ]);

        return {
            createdToday: created,
            resolvedToday: resolved,
            closedCount: closed,
            activeIncidents: active,
            avgResolutionTimeMinutes: avgResolutionTime,
            topSystems,
            statusBreakdown,
            trends,
            myWork: { myTeamQueue, myTeamBreaches },
        };
    }
}

export const incidentAnalyticsService = new IncidentAnalyticsService();
