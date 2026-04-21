export interface SLAPaginationParams {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}

export interface ISlaRepository {
    findSLAs(pagination?: SLAPaginationParams): Promise<any>;
    findSLAById(id: string): Promise<any | null>;
    createSLA(data: {
        name: string;
        description?: string;
        severity: string;
        acknowledgeTimeMinutes: number;
        resolveTimeMinutes: number;
    }): Promise<any>;
    updateSLA(
        id: string,
        data: {
            name?: string;
            description?: string | null;
            severity?: string;
            acknowledgeTimeMinutes?: number;
            resolveTimeMinutes?: number;
            isActive?: boolean;
        }
    ): Promise<any>;
    findSLAWithUsage(id: string): Promise<any | null>;
    deleteSLA(id: string): Promise<any>;
    findUnbreachedActiveIncidentsWithSla(): Promise<any[]>;
    markIncidentSlaBreached(id: string, now: Date): Promise<any>;
    createIncidentLog(data: { incidentId: string; logType: string; rawLog: string }): Promise<any>;
    findBreachedActiveIncidents(): Promise<any[]>;
    findIncidentEscalationState(id: string): Promise<any | null>;
}
