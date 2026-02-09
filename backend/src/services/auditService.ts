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
