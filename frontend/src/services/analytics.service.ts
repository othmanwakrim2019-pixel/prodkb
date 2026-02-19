/**
 * Analytics API Service — backend analytics endpoints (Phase 2)
 */
import { api } from '../lib/api';

export interface AnalyticsParams {
    days?: number;
}

export const analyticsService = {
    getMttrTrends: (params?: AnalyticsParams): Promise<unknown> =>
        api.get('/api/v1/analytics/mttr', { params }).then(r => r.data),

    getSlaCompliance: (params?: AnalyticsParams): Promise<unknown> =>
        api.get('/api/v1/analytics/sla-compliance', { params }).then(r => r.data),

    getTeamPerformance: (params?: AnalyticsParams): Promise<unknown> =>
        api.get('/api/v1/analytics/team-performance', { params }).then(r => r.data),

    getSeverityDistribution: (params?: AnalyticsParams): Promise<unknown> =>
        api.get('/api/v1/analytics/severity-distribution', { params }).then(r => r.data),
};
