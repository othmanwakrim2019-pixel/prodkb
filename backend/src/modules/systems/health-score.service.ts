/**
 * System Health Score Service
 *
 * Computes a 0–100 health score per system based on:
 *   - Incident frequency (last 30 days) — weight 30%
 *   - Average MTTR — weight 25%
 *   - SLA breach rate — weight 25%
 *   - Resolution rate — weight 20%
 *
 * Higher score = healthier system.
 * Snapshots are persisted in the SystemHealthSnapshot table for trend analysis.
 *
 * @module modules/systems/health-score.service
 */

import { prisma } from '../../common/utils/prisma';
import { logger } from '../../common/utils/logger';

export interface SystemHealthResult {
    systemId: string;
    systemName: string;
    score: number;
    incidentCount30d: number;
    avgMttrMinutes: number;
    slaBreachRate: number;
    resolutionRate: number;
    openIncidents: number;
    trend: 'up' | 'down' | 'stable'; // Compared to previous snapshot
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

                // Persist snapshot
                await prisma.systemHealthSnapshot.create({
                    data: {
                        systemId: system.id,
                        score: result.score,
                        incidentCount30d: result.incidentCount30d,
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

        // 1. Incident count in last 30 days
        const incidentCount30d = await prisma.incident.count({
            where: { systemId, createdAt: { gte: thirtyDaysAgo } },
        });

        // 2. Average MTTR for resolved incidents in last 30 days
        const mttrResult = await prisma.incident.aggregate({
            where: {
                systemId,
                status: 'resolved',
                resolvedAt: { gte: thirtyDaysAgo },
                timeToResolve: { not: null },
            },
            _avg: { timeToResolve: true },
        });
        const avgMttrMinutes = mttrResult._avg.timeToResolve ?? 0;

        // 3. SLA breach rate
        const totalWithSla = await prisma.incident.count({
            where: { systemId, slaId: { not: null }, createdAt: { gte: thirtyDaysAgo } },
        });
        const breachedCount = await prisma.incident.count({
            where: { systemId, slaBreached: true, createdAt: { gte: thirtyDaysAgo } },
        });
        const slaBreachRate = totalWithSla > 0 ? breachedCount / totalWithSla : 0;

        // 4. Resolution rate (resolved / total)
        const resolvedCount = await prisma.incident.count({
            where: {
                systemId,
                status: { in: ['resolved', 'closed'] },
                createdAt: { gte: thirtyDaysAgo },
            },
        });
        const resolutionRate = incidentCount30d > 0 ? resolvedCount / incidentCount30d : 1;

        // 5. Currently open incidents
        const openIncidents = await prisma.incident.count({
            where: { systemId, status: { notIn: ['resolved', 'closed'] } },
        });

        // ── Score formula ──
        // Incident frequency: fewer incidents = higher score (cap at 50 incidents)
        const freqScore = Math.max(0, 100 - (incidentCount30d / 50) * 100);

        // MTTR: lower = better (cap at 480 min = 8 hours)
        const mttrScore = Math.max(0, 100 - (avgMttrMinutes / 480) * 100);

        // SLA breach: lower = better
        const slaScore = (1 - slaBreachRate) * 100;

        // Resolution rate: higher = better
        const resolveScore = resolutionRate * 100;

        // Weighted composite
        const score = Math.round(
            freqScore * 0.30 +
            mttrScore * 0.25 +
            slaScore * 0.25 +
            resolveScore * 0.20
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
            incidentCount30d,
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

        // Sort by score descending
        return results.sort((a, b) => b.score - a.score);
    }
}

export const healthScoreService = new HealthScoreService();
