/**
 * Incident status values
 */
export enum IncidentStatus {
    OPEN = 'Open',
    ACKNOWLEDGED = 'Acknowledged',
    IN_PROGRESS = 'In Progress',
    RESOLVED = 'Resolved',
    CLOSED = 'Closed',
}

/**
 * Incident severity levels
 */
export enum Severity {
    CRITICAL = 'Critical',
    HIGH = 'High',
    MEDIUM = 'Medium',
    LOW = 'Low',
}

/**
 * Environment types
 */
export enum Environment {
    PROD = 'PROD',
    PREPROD = 'PREPROD',
    RECETTE = 'RECETTE',
}

/**
 * User roles
 */
export enum UserRole {
    ADMIN = 'ADMIN',
    EXPERT = 'EXPERT',
    OPERATOR = 'OPERATOR',
    VIEWER = 'VIEWER',
}
