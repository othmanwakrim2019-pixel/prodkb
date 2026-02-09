/**
 * Application-wide constants and enums
 * Eliminates magic strings throughout the codebase
 * @module constants
 */

/**
 * Incident status values
 */
export const IncidentStatus = {
    OPEN: 'Open',
    IN_PROGRESS: 'In Progress',
    RESOLVED: 'Resolved',
    CLOSED: 'Closed',
} as const;

export type IncidentStatusType = typeof IncidentStatus[keyof typeof IncidentStatus];

/**
 * Incident severity levels
 */
export const Severity = {
    CRITICAL: 'Critical',
    HIGH: 'High',
    MEDIUM: 'Medium',
    LOW: 'Low',
} as const;

export type SeverityType = typeof Severity[keyof typeof Severity];

/**
 * Environment types
 */
export const Environment = {
    PROD: 'PROD',
    PREPROD: 'PREPROD',
    RECETTE: 'RECETTE',
} as const;

export type EnvironmentType = typeof Environment[keyof typeof Environment];

/**
 * User roles
 */
export const UserRole = {
    ADMIN: 'ADMIN',
    EXPERT: 'EXPERT',
    OPERATOR: 'OPERATOR',
    VIEWER: 'VIEWER',
} as const;

export type UserRoleType = typeof UserRole[keyof typeof UserRole];

/**
 * Team member roles
 */
export const TeamMemberRole = {
    LEAD: 'LEAD',
    MEMBER: 'MEMBER',
} as const;

export type TeamMemberRoleType = typeof TeamMemberRole[keyof typeof TeamMemberRole];

/**
 * Audit log action types
 */
export const AuditAction = {
    LOGIN: 'LOGIN',
    LOGOUT: 'LOGOUT',
    CREATE: 'CREATE',
    UPDATE: 'UPDATE',
    DELETE: 'DELETE',
    EXPORT: 'EXPORT',
    VIEW: 'VIEW',
} as const;

export type AuditActionType = typeof AuditAction[keyof typeof AuditAction];

/**
 * Audit log entity types
 */
export const EntityType = {
    USER: 'USER',
    INCIDENT: 'INCIDENT',
    PROCEDURE: 'PROCEDURE',
    TEAM: 'TEAM',
    SYSTEM: 'SYSTEM',
    JOB: 'JOB',
    SLA: 'SLA',
    ROLE: 'ROLE',
} as const;

export type EntityTypeType = typeof EntityType[keyof typeof EntityType];

/**
 * Incident log types
 */
export const LogType = {
    RAW_LOG: 'raw_log',
    SCREENSHOT: 'screenshot',
    FILE: 'file',
    ERROR_MESSAGE: 'error_message',
    NOTE: 'note',
} as const;

export type LogTypeType = typeof LogType[keyof typeof LogType];

/**
 * Permission codes
 */
export const Permission = {
    // Incident permissions
    INCIDENT_CREATE: 'INCIDENT_CREATE',
    INCIDENT_EDIT: 'INCIDENT_EDIT',
    INCIDENT_DELETE: 'INCIDENT_DELETE',
    INCIDENT_VIEW: 'INCIDENT_VIEW',

    // Procedure permissions
    PROCEDURE_CREATE: 'PROCEDURE_CREATE',
    PROCEDURE_EDIT: 'PROCEDURE_EDIT',
    PROCEDURE_DELETE: 'PROCEDURE_DELETE',
    PROCEDURE_VIEW: 'PROCEDURE_VIEW',

    // Management permissions
    USER_MANAGE: 'USER_MANAGE',
    SYSTEM_MANAGE: 'SYSTEM_MANAGE',
    TEAM_MANAGE: 'TEAM_MANAGE',
    SLA_MANAGE: 'SLA_MANAGE',
    ROLE_MANAGE: 'ROLE_MANAGE',
    AUDIT_VIEW: 'AUDIT_VIEW',

    // Dashboard
    DASHBOARD_VIEW: 'DASHBOARD_VIEW',
} as const;

export type PermissionType = typeof Permission[keyof typeof Permission];
