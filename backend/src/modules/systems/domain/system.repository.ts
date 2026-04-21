export interface SystemPaginationParams {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}

export interface ISystemRepository {
    findSystems(pagination?: SystemPaginationParams): Promise<any>;
    findSystemByName(name: string): Promise<any | null>;
    createSystem(data: { name: string; description?: string }): Promise<any>;
    findSystemById(id: string): Promise<any | null>;
    updateSystem(id: string, data: { name?: string; description?: string | null }): Promise<any>;
    findSystemWithUsage(id: string): Promise<any | null>;
    deleteSystem(id: string): Promise<void>;
    findJobs(pagination?: SystemPaginationParams): Promise<any>;
    findSystemRef(id: string): Promise<any | null>;
    findJobByCode(code: string): Promise<any | null>;
    createJob(data: { name: string; code: string; systemId: string; teamId?: string }): Promise<any>;
    findJobById(id: string): Promise<any | null>;
    updateJob(id: string, data: { name?: string; code?: string; systemId?: string; teamId?: string | null }): Promise<any>;
    findJobWithUsage(id: string): Promise<any | null>;
    deleteJob(id: string): Promise<void>;
}
