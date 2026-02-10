import { prisma } from '../utils/prisma';
import { Request } from 'express';

export type AuditActionType = 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGOUT';
export type AuditEntityType = 'INCIDENT' | 'USER' | 'TEAM' | 'ROLE' | 'PROCEDURE' | 'SYSTEM' | 'JOB' | 'SLA';

interface AuditLogParams {
    userId: string;
    actionType: AuditActionType;
    entityType: AuditEntityType;
    entityId: string;
    details?: string;
    req?: Request;
}

/**
 * Check if auditing is enabled for a given entity type
 */
async function isAuditEnabled(entityType: AuditEntityType): Promise<boolean> {
    try {
        const config = await prisma.systemConfig.findUnique({
            where: { key: `audit.enabled.${entityType.toLowerCase()}` }
        });
        // Default to enabled if config not found
        return config ? config.value === 'true' : true;
    } catch {
        return true; // Default to enabled on error
    }
}

/**
 * Log an audit event
 */
export async function logAudit(params: AuditLogParams): Promise<void> {
    const { userId, actionType, entityType, entityId, details, req } = params;

    try {
        // Check if auditing is enabled for this entity type
        const enabled = await isAuditEnabled(entityType);
        if (!enabled) {
            return;
        }

        await prisma.auditLog.create({
            data: {
                userId,
                actionType,
                entityType,
                entityId,
                details,
                ipAddress: req?.ip || req?.socket?.remoteAddress || null,
                userAgent: req?.get('user-agent') || null,
                result: 'SUCCESS'
            }
        });
    } catch (error) {
        // Log error but don't throw - audit logging should not break main flow
        console.error('[AuditService] Failed to create audit log:', error);
    }
}

/**
 * Log a failed action
 */
export async function logAuditFailure(
    params: AuditLogParams,
    errorMessage?: string
): Promise<void> {
    const { userId, actionType, entityType, entityId, details, req } = params;

    try {
        const enabled = await isAuditEnabled(entityType);
        if (!enabled) return;

        await prisma.auditLog.create({
            data: {
                userId,
                actionType,
                entityType,
                entityId,
                details: errorMessage || details,
                ipAddress: req?.ip || req?.socket?.remoteAddress || null,
                userAgent: req?.get('user-agent') || null,
                result: 'FAILURE'
            }
        });
    } catch (error) {
        console.error('[AuditService] Failed to create audit failure log:', error);
    }
}
/**
 * Generate a human-readable diff between two objects
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function generateAuditDiff(original: any, updated: any): string {
    const changes: string[] = [];

    // Helper to get name from entity if available
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const getName = (obj: any, field: string): string | undefined => {
        if (!obj) return undefined;

        // Handle specific relation fields
        if (field === 'systemId' && obj.system) return obj.system.name;
        if (field === 'teamId' && obj.team) return obj.team.name;
        if (field === 'jobId' && obj.job) return `${obj.job.name} (${obj.job.code})`;
        if (field === 'userId' && obj.user) return obj.user.name;

        return undefined;
    };

    // Helper to format value
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const formatVal = (val: any, field: string, contextObj: any): string => {
        if (val === null || val === undefined) return 'None';
        if (val === '') return 'Empty';
        if (typeof val === 'boolean') return val ? 'True' : 'False';

        // Try to resolve name for IDs
        const resolvedName = getName(contextObj, field);
        if (resolvedName) return resolvedName;

        return String(val);
    };

    // Fields to ignore in diff
    const ignoredFields = ['updatedAt', 'createdAt', 'password', 'id'];

    // Iterate over keys in updated object
    Object.keys(updated).forEach(key => {
        if (ignoredFields.includes(key)) return;

        const oldVal = original[key];
        const newVal = updated[key];

        // Skip if both are null/undefined or equal
        if (oldVal == newVal) return; // loose equality checks for null/undefined mismatch
        if (JSON.stringify(oldVal) === JSON.stringify(newVal)) return;

        // Custom label mapping
        const labelMap: Record<string, string> = {
            systemId: 'System',
            teamId: 'Team',
            jobId: 'Job',
            userId: 'Assigned User',
            name: 'Name',
            description: 'Description',
            status: 'Status',
            priority: 'Priority', // or severity
            severity: 'Severity',
            role: 'Role',
            isActive: 'Active Status',
            sendEmail: 'Email Notifications'
        };

        const label = labelMap[key] || key;
        const from = formatVal(oldVal, key, original);
        const to = formatVal(newVal, key, updated);

        changes.push(`${label}: '${from}' -> '${to}'`);
    });

    return changes.length > 0 ? changes.join(', ') : 'No changes detected';
}
