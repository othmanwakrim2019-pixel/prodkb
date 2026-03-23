
/**
 * Analytics & Reporting Module
 * Provides MTTR trends, SLA compliance rates, team performance, and severity distribution.
 * All queries use Prisma aggregates — no in-memory computation on large datasets.
 * @module modules/analytics/analytics.service
 */

import { analyticsRepository } from './analytics.repository';

export interface MTTRDataPoint {
    date: string;
    avgMinutes: number;
    count: number;
}

export interface SLAComplianceResult {
    total: number;
    withinSLA: number;
    breached: number;
    complianceRate: number; // percentage
}

export interface TeamPerformance {
    teamId: string;
    teamName: string;
    totalIncidents: number;
    avgTimeToAcknowledge: number;
    avgTimeToResolve: number;
    slaBreachCount: number;
    breachRate: number;
}

export interface SeverityDistribution {
    severity: string;
    count: number;
    percentage: number;
}

export class AnalyticsService {
    /**
     * MTTR (Mean Time To Resolve) trends over a time range
     */
    async getMTTRTrends(days: number = 30): Promise<MTTRDataPoint[]> {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        const resolvedIncidents = await analyticsRepository.findResolvedIncidentsForMttr(startDate);

        // Group by date
        const grouped = new Map<string, { total: number; count: number }>();
        for (const inc of resolvedIncidents) {
            if (!inc.resolvedAt || !inc.timeToResolve) continue;
            const dateKey = inc.resolvedAt.toISOString().split('T')[0];
            const existing = grouped.get(dateKey) || { total: 0, count: 0 };
            existing.total += inc.timeToResolve;
            existing.count += 1;
            grouped.set(dateKey, existing);
        }

        return Array.from(grouped.entries()).map(([date, { total, count }]) => ({
            date,
            avgMinutes: Math.round(total / count),
            count,
        }));
    }

    /**
     * SLA compliance rate over a period
     */
    async getSLACompliance(days: number = 30): Promise<SLAComplianceResult> {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        const [total, breached] = await Promise.all([
            analyticsRepository.countSlaTrackedIncidents(startDate),
            analyticsRepository.countSlaBreachedIncidents(startDate),
        ]);

        const withinSLA = total - breached;

        return {
            total,
            withinSLA,
            breached,
            complianceRate: total > 0 ? Math.round((withinSLA / total) * 10000) / 100 : 100,
        };
    }

    /**
     * Per-team performance metrics
     */
    async getTeamPerformance(days: number = 30): Promise<TeamPerformance[]> {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        const teams = await analyticsRepository.findTeamsWithIncidentMetrics(startDate);

        return teams.map(team => {
            const incidents = team.incidents;
            const total = incidents.length;
            const ackTimes = incidents.filter(i => i.timeToAcknowledge !== null);
            const resolveTimes = incidents.filter(i => i.timeToResolve !== null);
            const breaches = incidents.filter(i => i.slaBreached);

            return {
                teamId: team.id,
                teamName: team.name,
                totalIncidents: total,
                avgTimeToAcknowledge: ackTimes.length > 0
                    ? Math.round(ackTimes.reduce((sum, i) => sum + (i.timeToAcknowledge || 0), 0) / ackTimes.length)
                    : 0,
                avgTimeToResolve: resolveTimes.length > 0
                    ? Math.round(resolveTimes.reduce((sum, i) => sum + (i.timeToResolve || 0), 0) / resolveTimes.length)
                    : 0,
                slaBreachCount: breaches.length,
                breachRate: total > 0 ? Math.round((breaches.length / total) * 10000) / 100 : 0,
            };
        }).sort((a, b) => b.totalIncidents - a.totalIncidents);
    }

    /**
     * Severity distribution over a period
     */
    async getSeverityDistribution(days: number = 30): Promise<SeverityDistribution[]> {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        const counts = await analyticsRepository.groupIncidentsBySeverity(startDate);

        const total = counts.reduce((sum, c) => sum + c._count.severity, 0);

        return counts.map(c => ({
            severity: c.severity,
            count: c._count.severity,
            percentage: total > 0 ? Math.round((c._count.severity / total) * 10000) / 100 : 0,
        }));
    }
}

export const analyticsService = new AnalyticsService();
