import { prisma } from '../../../common/utils/prisma';
import { logger } from '../../../common/utils/logger';
import { NotFoundError, ValidationError, ConflictError } from '../../../common/errors/app.error';
import { IncidentStatus } from '../../../constants';
import type { CreateIncidentDTO, UpdateIncidentDTO, IIncident, PaginatedResult, PaginationParams } from '../../../types';
import { autoAssignService } from '../../auto-assign/auto-assign.service';
import { webhookService } from '../../webhooks/webhook.service';
import { defaultInclude, validateStatusTransition, sendNotification } from './incident-shared';
import { eventPublisher } from '../../events/event.publisher';

export interface FindAllFilters {
    status?: string;
    severity?: string;
    environment?: string;
    systemId?: string;
    teamId?: string | string[];
    startDate?: Date;
    endDate?: Date;
    search?: string;
}

export class IncidentCrudService {
    async findAll(filters: FindAllFilters = {}, pagination: PaginationParams = {}): Promise<PaginatedResult<IIncident>> {
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
                { title: { contains: filters.search, mode: 'insensitive' } },
                { description: { contains: filters.search, mode: 'insensitive' } },
            ];
        }

        const [data, total] = await Promise.all([
            prisma.incident.findMany({
                where,
                include: defaultInclude,
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

    async findById(id: string): Promise<IIncident> {
        const incident = await prisma.incident.findUnique({
            where: { id },
            include: defaultInclude,
        });
        if (!incident) throw new NotFoundError('Incident not found');
        return incident as unknown as IIncident;
    }

    async searchSimilar(query: string): Promise<IIncident[]> {
        const result = await this.findAll({ search: query });
        return result.data;
    }

    async create(data: CreateIncidentDTO, userId: string): Promise<IIncident> {
        const system = await prisma.system.findUnique({ where: { id: data.systemId } });
        if (!system) throw new ValidationError('Invalid system ID');

        if (data.jobId) {
            const job = await prisma.job.findUnique({ where: { id: data.jobId } });
            if (!job) throw new ValidationError('Invalid job ID');
        }

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
                include: defaultInclude,
            });
            return newIncident;
        });

        logger.info('Incident created', { incidentId: incident.id, userId, severity: data.severity });
        sendNotification(incident, 'created').catch((err) => { logger.error('Failed to send creation notification', { error: err }); });
        webhookService.dispatch('incident.created', { incident }).catch((err) => { logger.error('Failed to dispatch webhook for creation', { error: err }); });
        eventPublisher.emit({
            type: 'incident.created',
            incidentId: incident.id,
            data: { id: incident.id, title: (incident as any).title, status: (incident as any).status, severity: (incident as any).severity, systemName: (incident as any).system?.name },
            timestamp: new Date().toISOString(),
        }).catch(() => { });

        return incident as unknown as IIncident;
    }

    async update(id: string, data: UpdateIncidentDTO, userId: string): Promise<IIncident> {
        const existing = await this.findById(id);

        if (data.status && data.status !== existing.status) {
            validateStatusTransition(existing.status, data.status);
        }

        const wasResolved = existing.status === IncidentStatus.RESOLVED;
        const isNowResolved = data.status === IncidentStatus.RESOLVED;

        const updateData: Record<string, unknown> = { ...data };

        if (data.status === IncidentStatus.ACKNOWLEDGED && !existing.acknowledgedAt) {
            updateData.acknowledgedAt = new Date();
            updateData.timeToAcknowledge = Math.round(
                (new Date().getTime() - new Date(existing.createdAt).getTime()) / 60000
            );
        }

        const wasEffectiveResolved = ([IncidentStatus.RESOLVED, IncidentStatus.CLOSED] as string[]).includes(existing.status);
        const isNowEffectiveResolved = data.status && ([IncidentStatus.RESOLVED, IncidentStatus.CLOSED] as string[]).includes(data.status);

        if (!wasEffectiveResolved && isNowEffectiveResolved) {
            updateData.resolvedById = userId;
            updateData.resolvedAt = new Date();
            updateData.timeToResolve = Math.round(
                (new Date().getTime() - new Date(existing.createdAt).getTime()) / 60000
            );
        }

        updateData.updatedById = userId;

        const expectedVersion = (data as UpdateIncidentDTO & { version?: number }).version;
        if (expectedVersion !== undefined && expectedVersion !== existing.version) {
            throw new ConflictError(
                `Incident has been modified by another user. Expected version ${expectedVersion}, but current version is ${existing.version}. Please refresh and try again.`
            );
        }
        updateData.version = (existing.version ?? 0) + 1;

        const incident = await prisma.$transaction(async (tx) => {
            return tx.incident.update({
                where: { id, version: existing.version },
                data: updateData,
                include: defaultInclude,
            });
        });

        logger.info('Incident updated', { incidentId: id, userId, changes: Object.keys(data) });

        if (!wasResolved && isNowResolved) {
            sendNotification(incident, 'resolved').catch((err) => { logger.error('Failed to send resolution notification', { error: err }); });
        } else {
            sendNotification(incident, 'updated').catch((err) => { logger.error('Failed to send update notification', { error: err }); });
        }

        const webhookEvent = isNowResolved ? 'incident.resolved' : 'incident.updated';
        webhookService.dispatch(webhookEvent, { incident }).catch((err) => { logger.error('Failed to dispatch webhook for update', { error: err }); });
        eventPublisher.emit({
            type: isNowResolved ? 'incident.resolved' : 'incident.updated',
            incidentId: id,
            data: { id, title: (incident as any).title, status: (incident as any).status, severity: (incident as any).severity, systemName: (incident as any).system?.name },
            timestamp: new Date().toISOString(),
        }).catch(() => { });

        return incident as unknown as IIncident;
    }

    async delete(id: string, userId: string): Promise<void> {
        await this.findById(id);
        await prisma.incident.delete({ where: { id } });
        logger.info('Incident deleted', { incidentId: id, userId });
        eventPublisher.emit({
            type: 'incident.deleted',
            incidentId: id,
            data: { id },
            timestamp: new Date().toISOString(),
        }).catch(() => { });
    }

    async linkProcedure(incidentId: string, procedureId: string): Promise<IIncident> {
        await this.findById(incidentId);
        const procedure = await prisma.procedure.findUnique({ where: { id: procedureId } });
        if (!procedure) throw new NotFoundError('Procedure not found');

        const incident = await prisma.incident.update({
            where: { id: incidentId },
            data: { linkedProcedureId: procedureId },
            include: defaultInclude,
        });

        return incident as unknown as IIncident;
    }
}

export const incidentCrudService = new IncidentCrudService();
