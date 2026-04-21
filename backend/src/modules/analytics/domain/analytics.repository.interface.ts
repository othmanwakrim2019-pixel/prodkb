
export interface IAnalyticsRepository {
    findResolvedIncidentsForMttr(startDate: Date): Promise<any[]>;
    countSlaTrackedIncidents(startDate: Date): Promise<number>;
    countSlaBreachedIncidents(startDate: Date): Promise<number>;
    findTeamsWithIncidentMetrics(startDate: Date): Promise<any[]>;
    groupIncidentsBySeverity(startDate: Date): Promise<any[]>;
}
