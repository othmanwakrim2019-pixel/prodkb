/**
 * Incident Service - Business logic for incident management
 * @module services/IncidentService
 */

import { prisma } from '../utils/prisma';
import { logger } from '../utils/logger';
import { emailService } from './emailService';
import { NotFoundError, ValidationError } from '../errors/AppError';
import { IncidentStatus, Severity } from '../constants';
import type { CreateIncidentDTO, UpdateIncidentDTO, IIncident, PaginatedResult, PaginationParams, IIncidentLog } from '../types';

/**
 * Service class for incident-related business logic
 */
export class IncidentService {
    /**
     * Default includes for incident queries
     */
    private readonly defaultInclude = {
        system: true,
        job: true,
        createdBy: { select: { id: true, name: true, email: true } },
        resolvedBy: { select: { id: true, name: true, email: true } },
        assignedTeam: true,
        sla: true,
        linkedProcedure: { select: { id: true, title: true } },
        logs: true,
    };

    /**
     * Get all incidents with optional filters
     * @param filters - Query filters
     * @param pagination - Pagination parameters
     */
    async findAll(
        filters: {
            status?: string;
            severity?: string;
            environment?: string;
            systemId?: string;
            teamId?: string;
            search?: string;
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
        if (filters.teamId) where.assignedTeamId = filters.teamId;
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

        logger.debug('Fetched incidents', { count: data.length, total, filters });

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
     * @param id - Incident ID
     * @throws NotFoundError if incident doesn't exist
     */
    async findById(id: string): Promise<IIncident> {
        const incident = await prisma.incident.findUnique({
            where: { id },
            include: this.defaultInclude,
        });

        if (!incident) {
            throw new NotFoundError('Incident');
        }

        return incident as unknown as IIncident;
    }

    /**
     * Search for similar incidents
     * @param query - Search query string
     */
    async searchSimilar(query: string): Promise<IIncident[]> {
        const result = await this.findAll({ search: query });
        return result.data;
    }

    /**
     * Create a new incident
     * @param data - Incident creation data
     * @param userId - ID of the user creating the incident
     */
    async create(data: CreateIncidentDTO, userId: string): Promise<IIncident> {
        // Validate required relationships exist
        const system = await prisma.system.findUnique({ where: { id: data.systemId } });
        if (!system) {
            throw new ValidationError('Invalid system ID');
        }

        if (data.jobId) {
            const job = await prisma.job.findUnique({ where: { id: data.jobId } });
            if (!job) {
                throw new ValidationError('Invalid job ID');
            }
        }

        // Create the incident
        const incident = await prisma.incident.create({
            data: {
                title: data.title,
                description: data.description,
                environment: data.environment,
                severity: data.severity,
                status: IncidentStatus.OPEN,
                systemId: data.systemId,
                jobId: data.jobId || null,
                createdById: userId,
                assignedTeamId: data.assignedTeamId || null,
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
                    })),
                } : undefined,
            },
            include: this.defaultInclude,
        });

        logger.info('Incident created', { incidentId: incident.id, userId, severity: data.severity });

        // Send email notification (non-blocking)
        this.sendNotification(incident, 'created').catch(err => {
            logger.error('Failed to send incident notification', { error: err.message, incidentId: incident.id });
        });

        return incident as unknown as IIncident;
    }

    /**
     * Update an existing incident
     * @param id - Incident ID
     * @param data - Update data
     * @param userId - ID of the user making the update
     */
    async update(id: string, data: UpdateIncidentDTO, userId: string): Promise<IIncident> {
        const existing = await this.findById(id);
        const wasResolved = existing.status === IncidentStatus.RESOLVED;
        const isNowResolved = data.status === IncidentStatus.RESOLVED;

        const updateData: Record<string, unknown> = { ...data };

        // Handle resolution tracking
        if (!wasResolved && isNowResolved) {
            updateData.resolvedById = userId;
            updateData.resolvedAt = new Date();
            updateData.timeToResolve = Math.round(
                (new Date().getTime() - new Date(existing.createdAt).getTime()) / 60000
            );
        }

        const incident = await prisma.incident.update({
            where: { id },
            data: updateData,
            include: this.defaultInclude,
        });

        logger.info('Incident updated', { incidentId: id, userId, changes: Object.keys(data) });

        // Send appropriate notification
        if (!wasResolved && isNowResolved) {
            this.sendNotification(incident, 'resolved').catch(err => {
                logger.error('Failed to send resolution notification', { error: err.message });
            });
        } else {
            this.sendNotification(incident, 'updated').catch(err => {
                logger.error('Failed to send update notification', { error: err.message });
            });
        }

        return incident as unknown as IIncident;
    }

    /**
     * Add a log entry to an incident
     * @param incidentId - Incident ID
     * @param data - Log data
     */
    async addLog(incidentId: string, data: {
        logType: string;
        rawLog?: string;
        errorCode?: string;
        errorMessage?: string;
        metadata?: string;
    }): Promise<IIncidentLog> {
        await this.findById(incidentId);

        const log = await prisma.incidentLog.create({
            data: {
                incidentId,
                ...data
            }
        });

        logger.info('Incident log added', { incidentId, logType: data.logType });

        return log as unknown as IIncidentLog;
    }

    /**
     * Add a file log to an incident
     * @param incidentId - Incident ID
     * @param fileData - File metadata
     */
    async addFileLog(incidentId: string, fileData: {
        filePath: string;
        fileName: string;
        fileSize: number;
        mimeType: string;
    }): Promise<IIncidentLog> {
        await this.findById(incidentId);

        const log = await prisma.incidentLog.create({
            data: {
                incidentId,
                logType: 'file',
                ...fileData
            }
        });

        logger.info('File attached to incident', { incidentId, fileName: fileData.fileName });

        return log as unknown as IIncidentLog;
    }

    /**
     * Delete an incident
     * @param id - Incident ID
     * @param userId - ID of the user deleting
     */
    async delete(id: string, userId: string): Promise<void> {
        await this.findById(id); // Throws if not found

        await prisma.incident.delete({ where: { id } });

        logger.info('Incident deleted', { incidentId: id, userId });
    }

    /**
     * Link a procedure to an incident
     * @param incidentId - Incident ID
     * @param procedureId - Procedure ID
     */
    async linkProcedure(incidentId: string, procedureId: string): Promise<IIncident> {
        await this.findById(incidentId);

        const procedure = await prisma.procedure.findUnique({ where: { id: procedureId } });
        if (!procedure) {
            throw new NotFoundError('Procedure');
        }

        const incident = await prisma.incident.update({
            where: { id: incidentId },
            data: { linkedProcedureId: procedureId },
            include: this.defaultInclude,
        });

        logger.info('Procedure linked to incident', { incidentId, procedureId });

        return incident as unknown as IIncident;
    }

    /**
     * Get incident statistics for dashboard
     * @param filters - Date and context filters
     */
    async getStats(filters: {
        startDate?: Date;
        endDate?: Date;
        systemId?: string;
        teamId?: string;
        userId?: string;
    }): Promise<any> {
        const { startDate, endDate, systemId, teamId, userId } = filters;
        const today = new Date();
        const start = startDate || new Date(today.setHours(0, 0, 0, 0));
        const end = endDate || new Date(today.setHours(23, 59, 59, 999));

        const where: any = {
            createdAt: { gte: start, lte: end }
        };

        if (systemId) where.systemId = systemId;
        if (teamId) where.assignedTeamId = teamId;

        // Active incidents (Open/In Progress) - ignore date filter for "current status"
        const activeWhere = { ...where };
        delete activeWhere.createdAt;
        activeWhere.status = { in: [IncidentStatus.OPEN, IncidentStatus.IN_PROGRESS] };

        const [created, resolved, active] = await Promise.all([
            prisma.incident.count({ where }),
            prisma.incident.count({
                where: {
                    ...where,
                    createdAt: undefined,
                    resolvedAt: { gte: start, lte: end }
                }
            }),
            prisma.incident.count({ where: activeWhere })
        ]);

        // Calculate average resolution time
        const resolvedIncidents = await prisma.incident.findMany({
            where: {
                ...where,
                createdAt: undefined,
                resolvedAt: { gte: start, lte: end },
                status: { in: [IncidentStatus.RESOLVED, IncidentStatus.CLOSED] }
            },
            select: { createdAt: true, resolvedAt: true },
            take: 1000
        });

        const totalTime = resolvedIncidents.reduce((acc, inc) => {
            if (inc.resolvedAt) {
                return acc + (inc.resolvedAt.getTime() - inc.createdAt.getTime());
            }
            return acc;
        }, 0);

        const avgResolutionTime = resolvedIncidents.length > 0
            ? Math.round((totalTime / resolvedIncidents.length) / 60000)
            : 0;

        // Top systems
        const topSystems = await prisma.incident.groupBy({
            by: ['systemId'],
            where,
            _count: { systemId: true },
            orderBy: { _count: { systemId: 'desc' } },
            take: 5
        });

        const systemIds = topSystems.map(s => s.systemId);
        const systems = await prisma.system.findMany({
            where: { id: { in: systemIds } }
        });

        const topSystemStats = topSystems.map(stat => ({
            systemId: stat.systemId,
            count: stat._count.systemId,
            name: systems.find(s => s.id === stat.systemId)?.name || 'Unknown'
        }));

        // Status breakdown
        const statusCounts = await prisma.incident.groupBy({
            by: ['status'],
            where,
            _count: { status: true }
        });

        const statusBreakdown = statusCounts.map(s => ({
            status: s.status,
            count: s._count.status
        }));

        // Trends (last 7 days by default if no date range)
        const trends = await this.getTrends(start, end, systemId, teamId);

        // User specific stats
        let myWork = { myTeamQueue: 0, myTeamBreaches: 0 };
        if (userId) {
            myWork = await this.getUserStats(userId);
        }

        return {
            createdToday: created,
            resolvedToday: resolved,
            activeIncidents: active,
            avgResolutionTimeMinutes: avgResolutionTime,
            topSystems: topSystemStats,
            statusBreakdown,
            trends,
            myWork
        };
    }

    private async getTrends(start: Date, end: Date, systemId?: string, teamId?: string) {
        const incidents = await prisma.incident.findMany({
            where: {
                OR: [
                    { createdAt: { gte: start, lte: end } },
                    { resolvedAt: { gte: start, lte: end } }
                ],
                ...(systemId && { systemId }),
                ...(teamId && { assignedTeamId: teamId })
            },
            select: { createdAt: true, resolvedAt: true }
        });

        const trendsMap = new Map<string, { date: string, created: number, resolved: number }>();

        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
            const key = d.toISOString().split('T')[0];
            trendsMap.set(key, { date: key, created: 0, resolved: 0 });
        }

        incidents.forEach(inc => {
            const createdKey = inc.createdAt.toISOString().split('T')[0];
            if (trendsMap.has(createdKey)) trendsMap.get(createdKey)!.created++;

            if (inc.resolvedAt) {
                const resolvedKey = inc.resolvedAt.toISOString().split('T')[0];
                if (trendsMap.has(resolvedKey)) trendsMap.get(resolvedKey)!.resolved++;
            }
        });

        return Array.from(trendsMap.values()).sort((a, b) => a.date.localeCompare(b.date));
    }

    private async getUserStats(userId: string) {
        const userTeams = await prisma.teamMember.findMany({
            where: { userId },
            select: { teamId: true }
        });

        if (userTeams.length === 0) return { myTeamQueue: 0, myTeamBreaches: 0 };

        const teamIds = userTeams.map(t => t.teamId);

        const [queue, breaches] = await Promise.all([
            prisma.incident.count({
                where: {
                    assignedTeamId: { in: teamIds },
                    status: { notIn: [IncidentStatus.RESOLVED, IncidentStatus.CLOSED] }
                }
            }),
            prisma.incident.findMany({
                where: {
                    assignedTeamId: { in: teamIds },
                    status: { notIn: [IncidentStatus.RESOLVED, IncidentStatus.CLOSED] },
                    slaId: { not: null }
                },
                include: { sla: true }
            })
        ]);

        const now = new Date();
        const breachCount = breaches.filter(inc => {
            if (!inc.sla) return false;
            const breachTime = new Date(inc.createdAt.getTime() + inc.sla.resolveTimeMinutes * 60000);
            return now > breachTime;
        }).length;

        return { myTeamQueue: queue, myTeamBreaches: breachCount };
    }

    /**
     * Send email notification for incident events
     */
    private async sendNotification(incident: unknown, type: 'created' | 'updated' | 'resolved'): Promise<void> {
        switch (type) {
            case 'created':
                await emailService.sendIncidentCreated({ incident });
                break;
            case 'updated':
                await emailService.sendIncidentUpdated({ incident });
                break;
            case 'resolved':
                await emailService.sendIncidentResolved({ incident });
                break;
        }
    }
}

// Export singleton instance
export const incidentService = new IncidentService();
