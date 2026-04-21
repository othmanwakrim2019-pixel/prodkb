/**
 * System Health Score Service
 *
 * Computes a 0–100 health score per system based on:
 *   - Open incidents right now — weight 35%  (most intuitive factor)
 *   - Resolution rate (30d)   — weight 25%
 *   - SLA breach rate (30d)   — weight 20%
 *   - Average MTTR (30d)      — weight 20%
 *
 * Higher score = healthier system.
 * Snapshots are persisted in the SystemHealthSnapshot table for trend analysis.
 *
 * @module modules/systems/health-score.service
 */

import { prisma } from '../../../common/utils/prisma';
import { logger } from '../../../common/utils/logger';
import { IncidentStatus } from '../../../constants';

export interface SystemHealthResult {
    systemId: string;
    systemName: string;
    score: number;
    totalIncidents30d: number;
    resolvedIncidents30d: number;
    avgMttrMinutes: number;
    slaBreachRate: number;
    resolutionRate: number;
    openIncidents: number;
    trend: 'up' | 'down' | 'stable';
}

class HealthScoreService {
    /**
     * Compute and persist health scores for ALL systems.
     * Called daily by BullMQ cron.
     */
    async computeAndPersistAll(): Promise<SystemHealthResult[]> {
        const systems = await prisma.system.findMany();
        const results: SystemHealthResult[] = [];

        for (const system of systems) {
            try {
                const result = await this.computeForSystem(system.id, system.name);
                results.push(result);

                await prisma.systemHealthSnapshot.create({
                    data: {
                        systemId: system.id,
                        score: result.score,
                        incidentCount30d: result.totalIncidents30d,
                        avgMttrMinutes: result.avgMttrMinutes,
                        slaBreachRate: result.slaBreachRate,
                        resolutionRate: result.resolutionRate,
                        openIncidents: result.openIncidents,
                    },
                });
            } catch (error) {
                logger.error(`Failed to compute health for system ${system.name}`, {
                    error: (error as Error).message,
                });
            }
        }

        logger.info(`Health scores computed for ${results.length} systems`);
        return results;
    }

    /**
     * Compute health score for a single system.
     */
    private async computeForSystem(systemId: string, systemName: string): Promise<SystemHealthResult> {
        const now = new Date();
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

        // 1. Currently open incidents (most important for intuitiveness)
        const openIncidents = await prisma.incident.count({
            where: { systemId, status: { in: [IncidentStatus.OPEN, IncidentStatus.ACKNOWLEDGED, IncidentStatus.IN_PROGRESS] } },
        });

        // 2. Total incidents in last 30 days
        const totalIncidents30d = await prisma.incident.count({
            where: { systemId, createdAt: { gte: thirtyDaysAgo } },
        });

        // 3. Resolved/closed incidents in last 30 days
        const resolvedIncidents30d = await prisma.incident.count({
            where: {
                systemId,
                status: { in: [IncidentStatus.RESOLVED, IncidentStatus.CLOSED] },
                createdAt: { gte: thirtyDaysAgo },
            },
        });
        const resolutionRate = totalIncidents30d > 0 ? resolvedIncidents30d / totalIncidents30d : 1;

        // 4. Average MTTR for resolved incidents in last 30 days
        const mttrResult = await prisma.incident.aggregate({
            where: {
                systemId,
                status: { in: [IncidentStatus.RESOLVED, IncidentStatus.CLOSED] },
                resolvedAt: { gte: thirtyDaysAgo },
                timeToResolve: { not: null },
            },
            _avg: { timeToResolve: true },
        });
        const avgMttrMinutes = mttrResult._avg.timeToResolve ?? 0;

        // 5. SLA breach rate
        const totalWithSla = await prisma.incident.count({
            where: { systemId, slaId: { not: null }, createdAt: { gte: thirtyDaysAgo } },
        });
        const breachedCount = await prisma.incident.count({
            where: { systemId, slaBreached: true, createdAt: { gte: thirtyDaysAgo } },
        });
        const slaBreachRate = totalWithSla > 0 ? breachedCount / totalWithSla : 0;

        // ── Score formula (redesigned for intuitive results) ──

        // Open incidents: 0 open = 100, 10+ open = 0  (weight 35%)
        const openScore = Math.max(0, 100 - (openIncidents / 10) * 100);

        // Resolution rate: 100% resolved = 100  (weight 25%)
        const resolveScore = resolutionRate * 100;

        // SLA breach: 0% breaches = 100  (weight 20%)
        const slaScore = (1 - slaBreachRate) * 100;

        // MTTR: 0 min = 100, 480+ min (8h) = 0  (weight 20%)
        const mttrScore = Math.max(0, 100 - (avgMttrMinutes / 480) * 100);

        // Weighted composite
        const score = Math.round(
            openScore * 0.35 +
            resolveScore * 0.25 +
            slaScore * 0.20 +
            mttrScore * 0.20
        );

        // Trend: compare to last snapshot
        const lastSnapshot = await prisma.systemHealthSnapshot.findFirst({
            where: { systemId },
            orderBy: { computedAt: 'desc' },
        });

        let trend: 'up' | 'down' | 'stable' = 'stable';
        if (lastSnapshot) {
            if (score > lastSnapshot.score + 2) trend = 'up';
            else if (score < lastSnapshot.score - 2) trend = 'down';
        }

        return {
            systemId,
            systemName,
            score: Math.min(100, Math.max(0, score)),
            totalIncidents30d,
            resolvedIncidents30d,
            avgMttrMinutes: Math.round(avgMttrMinutes),
            slaBreachRate: Math.round(slaBreachRate * 100) / 100,
            resolutionRate: Math.round(resolutionRate * 100) / 100,
            openIncidents,
            trend,
        };
    }

    /**
     * Get the health leaderboard — latest score for each system.
     */
    async getLeaderboard(): Promise<SystemHealthResult[]> {
        const systems = await prisma.system.findMany();
        const results: SystemHealthResult[] = [];

        for (const system of systems) {
            const result = await this.computeForSystem(system.id, system.name);
            results.push(result);
        }

        return results.sort((a, b) => b.score - a.score);
    }
}

export const healthScoreService = new HealthScoreService();
