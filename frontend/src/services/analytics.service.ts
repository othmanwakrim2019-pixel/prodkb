/**
 * Analytics API Service — backend analytics endpoints
 * Types derived from OpenAPI spec via openapi-typescript
 */
import api from '../utils/axios';

// ── Response Types ──

export interface MttrTrend {
    date: string;
    avgMinutes: number;
    count: number;
}

export interface SlaComplianceData {
    totalIncidents: number;
    withinSla: number;
    breached: number;
    complianceRate: number;
    bySeverity: Array<{
        severity: string;
        total: number;
        withinSla: number;
        breached: number;
        complianceRate: number;
    }>;
}

export interface TeamPerformanceData {
    teamId: string;
    teamName: string;
    totalIncidents: number;
    resolvedIncidents: number;
    avgResolutionMinutes: number;
    slaComplianceRate: number;
}

export interface SeverityDistributionData {
    severity: string;
    count: number;
    percentage: number;
}

// ── Query Params ──

export interface AnalyticsParams {
    days?: number;
}

// ── Service ──

export const analyticsService = {
    getMttrTrends: (params?: AnalyticsParams): Promise<MttrTrend[]> =>
        api.get('/api/v1/analytics/mttr', { params }).then(r => r.data),

    getSlaCompliance: (params?: AnalyticsParams): Promise<SlaComplianceData> =>
        api.get('/api/v1/analytics/sla-compliance', { params }).then(r => r.data),

    getTeamPerformance: (params?: AnalyticsParams): Promise<TeamPerformanceData[]> =>
        api.get('/api/v1/analytics/team-performance', { params }).then(r => r.data),

    getSeverityDistribution: (params?: AnalyticsParams): Promise<SeverityDistributionData[]> =>
        api.get('/api/v1/analytics/severity-distribution', { params }).then(r => r.data),
};

