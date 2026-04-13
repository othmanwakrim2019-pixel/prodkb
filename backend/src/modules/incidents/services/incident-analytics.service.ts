import { IncidentStatus } from '../../../constants';
import { IncidentStats } from './incident-shared';
import { hasGlobalIncidentAccess } from './incident-visibility.service';
import { incidentRepository } from '../repositories/incident.repository';

export interface StatsFilters {
    startDate?: Date;
    endDate?: Date;
    systemId?: string;
    teamId?: string;
    userId?: string;
    userRole?: string;
    userPermissions?: string[];
    userTeamIds?: string[];
}

export class IncidentAnalyticsService {
    async getStats(filters: StatsFilters): Promise<IncidentStats> {
        const { startDate, endDate, systemId, teamId, userRole, userPermissions, userTeamIds } = filters;
        const now = new Date();
        const start = startDate || new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
        const end = endDate || new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

        const hasGlobalAccess = hasGlobalIncidentAccess({ role: userRole, permissions: userPermissions });
        const scopeFilter: Record<string, unknown> = {};
        if (!hasGlobalAccess && userTeamIds && userTeamIds.length > 0) {
            scopeFilter.assignedTeamId = { in: userTeamIds };
        } else if (!hasGlobalAccess) {
            scopeFilter.assignedTeamId = { in: [] };
        }

        const scopedTeamId = !hasGlobalAccess && teamId
            ? (userTeamIds || []).includes(teamId) ? teamId : '__NO_TEAM_ACCESS__'
            : teamId;

        const where: Record<string, unknown> = {
            createdAt: { gte: start, lte: end },
            ...scopeFilter,
        };
        if (systemId) where.systemId = systemId;
        if (scopedTeamId) where.assignedTeamId = scopedTeamId;

        const activeWhere: Record<string, unknown> = {
            ...scopeFilter,
            status: { in: [IncidentStatus.OPEN, IncidentStatus.IN_PROGRESS] },
        };
        if (systemId) activeWhere.systemId = systemId;
        if (scopedTeamId) activeWhere.assignedTeamId = scopedTeamId;

        const resolvedWhere: Record<string, unknown> = {
            ...scopeFilter,
            resolvedAt: { gte: start, lte: end },
        };
        if (systemId) resolvedWhere.systemId = systemId;
        if (scopedTeamId) resolvedWhere.assignedTeamId = scopedTeamId;

        const closedWhere: Record<string, unknown> = {
            ...scopeFilter,
            status: IncidentStatus.CLOSED,
            createdAt: { gte: start, lte: end },
        };
        if (systemId) closedWhere.systemId = systemId;
        if (scopedTeamId) closedWhere.assignedTeamId = scopedTeamId;

        const [created, resolved, active, closed] = await Promise.all([
            incidentRepository.countIncidents(where),
            incidentRepository.countIncidents(resolvedWhere),
            incidentRepository.countIncidents(activeWhere),
            incidentRepository.countIncidents(closedWhere),
        ]);

        const avgResult = await incidentRepository.aggregateIncidentResolution({
            ...resolvedWhere,
            status: { in: [IncidentStatus.RESOLVED, IncidentStatus.CLOSED] },
            timeToResolve: { not: null },
        });
        const avgResolutionTime = Math.round(avgResult._avg.timeToResolve || 0);

        const statusCounts = await incidentRepository.groupIncidentsByStatus(where);
        const statusBreakdown = statusCounts.map(s => ({ status: s.status, count: s._count.status }));

        const createdByDay = await incidentRepository.queryCreatedTrend(start, end);
        const resolvedByDay = await incidentRepository.queryResolvedTrend(start, end);

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

        const topSystemsRaw = await incidentRepository.groupIncidentsBySystem(where);

        const systemIds = topSystemsRaw.map(s => s.systemId);
        const systemNames = systemIds.length > 0
            ? await incidentRepository.findSystemsByIds(systemIds)
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
            incidentRepository.countIncidents({ ...myTeamFilter, status: { in: [IncidentStatus.OPEN, IncidentStatus.IN_PROGRESS] } }),
            incidentRepository.countIncidents({ ...myTeamFilter, slaBreached: true, status: { in: [IncidentStatus.OPEN, IncidentStatus.IN_PROGRESS] } }),
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
