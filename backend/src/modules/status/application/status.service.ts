import { IncidentStatus } from '../../../constants';
import { maintenanceService } from '../../maintenance/application/maintenance.service';
import { statusRepository } from '../infrastructure/prisma-status.repository';

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

        const systems = await statusRepository.findSystemsOrdered();
        const now = new Date();
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

        const systemStatuses: SystemStatus[] = await Promise.all(
            systems.map(async (system) => {
                // Check active maintenance
                const activeMaintenance = await statusRepository.findActiveMaintenance(system.id, now);

                const openIncidents = await statusRepository.findOpenIncidentSeverities(system.id);

                const criticalCount = openIncidents.filter(i => i.severity === 'Critical').length;
                const highCount = openIncidents.filter(i => i.severity === 'High').length;

                // Recent resolved incidents (last 5)
                const recentIncidents = await statusRepository.findRecentIncidents(system.id, thirtyDaysAgo);

                const totalIncidents30d = await statusRepository.countIncidentsSince(system.id, thirtyDaysAgo);
                const resolvedCount = await statusRepository.countResolvedIncidentsSince(system.id, thirtyDaysAgo);
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
        const upcomingMaintenances = await statusRepository.findUpcomingMaintenances(
            now,
            new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
        );

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
