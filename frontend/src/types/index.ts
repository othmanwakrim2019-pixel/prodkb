// ── Enums (inlined — was types/enums.ts) ──

export enum IncidentStatus {
    OPEN = 'Open',
    IN_PROGRESS = 'In Progress',
    RESOLVED = 'Resolved',
    CLOSED = 'Closed',
}

export enum Severity {
    CRITICAL = 'Critical',
    HIGH = 'High',
    MEDIUM = 'Medium',
    LOW = 'Low',
}

export enum Environment {
    PROD = 'PROD',
    PREPROD = 'PREPROD',
    RECETTE = 'RECETTE',
}

export enum UserRole {
    ADMIN = 'ADMIN',
    EXPERT = 'EXPERT',
    OPERATOR = 'OPERATOR',
    VIEWER = 'VIEWER',
}

// ── Generated API types ──
export type { paths, components } from './api.generated';

// ── Planning types ──
export type * from './planning';

export interface User {
    id: string;
    name: string;
    email: string;
    role?: Role | string;
    isActive?: boolean;
    team?: string; // or Team if it represents the relation, but usage suggests string name or ID
    teamMemberships?: TeamMembership[];
}

export interface TeamMembership {
    role: string;
    team: {
        id: string;
        name: string;
    };
}

export interface Role {
    id: string;
    name: string;
    description: string;
    permissions: Permission[];
}

export interface Permission {
    id: string;
    code: string;
    description: string;
    permissions?: Permission[];
}

export interface Team {
    id: string;
    name: string;
    description?: string;
    emailDistribution?: string;
    sendEmail?: boolean;
    members?: Array<{
        role: string;
        user: {
            id: string;
            name: string;
            email: string;
            role?: Role | string;
        };
    }>;
    jobs?: Job[];
}

export interface System {
    id: string;
    name: string;
    description?: string;
    jobs?: Job[];
}

export interface Job {
    id: string;
    name: string;
    code: string;
    systemId: string;
    teamId?: string;
}

export interface TeamMember {
    user: {
        id: string;
        name: string;
        email: string;
        role?: Role | string;
    };
    role: string;
}

export interface SLA {
    id: string;
    name: string;
    description: string;
    severity: Severity;
    acknowledgeTimeMinutes: number;
    resolveTimeMinutes: number;
}

export interface Log {
    id: string;
    logType: string;
    rawLog: string;
    errorMessage?: string;
    errorCode?: string;
    fileName?: string;
    fileSize?: number;
    filePath?: string;
    mimeType?: string;
    createdAt: string;
    user?: User; // Legacy or specific log types?
    createdBy?: { id: string; name: string };
}

export interface Incident {
    id: string;
    title: string;
    description: string;
    status: IncidentStatus;
    severity: Severity;
    environment: Environment;
    system?: System;
    job?: Job;
    assignedTeam?: Team;
    assignedTeamId?: string;
    slaId?: string;
    createdBy?: User;
    updatedBy?: { id: string; name: string };
    resolvedBy?: User;
    resolvedAt?: string;
    createdAt: string;
    startDatetime: string;
    endDatetime?: string;
    updatedAt: string;
    logs?: Log[];
    linkedProcedure?: Procedure;
}

export interface Procedure {
    id: string;
    title: string;
    description: string;
    system: System;
    job?: Job;
    errorCode?: string;
    tags?: string;
    rootCause?: string;
    resolutionSteps: string;
    workaround?: string;
    commands?: string;
    createdBy?: User;
    createdAt: string;
    incidents?: Incident[];
    _count?: { incidents: number };
}

export interface SearchResults {
    procedures: Procedure[];
    incidents: Incident[];
}
