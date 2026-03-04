import { prisma } from '../../common/utils/prisma';
import { IncidentStatus } from '../../constants';
import { maintenanceService } from '../maintenance/maintenance.service';

export interface SystemStatus {
    systemId: string;
    systemName: string;
    status: 'operational' | 'degraded' | 'outage' | 'maintenance';
    openIncidents: number;
    criticalCount: number;
    highCount: number;
    activeMaintenance: { title: string; scheduledAt: Date; endsAt: Date } | null;
    uptime30d: number; // percentage
    recentIncidents: Array<{
        id: string;
        title: string;
        severity: string;
        status: string;
        resolvedAt: Date | null;
        createdAt: Date;
    }>;
}

class StatusService {
    async getPublicStatus(): Promise<{
        systems: SystemStatus[];
        lastUpdated: Date;
        overallStatus: 'operational' | 'degraded' | 'outage' | 'maintenance';
        upcomingMaintenances: Array<{
            id: string;
            systemName: string;
            title: string;
            scheduledAt: Date;
            endsAt: Date;
        }>;
    }> {
        // Sync maintenance statuses first
        await maintenanceService.syncStatuses();

        const systems = await prisma.system.findMany({ orderBy: { name: 'asc' } });
        const now = new Date();
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

        const systemStatuses: SystemStatus[] = await Promise.all(
            systems.map(async (system) => {
                // Check active maintenance
                const activeMaintenance = await prisma.maintenanceWindow.findFirst({
                    where: {
                        systemId: system.id,
                        scheduledAt: { lte: now },
                        endsAt: { gt: now },
                        status: { in: ['scheduled', 'active'] },
                    },
                    select: { title: true, scheduledAt: true, endsAt: true },
                });

                // Open incidents by severity
                const openIncidents = await prisma.incident.findMany({
                    where: {
                        systemId: system.id,
                        status: { in: [IncidentStatus.OPEN, IncidentStatus.ACKNOWLEDGED, IncidentStatus.IN_PROGRESS] },
                    },
                    select: { severity: true },
                });

                const criticalCount = openIncidents.filter(i => i.severity === 'Critical').length;
                const highCount = openIncidents.filter(i => i.severity === 'High').length;

                // Recent resolved incidents (last 5)
                const recentIncidents = await prisma.incident.findMany({
                    where: { systemId: system.id, createdAt: { gte: thirtyDaysAgo } },
                    select: { id: true, title: true, severity: true, status: true, resolvedAt: true, createdAt: true },
                    orderBy: { createdAt: 'desc' },
                    take: 5,
                });

                // Uptime: % of time with no critical/high open incidents (30d)
                const totalIncidents30d = await prisma.incident.count({ where: { systemId: system.id, createdAt: { gte: thirtyDaysAgo } } });
                const resolvedCount = await prisma.incident.count({
                    where: {
                        systemId: system.id,
                        status: { in: [IncidentStatus.RESOLVED, IncidentStatus.CLOSED] },
                        createdAt: { gte: thirtyDaysAgo },
                    },
                });
                const uptime30d = totalIncidents30d === 0 ? 100
                    : Math.round((resolvedCount / totalIncidents30d) * 100 * 10) / 10;

                // Determine status
                let status: SystemStatus['status'] = 'operational';
                if (activeMaintenance) status = 'maintenance';
                else if (criticalCount > 0) status = 'outage';
                else if (highCount > 0 || openIncidents.length > 0) status = 'degraded';

                return {
                    systemId: system.id,
                    systemName: system.name,
                    status,
                    openIncidents: openIncidents.length,
                    criticalCount,
                    highCount,
                    activeMaintenance,
                    uptime30d,
                    recentIncidents,
                };
            })
        );

        // Upcoming maintenances (active now or starting in next 7 days)
        const upcomingMaintenances = await prisma.maintenanceWindow.findMany({
            where: {
                endsAt: { gt: now }, // not yet ended
                scheduledAt: { lte: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000) }, // starts within 7 days
                status: { in: ['scheduled', 'active'] },
            },
            include: { system: { select: { name: true } } },
            orderBy: { scheduledAt: 'asc' },
        });

        // Overall status
        const statuses = systemStatuses.map(s => s.status);
        let overallStatus: SystemStatus['status'] = 'operational';
        if (statuses.includes('outage')) overallStatus = 'outage';
        else if (statuses.includes('degraded')) overallStatus = 'degraded';
        else if (statuses.includes('maintenance')) overallStatus = 'maintenance';

        return {
            systems: systemStatuses,
            lastUpdated: now,
            overallStatus,
            upcomingMaintenances: upcomingMaintenances.map(m => ({
                id: m.id,
                systemName: m.system.name,
                title: m.title,
                scheduledAt: m.scheduledAt,
                endsAt: m.endsAt,
            })),
        };
    }
}

export const statusService = new StatusService();
