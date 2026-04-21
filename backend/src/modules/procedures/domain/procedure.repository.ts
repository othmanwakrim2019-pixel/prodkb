export interface ProcedurePaginationParams {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}

export interface IProcedureRepository {
    findProcedures(search?: string, pagination?: ProcedurePaginationParams): Promise<any>;
    findProcedureById(id: string): Promise<any | null>;
    createProcedure(data: {
        title: string;
        description: string;
        resolutionSteps: string;
        systemId: string;
        jobId?: string;
        rootCause?: string;
        workaround?: string;
        commands?: string;
        errorCode?: string;
        tags?: string;
        createdById: string;
    }): Promise<any>;
    findProcedureRecord(id: string): Promise<any | null>;
    updateProcedure(id: string, data: Record<string, unknown>): Promise<any>;
    findProcedureWithUsage(id: string): Promise<any | null>;
    deleteProcedure(id: string): Promise<any>;
    aggregateIncidentsWithProcedure(id: string): Promise<any>;
    aggregateIncidentsWithoutProcedure(systemId: string): Promise<any>;
}
