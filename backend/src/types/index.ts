// ── Enums (previously in types/enums.ts) ──

/** Incident status values */
export enum IncidentStatus {
    OPEN = 'Open',
    ACKNOWLEDGED = 'Acknowledged',
    IN_PROGRESS = 'In Progress',
    RESOLVED = 'Resolved',
    CLOSED = 'Closed',
}

/** Incident severity levels */
export enum Severity {
    CRITICAL = 'Critical',
    HIGH = 'High',
    MEDIUM = 'Medium',
    LOW = 'Low',
}

/** Environment types */
export enum Environment {
    PROD = 'PROD',
    PREPROD = 'PREPROD',
    RECETTE = 'RECETTE',
}

/** User roles */
export enum UserRole {
    ADMIN = 'ADMIN',
    EXPERT = 'EXPERT',
    OPERATOR = 'OPERATOR',
    VIEWER = 'VIEWER',
}

/**
 * User entity interface
 */
export interface IUser {
    id: string;
    name: string;
    email: string;
    password?: string;
    isActive: boolean;
    roleId: string | null;
    role?: IRole | null;
    createdAt: Date;
    updatedAt: Date;
}

/**
 * User without sensitive data
 */
export interface IUserPublic {
    id: string;
    name: string;
    email: string;
    isActive: boolean;
    role?: string | null;
    createdAt: Date;
}

/**
 * Role entity interface
 */
export interface IRole {
    id: string;
    name: string;
    description: string | null;
    permissions?: IPermission[];
}

/**
 * Permission entity interface
 */
export interface IPermission {
    id: string;
    code: string;
    description: string | null;
}

/**
 * Team entity interface
 */
export interface ITeam {
    id: string;
    name: string;
    description: string | null;
    emailDistribution: string;
    isActive: boolean;
    sendEmail: boolean;
    createdAt: Date;
    updatedAt: Date;
}

/**
 * System entity interface
 */
export interface ISystem {
    id: string;
    name: string;
    description: string | null;
    jobs?: IJob[];
}

/**
 * Job entity interface
 */
export interface IJob {
    id: string;
    name: string;
    code: string;
    systemId: string;
    teamId: string | null;
    system?: ISystem;
    team?: ITeam | null;
}

/**
 * SLA entity interface
 */
export interface ISLA {
    id: string;
    name: string;
    description: string | null;
    severity: Severity;
    acknowledgeTimeMinutes: number;
    resolveTimeMinutes: number;
    isActive: boolean;
}

/**
 * Incident entity interface
 */
export interface IIncident {
    id: string;
    title: string;
    description: string;
    environment: Environment;
    severity: Severity;
    status: IncidentStatus;
    impact: string | null;
    detectionSource: string | null;
    startDatetime: Date | null;
    endDatetime: Date | null;
    systemId: string;
    system?: ISystem;
    jobId: string | null;
    job?: IJob | null;
    createdById: string;
    createdBy?: IUserPublic;
    resolvedById: string | null;
    resolvedBy?: IUserPublic | null;
    assignedTeamId: string | null;
    assignedTeam?: ITeam | null;
    slaId: string | null;
    sla?: ISLA | null;
    acknowledgedAt: Date | null;
    resolvedAt: Date | null;
    timeToAcknowledge: number | null;
    timeToResolve: number | null;
    linkedProcedureId: string | null;
    linkedProcedure?: IProcedure | null;
    logs?: IIncidentLog[];
    // Phase 2: Optimistic locking + SLA enforcement
    version: number;
    escalationLevel: number;
    slaBreached: boolean;
    slaBreachNotifiedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
}

/**
 * Incident log entry interface
 */
export interface IIncidentLog {
    id: string;
    incidentId: string;
    logType: string;
    errorCode: string | null;
    errorMessage: string | null;
    rawLog: string | null;
    metadata: string | null;
    filePath: string | null;
    fileName: string | null;
    fileSize: number | null;
    mimeType: string | null;
    createdById: string;
    createdBy?: IUserPublic;
    createdAt: Date;
}

/**
 * Procedure entity interface
 */
export interface IProcedure {
    id: string;
    title: string;
    description: string;
    rootCause: string | null;
    resolutionSteps: string;
    workaround: string | null;
    commands: string | null;
    errorCode: string | null;
    tags: string | null;
    systemId: string;
    system?: ISystem;
    jobId: string | null;
    job?: IJob | null;
    createdById: string;
    createdBy?: IUserPublic;
    updatedById: string | null;
    updatedBy?: IUserPublic | null;
    incidents?: IIncident[];
    createdAt: Date;
    updatedAt: Date;
}

/**
 * Astreinte (On-call) interface
 */
export interface IAstreinte {
    id: string;
    weekNumber: number;
    year: number;
    startDate: Date;
    endDate: Date;
    phone: string | null;
    notes: string | null;
    teamId: string;
    team?: ITeam;
    userId: string;
    user?: IUserPublic;
    createdById: string;
    createdAt: Date;
    updatedAt: Date;
}

/**
 * Daily Plan interface
 */
export interface IDailyPlan {
    id: string;
    date: Date;
    label: string | null;
    isWeekend: boolean;
    teamId: string;
    team?: ITeam;
    createdById: string;
    createdAt: Date;
    updatedAt: Date;
    tasks?: IOperationalTask[];
}

/**
 * Operational Task interface
 */
export interface IOperationalTask {
    id: string;
    planId: string;
    title: string;
    description: string | null;
    taskType: string;
    priority: string;
    status: string;
    startTime: Date | null;
    endTime: Date | null;
    systemId: string | null;
    system?: ISystem | null;
    chainLabel: string | null;
    assignedToId: string;
    assignedTo?: IUserPublic;
    note: string | null;
    startedAt: Date | null;
    completedAt: Date | null;
    createdById: string;
    createdAt: Date;
    updatedAt: Date;
}

/**
 * Create incident DTO
 */
export interface CreateIncidentDTO {
    title: string;
    description: string;
    environment: Environment;
    severity: Severity;
    systemId: string;
    jobId?: string;
    assignedTeamId?: string;
    slaId?: string;
    impact?: string;
    detectionSource?: string;
    startDatetime?: Date;
    errorCode?: string;
    logs?: Array<{
        logType?: string;
        rawLog?: string;
        errorMessage?: string;
    }>;
}

/**
 * Update incident DTO
 */
export interface UpdateIncidentDTO {
    title?: string;
    description?: string;
    status?: IncidentStatus;
    severity?: Severity;
    impact?: string;
    assignedTeamId?: string;
    linkedProcedureId?: string;
}

/**
 * Create user DTO
 */
export interface CreateUserDTO {
    name: string;
    email: string;
    password: string;
    role?: string;
    team?: string;
    teamId?: string;
    teamRole?: string;
    isActive?: boolean;
}

/**
 * Update user DTO
 */
export interface UpdateUserDTO {
    name?: string;
    email?: string;
    role?: string;
    isActive?: boolean;
}

/**
 * Create procedure DTO
 */
export interface CreateProcedureDTO {
    title: string;
    description: string;
    systemId: string;
    jobId?: string;
    rootCause?: string;
    resolutionSteps: string;
    workaround?: string;
    commands?: string;
    errorCode?: string;
    tags?: string;
}

/**
 * Pagination parameters
 */
export interface PaginationParams {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}

/**
 * Paginated result
 */
export interface PaginatedResult<T> {
    data: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}
