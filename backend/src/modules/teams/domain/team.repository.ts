export interface TeamPaginationParams {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}

export interface ITeamRepository {
    createTeam(data: { name: string; description?: string; emailDistribution: string; sendEmail?: boolean }): Promise<any>;
    findTeams(pagination?: TeamPaginationParams): Promise<any>;
    findTeamById(id: string): Promise<any | null>;
    updateTeam(
        id: string,
        data: { name?: string; description?: string | null; emailDistribution?: string; isActive?: boolean; sendEmail?: boolean }
    ): Promise<any>;
    findTeamWithUsage(id: string): Promise<any | null>;
    deleteTeam(id: string): Promise<any>;
    createTeamMember(teamId: string, userId: string, role: string): Promise<any>;
    deleteTeamMember(teamId: string, userId: string): Promise<any>;
}
