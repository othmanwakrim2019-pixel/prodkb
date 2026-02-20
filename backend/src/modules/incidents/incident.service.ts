
/**
 * Incident Service - Business logic for incident management
 * @module modules/incidents/incident.service
 */

import { prisma } from '../../common/utils/prisma';
import { logger } from '../../common/utils/logger';
import { emailService } from '../../common/services/emailService';
import { fileUploadService } from '../../common/services/fileUploadService';
import { NotFoundError, ValidationError, ConflictError } from '../../common/errors/app.error';
import { IncidentStatus } from '../../constants';
import type { IncidentStatusType } from '../../constants';
import type { CreateIncidentDTO, UpdateIncidentDTO, IIncident, PaginatedResult, PaginationParams, IIncidentLog } from '../../types';
import { autoAssignService } from '../auto-assign/auto-assign.service';
import { webhookService } from '../webhooks/webhook.service';

// ── Incident Status State Machine ──
// Defines which status transitions are allowed.
const ALLOWED_TRANSITIONS: Record<string, string[]> = {
    [IncidentStatus.OPEN]: [IncidentStatus.ACKNOWLEDGED, IncidentStatus.IN_PROGRESS, IncidentStatus.RESOLVED],
    [IncidentStatus.ACKNOWLEDGED]: [IncidentStatus.IN_PROGRESS, IncidentStatus.RESOLVED],
    [IncidentStatus.IN_PROGRESS]: [IncidentStatus.RESOLVED, IncidentStatus.OPEN],
    [IncidentStatus.RESOLVED]: [IncidentStatus.CLOSED, IncidentStatus.OPEN],
    [IncidentStatus.CLOSED]: [IncidentStatus.OPEN], // Allow reopen
};

function validateStatusTransition(currentStatus: string, newStatus: string): void {
    const allowed = ALLOWED_TRANSITIONS[currentStatus];
    if (!allowed || !allowed.includes(newStatus)) {
        throw new ValidationError(
            `Invalid status transition: '${currentStatus}' → '${newStatus}'. ` +
            `Allowed transitions from '${currentStatus}': [${(allowed || []).join(', ')}]`
        );
    }
}

export interface IncidentStats {
    createdToday: number;
    resolvedToday: number;
    closedCount: number;
    activeIncidents: number;
    avgResolutionTimeMinutes: number;
    topSystems: Array<{ systemId: string; count: number; name: string }>;
    statusBreakdown: Array<{ status: string; count: number }>;
    trends: Array<{ date: string; created: number; resolved: number }>;
    myWork: { myTeamQueue: number; myTeamBreaches: number };
}

export class IncidentService {
    private readonly defaultInclude = {
        system: true,
        job: true,
        createdBy: { select: { id: true, name: true, email: true } },
        resolvedBy: { select: { id: true, name: true, email: true } },
        assignedTeam: true,
        sla: true,
        linkedProcedure: { select: { id: true, title: true } },

        logs: {
            include: {
                createdBy: { select: { id: true, name: true, email: true } }
            }
        },
        updatedBy: { select: { id: true, name: true } },
    };

    /**
     * Get all incidents with optional filters
     */
    async findAll(
        filters: {
            status?: string;
            severity?: string;
            environment?: string;
            systemId?: string;

            teamId?: string | string[];
            search?: string;
            startDate?: Date;
            endDate?: Date;
        } = {},
        pagination: PaginationParams = {}
    ): Promise<PaginatedResult<IIncident>> {
        const { page = 1, limit = 50, sortBy = 'createdAt', sortOrder = 'desc' } = pagination;
        const skip = (page - 1) * limit;

        const where: Record<string, unknown> = {};

        if (filters.status) where.status = filters.status;
        if (filters.severity) where.severity = filters.severity;
        if (filters.environment) where.environment = filters.environment;
        if (filters.systemId) where.systemId = filters.systemId;

        if (filters.teamId) {
            if (Array.isArray(filters.teamId)) {
                where.assignedTeamId = { in: filters.teamId };
            } else {
                where.assignedTeamId = filters.teamId;
            }
        }
        if (filters.startDate || filters.endDate) {
            const createdAtFilter: Record<string, Date> = {};
            if (filters.startDate) createdAtFilter.gte = filters.startDate;
            if (filters.endDate) {
                const end = new Date(filters.endDate);
                end.setHours(23, 59, 59, 999);
                createdAtFilter.lte = end;
            }
            where.createdAt = createdAtFilter;
        }
        if (filters.search) {
            where.OR = [
                { title: { contains: filters.search } },
                { description: { contains: filters.search } },
            ];
        }

        const [data, total] = await Promise.all([
            prisma.incident.findMany({
                where,
                include: this.defaultInclude,
                skip,
                take: limit,
                orderBy: { [sortBy]: sortOrder },
            }),
            prisma.incident.count({ where }),
        ]);

        return {
            data: data as unknown as IIncident[],
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }

    /**
     * Get a single incident by ID
     */
    async findById(id: string): Promise<IIncident> {
        const incident = await prisma.incident.findUnique({
            where: { id },
            include: this.defaultInclude,
        });

        if (!incident) {
            throw new NotFoundError('Incident not found');
        }

        return incident as unknown as IIncident;
    }

    async searchSimilar(query: string): Promise<IIncident[]> {
        const result = await this.findAll({ search: query });
        return result.data;
    }

    /**
     * Create a new incident with Transaction
     */
    async create(data: CreateIncidentDTO, userId: string): Promise<IIncident> {
        // Validate required relationships exist
        const system = await prisma.system.findUnique({ where: { id: data.systemId } });
        if (!system) throw new ValidationError('Invalid system ID');

        if (data.jobId) {
            const job = await prisma.job.findUnique({ where: { id: data.jobId } });
            if (!job) throw new ValidationError('Invalid job ID');
        }

        // Use interactive transaction
        const incident = await prisma.$transaction(async (tx) => {
            const newIncident = await tx.incident.create({
                data: {
                    title: data.title,
                    description: data.description,
                    environment: data.environment,
                    severity: data.severity,
                    status: IncidentStatus.OPEN,
                    systemId: data.systemId,
                    jobId: data.jobId || null,
                    createdById: userId,
                    // Auto-assignment: if no team specified, let the rules engine decide
                    assignedTeamId: data.assignedTeamId || await autoAssignService.matchRule(data.systemId, data.severity) || null,
                    slaId: data.slaId || null,
                    impact: data.impact || null,
                    detectionSource: data.detectionSource || null,
                    startDatetime: data.startDatetime || new Date(),
                    logs: data.logs ? {
                        create: data.logs.map(log => ({
                            logType: log.logType || 'note',
                            rawLog: log.rawLog,
                            errorMessage: log.errorMessage,
                            errorCode: data.errorCode,
                            createdBy: { connect: { id: userId } }
                        })),
                    } : undefined,
                },
                include: this.defaultInclude,
            });

            // If we needed to side-effect update System health or SLA stats, we would do it here using `tx`

            return newIncident;
        });

        logger.info('Incident created', { incidentId: incident.id, userId, severity: data.severity });

        // Notifications happen AFTER transaction commits
        this.sendNotification(incident, 'created').catch(err => {
            logger.error('Failed to send incident notification', { error: err.message, incidentId: incident.id });
        });

        // Webhook dispatch — fire-and-forget
        webhookService.dispatch('incident.created', { incident }).catch(() => { });

        return incident as unknown as IIncident;
    }

    /**
     * Update an existing incident
     */
    async update(id: string, data: UpdateIncidentDTO, userId: string): Promise<IIncident> {
        const existing = await this.findById(id);

        // ── State machine enforcement ──
        if (data.status && data.status !== existing.status) {
            validateStatusTransition(existing.status, data.status);
        }

        const wasResolved = existing.status === IncidentStatus.RESOLVED;
        const isNowResolved = data.status === IncidentStatus.RESOLVED;

        const updateData: Record<string, unknown> = { ...data };

        // ── Acknowledgement tracking ──
        if (data.status === IncidentStatus.ACKNOWLEDGED && !existing.acknowledgedAt) {
            updateData.acknowledgedAt = new Date();
            updateData.timeToAcknowledge = Math.round(
                (new Date().getTime() - new Date(existing.createdAt).getTime()) / 60000
            );
        }

        // ── Resolution tracking ──
        const wasEffectiveResolved = [IncidentStatus.RESOLVED, IncidentStatus.CLOSED].includes(existing.status as any);
        const isNowEffectiveResolved = [IncidentStatus.RESOLVED, IncidentStatus.CLOSED].includes(data.status as any);

        if (!wasEffectiveResolved && isNowEffectiveResolved) {
            updateData.resolvedById = userId;
            updateData.resolvedAt = new Date();
            updateData.timeToResolve = Math.round(
                (new Date().getTime() - new Date(existing.createdAt).getTime()) / 60000
            );
        }

        updateData.updatedById = userId;

        // ── Optimistic locking ──
        const expectedVersion = (data as any).version;
        if (expectedVersion !== undefined && expectedVersion !== existing.version) {
            throw new ConflictError(
                `Incident has been modified by another user. ` +
                `Expected version ${expectedVersion}, but current version is ${existing.version}. ` +
                `Please refresh and try again.`
            );
        }
        updateData.version = (existing.version ?? 0) + 1;

        // ── Transactional update with optimistic lock ──
        const incident = await prisma.$transaction(async (tx) => {
            return tx.incident.update({
                where: { id, version: existing.version }, // optimistic lock
                data: updateData,
                include: this.defaultInclude,
            });
        });

        logger.info('Incident updated', { incidentId: id, userId, changes: Object.keys(data) });

        if (!wasResolved && isNowResolved) {
            this.sendNotification(incident, 'resolved').catch(err => logger.error('Failed to send notification', { error: err.message }));
        } else {
            this.sendNotification(incident, 'updated').catch(err => logger.error('Failed to send notification', { error: err.message }));
        }

        // Webhook dispatch — fire-and-forget
        const webhookEvent = isNowResolved ? 'incident.resolved' : 'incident.updated';
        webhookService.dispatch(webhookEvent, { incident }).catch(() => { });

        return incident as unknown as IIncident;
    }

    /**
     * Acknowledge an incident — dedicated endpoint
     * Transitions: Open → Acknowledged, sets timestamps
     */
    async acknowledge(id: string, userId: string): Promise<IIncident> {
        const incident = await this.findById(id);

        if (incident.status !== IncidentStatus.OPEN) {
            throw new ValidationError(
                `Cannot acknowledge incident in status '${incident.status}'. Only 'Open' incidents can be acknowledged.`
            );
        }

        if (incident.acknowledgedAt) {
            throw new ValidationError('Incident has already been acknowledged.');
        }

        const now = new Date();
        const timeToAcknowledge = Math.round(
            (now.getTime() - new Date(incident.createdAt).getTime()) / 60000
        );

        const updated = await prisma.incident.update({
            where: { id },
            data: {
                status: IncidentStatus.ACKNOWLEDGED,
                acknowledgedAt: now,
                timeToAcknowledge,
                updatedById: userId,
                version: (incident.version ?? 0) + 1,
            },
            include: this.defaultInclude,
        });

        // Log the acknowledgement
        await prisma.incidentLog.create({
            data: {
                incidentId: id,
                logType: 'note',
                rawLog: `Incident acknowledged. Time to acknowledge: ${timeToAcknowledge} minutes.`,
                createdById: userId,
            },
        });

        logger.info('Incident acknowledged', { incidentId: id, userId, timeToAcknowledge });

        this.sendNotification(updated, 'updated').catch(err =>
            logger.error('Failed to send notification', { error: err.message })
        );

        webhookService.dispatch('incident.updated', { incident: updated }).catch(() => { });

        return updated as unknown as IIncident;
    }

    async addLog(incidentId: string, data: {
        logType: string;
        rawLog?: string;
        errorCode?: string;
        errorMessage?: string;
        metadata?: string;
    }, userId: string): Promise<IIncidentLog> {
        await this.findById(incidentId);

        const log = await prisma.incidentLog.create({
            data: {
                incidentId,
                createdById: userId,
                logType: data.logType,
                rawLog: data.rawLog,
                errorCode: data.errorCode,
                errorMessage: data.errorMessage,
                metadata: data.metadata
            }
        });

        return log as unknown as IIncidentLog;
    }

    async getFileLog(incidentId: string, fileName: string): Promise<IIncidentLog> {
        const log = await prisma.incidentLog.findFirst({
            where: {
                incidentId,
                fileName,
                logType: 'file'
            }
        });

        if (!log) throw new NotFoundError('File log not found');
        return log as unknown as IIncidentLog;
    }

    async addFileLog(incidentId: string, fileData: {
        filePath: string;
        fileName: string;
        fileSize: number;
        mimeType: string;
    }, userId: string): Promise<IIncidentLog> {
        await this.findById(incidentId);

        const log = await prisma.incidentLog.create({
            data: {
                incidentId,
                createdById: userId,
                logType: 'file',
                filePath: fileData.filePath,
                fileName: fileData.fileName,
                fileSize: fileData.fileSize,
                mimeType: fileData.mimeType
            }
        });

        return log as unknown as IIncidentLog;
    }

    /**
     * Delete a file log and its underlying file.
     * Only the original uploader or an ADMIN can delete.
     */
    async deleteFileLog(incidentId: string, fileName: string, userId: string, userRole: string): Promise<void> {
        const log = await prisma.incidentLog.findFirst({
            where: { incidentId, fileName, logType: 'file' },
        });

        if (!log) throw new NotFoundError('File log not found');

        // Ownership check: only the uploader or an ADMIN can delete
        if (log.createdById !== userId && userRole !== 'ADMIN') {
            throw new ValidationError('You can only delete files that you uploaded');
        }

        // Delete the file from disk/S3
        if (log.filePath) {
            try {
                await fileUploadService.deleteFile(log.filePath);
            } catch (err) {
                logger.warn('Could not delete file from storage', { filePath: log.filePath, error: err });
            }
        }

        // Delete the log record
        await prisma.incidentLog.delete({ where: { id: log.id } });

        logger.info('File deleted', { incidentId, fileName, deletedBy: userId });
    }

    async delete(id: string, userId: string): Promise<void> {
        await this.findById(id);
        await prisma.incident.delete({ where: { id } });
        logger.info('Incident deleted', { incidentId: id, userId });
    }

    async linkProcedure(incidentId: string, procedureId: string): Promise<IIncident> {
        await this.findById(incidentId);

        const procedure = await prisma.procedure.findUnique({ where: { id: procedureId } });
        if (!procedure) throw new NotFoundError('Procedure not found');

        const incident = await prisma.incident.update({
            where: { id: incidentId },
            data: { linkedProcedureId: procedureId },
            include: this.defaultInclude,
        });

        return incident as unknown as IIncident;
    }

    async getStats(filters: {
        startDate?: Date;
        endDate?: Date;
        systemId?: string;
        teamId?: string;
        userId?: string;
        userRole?: string;
        userTeamIds?: string[];
    }): Promise<IncidentStats> {
        const { startDate, endDate, systemId, teamId, userRole, userTeamIds } = filters;
        const now = new Date();
        const start = startDate || new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
        const end = endDate || new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

        // ── Role-based scope ──
        // Admin sees everything; standard users see only their team's incidents
        const isAdmin = userRole === 'ADMIN';
        const scopeFilter: Record<string, unknown> = {};
        if (!isAdmin && userTeamIds && userTeamIds.length > 0) {
            scopeFilter.assignedTeamId = { in: userTeamIds };
        } else if (!isAdmin) {
            // User has no teams — they should see nothing
            scopeFilter.assignedTeamId = { in: [] };
        }

        // ── Base where clause (period + scope + optional UI filters) ──
        const where: Record<string, unknown> = {
            createdAt: { gte: start, lte: end },
            ...scopeFilter,
        };
        if (systemId) where.systemId = systemId;
        if (teamId) where.assignedTeamId = teamId; // UI filter overrides scope

        // ── Active incidents (no date filter, only scope + status) ──
        const activeWhere: Record<string, unknown> = {
            ...scopeFilter,
            status: { in: [IncidentStatus.OPEN, IncidentStatus.IN_PROGRESS] },
        };
        if (systemId) activeWhere.systemId = systemId;
        if (teamId) activeWhere.assignedTeamId = teamId;

        // ── Resolved where (resolved within period) ──
        const resolvedWhere: Record<string, unknown> = {
            ...scopeFilter,
            resolvedAt: { gte: start, lte: end },
        };
        if (systemId) resolvedWhere.systemId = systemId;
        if (teamId) resolvedWhere.assignedTeamId = teamId;

        // ── Closed where (status = CLOSED, created in period) ──
        const closedWhere: Record<string, unknown> = {
            ...scopeFilter,
            status: IncidentStatus.CLOSED,
            createdAt: { gte: start, lte: end },
        };
        if (systemId) closedWhere.systemId = systemId;
        if (teamId) closedWhere.assignedTeamId = teamId;

        // ── 1. Core KPI counts ──
        const [created, resolved, active, closed] = await Promise.all([
            prisma.incident.count({ where }),
            prisma.incident.count({ where: resolvedWhere }),
            prisma.incident.count({ where: activeWhere }),
            prisma.incident.count({ where: closedWhere }),
        ]);

        // ── 2. Average resolution time ──
        const avgResult = await prisma.incident.aggregate({
            where: {
                ...resolvedWhere,
                status: { in: [IncidentStatus.RESOLVED, IncidentStatus.CLOSED] },
                timeToResolve: { not: null },
            },
            _avg: { timeToResolve: true },
        });
        const avgResolutionTime = Math.round(avgResult._avg.timeToResolve || 0);

        // ── 3. Status breakdown ──
        const statusCounts = await prisma.incident.groupBy({
            by: ['status'],
            where,
            _count: { status: true }
        });
        const statusBreakdown = statusCounts.map(s => ({
            status: s.status,
            count: s._count.status
        }));

        // ── 4. Trends — daily created/resolved over the period ──
        const trendMap = new Map<string, { created: number; resolved: number }>();

        // Initialize all dates in range
        const cursor = new Date(start);
        while (cursor <= end) {
            const key = cursor.toISOString().split('T')[0];
            trendMap.set(key, { created: 0, resolved: 0 });
            cursor.setDate(cursor.getDate() + 1);
        }

        // Created per day
        const createdIncidents = await prisma.incident.findMany({
            where,
            select: { createdAt: true },
        });
        for (const inc of createdIncidents) {
            const key = inc.createdAt.toISOString().split('T')[0];
            const entry = trendMap.get(key);
            if (entry) entry.created++;
        }

        // Resolved per day
        const resolvedIncidents = await prisma.incident.findMany({
            where: { ...resolvedWhere, resolvedAt: { not: null, gte: start, lte: end } },
            select: { resolvedAt: true },
        });
        for (const inc of resolvedIncidents) {
            if (inc.resolvedAt) {
                const key = inc.resolvedAt.toISOString().split('T')[0];
                const entry = trendMap.get(key);
                if (entry) entry.resolved++;
            }
        }

        const trends = Array.from(trendMap.entries()).map(([date, data]) => ({
            date,
            created: data.created,
            resolved: data.resolved,
        }));

        // ── 5. Top failing systems ──
        const topSystemsRaw = await prisma.incident.groupBy({
            by: ['systemId'],
            where,
            _count: { id: true },
            orderBy: { _count: { id: 'desc' } },
            take: 5,
        });

        const systemIds = topSystemsRaw.map(s => s.systemId);
        const systemNames = systemIds.length > 0
            ? await prisma.system.findMany({
                where: { id: { in: systemIds } },
                select: { id: true, name: true },
            })
            : [];
        const nameMap = new Map(systemNames.map(s => [s.id, s.name]));

        const topSystems = topSystemsRaw.map(s => ({
            systemId: s.systemId,
            name: nameMap.get(s.systemId) || 'Unknown',
            count: s._count.id,
        }));

        // ── 6. My Work — always scoped to user's teams ──
        const myTeamFilter: Record<string, unknown> = {};
        if (userTeamIds && userTeamIds.length > 0) {
            myTeamFilter.assignedTeamId = { in: userTeamIds };
        } else {
            myTeamFilter.assignedTeamId = { in: [] };
        }

        const [myTeamQueue, myTeamBreaches] = await Promise.all([
            prisma.incident.count({
                where: {
                    ...myTeamFilter,
                    status: { in: [IncidentStatus.OPEN, IncidentStatus.IN_PROGRESS] },
                },
            }),
            prisma.incident.count({
                where: {
                    ...myTeamFilter,
                    slaBreached: true,
                    status: { in: [IncidentStatus.OPEN, IncidentStatus.IN_PROGRESS] },
                },
            }),
        ]);

        return {
            createdToday: created,
            resolvedToday: resolved,
            closedCount: closed,
            activeIncidents: active,
            avgResolutionTimeMinutes: avgResolutionTime,
            topSystems,
            statusBreakdown,
            trends,
            myWork: { myTeamQueue, myTeamBreaches },
        };
    }

    private async sendNotification(incident: unknown, type: 'created' | 'updated' | 'resolved'): Promise<void> {
        try {
            switch (type) {
                case 'created': await emailService.sendIncidentCreated({ incident }); break;
                case 'updated': await emailService.sendIncidentUpdated({ incident }); break;
                case 'resolved': await emailService.sendIncidentResolved({ incident }); break;
            }
        } catch (e) {
            // Notifications shouldn't fail the request
            logger.warn('Notification failed', { error: e });
        }
    }
}

export const incidentService = new IncidentService();
