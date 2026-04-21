export interface IStatusRepository {
    findSystemsOrdered(): Promise<any[]>;
    findActiveMaintenance(systemId: string, now: Date): Promise<any | null>;
    findOpenIncidentSeverities(systemId: string): Promise<any[]>;
    findRecentIncidents(systemId: string, since: Date): Promise<any[]>;
    countIncidentsSince(systemId: string, since: Date): Promise<number>;
    countResolvedIncidentsSince(systemId: string, since: Date): Promise<number>;
    findUpcomingMaintenances(now: Date, until: Date): Promise<any[]>;
}
