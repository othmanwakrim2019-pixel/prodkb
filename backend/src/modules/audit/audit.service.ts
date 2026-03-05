
import { prisma } from '../../common/utils/prisma';
import { Request } from 'express';
import { logger } from '../../common/utils/logger';

export type AuditActionType = 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGOUT';
export type AuditEntityType = 'INCIDENT' | 'USER' | 'TEAM' | 'ROLE' | 'PROCEDURE' | 'SYSTEM' | 'JOB' | 'SLA' | 'PLANNING_JOB' | 'PLANNING_INSTANCE';

interface AuditLogParams {
    userId: string;
    actionType: AuditActionType;
    entityType: AuditEntityType;
    entityId: string;
    details?: string;
    req?: Request;
}

/**
 * Audit Service handles logging and retrieval of audit logs.
 */
export class AuditService {

    /**
     * Check if auditing is enabled for a given entity type
     */
    private async isAuditEnabled(entityType: AuditEntityType): Promise<boolean> {
        try {
            const config = await prisma.systemConfig.findUnique({
                where: { key: `audit.enabled.${entityType.toLowerCase()}` }
            });
            return config ? config.value === 'true' : true;
        } catch {
            return true;
        }
    }

    /**
     * Log an audit event
     */
    async logAudit(params: AuditLogParams): Promise<void> {
        const { userId, actionType, entityType, entityId, details, req } = params;

        try {
            const enabled = await this.isAuditEnabled(entityType);
            if (!enabled) return;

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
            logger.error('[AuditService] Failed to create audit log:', error);
        }
    }

    /**
     * Log a failed action
     */
    async logAuditFailure(params: AuditLogParams, errorMessage?: string): Promise<void> {
        const { userId, actionType, entityType, entityId, details, req } = params;

        try {
            const enabled = await this.isAuditEnabled(entityType);
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
            logger.error('[AuditService] Failed to create audit failure log:', error);
        }
    }

    /**
     * Generate a human-readable diff between two objects
     */
    generateAuditDiff(original: Record<string, unknown> | null, updated: Record<string, unknown> | null): string {
        if (!original || !updated) return 'No changes detected';
        const changes: string[] = [];

        // Helper to get name from entity if available
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const getName = (obj: any, field: string): string | undefined => {
            if (!obj) return undefined;
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
            const resolvedName = getName(contextObj, field);
            if (resolvedName) return resolvedName;
            return String(val);
        };

        const ignoredFields = ['updatedAt', 'createdAt', 'password', 'id'];

        Object.keys(updated).forEach(key => {
            if (ignoredFields.includes(key)) return;

            const oldVal = original[key];
            const newVal = updated[key];

            if (oldVal == newVal) return;
            if (JSON.stringify(oldVal) === JSON.stringify(newVal)) return;

            const labelMap: Record<string, string> = {
                systemId: 'System', teamId: 'Team', jobId: 'Job', userId: 'Assigned User',
                name: 'Name', description: 'Description', status: 'Status', priority: 'Priority',
                severity: 'Severity', role: 'Role', isActive: 'Active Status', sendEmail: 'Email Notifications'
            };

            const label = labelMap[key] || key;
            const from = formatVal(oldVal, key, original);
            const to = formatVal(newVal, key, updated);

            changes.push(`${label}: '${from}' -> '${to}'`);
        });

        return changes.length > 0 ? changes.join(', ') : 'No changes detected';
    }

    /**
     * Get audits with filtering (Migrated from Controller)
     */
    async getAuditLogs(filters: { userId?: string; action?: string; entityType?: string; startDate?: string; endDate?: string }) {
        const { userId, action, entityType, startDate, endDate } = filters;
        const where: any = {};

        if (userId) where.userId = userId;
        if (action) where.actionType = action;
        if (entityType) where.entityType = entityType;

        if (startDate || endDate) {
            where.timestamp = {};
            if (startDate) where.timestamp.gte = new Date(startDate);
            if (endDate) where.timestamp.lte = new Date(endDate);
        }

        return prisma.auditLog.findMany({
            where,
            include: {
                user: {
                    select: { id: true, name: true, email: true }
                }
            },
            orderBy: { timestamp: 'desc' },
            take: 100
        });
    }
}

export const auditService = new AuditService();

// Standalone exports for backward compatibility during refactor (or to be used by helpers)
// But to make migration cleaner, I should probably encourage using the instance.
// However, `logAudit` was a standalone function.
export const logAudit = auditService.logAudit.bind(auditService);
export const logAuditFailure = auditService.logAuditFailure.bind(auditService);
export const generateAuditDiff = auditService.generateAuditDiff.bind(auditService);
