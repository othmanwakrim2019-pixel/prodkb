export interface AuthUser {
    id: string;
    name: string;
    role: string;
    permissions: string[];
    teamIds: string[];
    incidentScope: string;
}

export interface CachedAuthUser {
    name: string;
    role: string;
    permissions: string[];
    teamIds: string[];
    incidentScope: string;
}
