import { Prisma } from '@prisma/client';
import { prisma } from '../../../common/utils/prisma';
import type { PaginationParams } from '../../../types';
import { IIncidentRepository, IncidentTrendRow } from '../domain/incident.repository';

export const incidentDefaultInclude = Prisma.validator<Prisma.IncidentInclude>()({
    system: true,
    job: true,
    createdBy: { select: { id: true, name: true, email: true } },
    resolvedBy: { select: { id: true, name: true, email: true } },
    assignedTeam: true,
    sla: true,
    linkedProcedure: { select: { id: true, title: true } },
    logs: {
        include: {
            createdBy: { select: { id: true, name: true, email: true } },
        },
    },
    updatedBy: { select: { id: true, name: true } },
});

export class PrismaIncidentRepository implements IIncidentRepository {
    async findIncidents(where: Record<string, unknown>, pagination: PaginationParams) {
        const { page = 1, limit = 50, sortBy = 'createdAt', sortOrder = 'desc' } = pagination;
        const skip = (page - 1) * limit;

        const [data, total] = await Promise.all([
            prisma.incident.findMany({
                where,
                include: incidentDefaultInclude,
                skip,
                take: limit,
                orderBy: { [sortBy]: sortOrder },
            }),
            prisma.incident.count({ where }),
        ]);

        return {
            data,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }

    async findIncidentById(id: string) {
        return prisma.incident.findUnique({
            where: { id },
            include: incidentDefaultInclude,
        });
    }

    async findSystemById(id: string) {
        return prisma.system.findUnique({ where: { id } });
    }

    async findJobById(id: string) {
        return prisma.job.findUnique({ where: { id } });
    }

    async createIncident(data: Prisma.IncidentCreateArgs['data']) {
        return prisma.incident.create({
            data,
            include: incidentDefaultInclude,
        });
    }

    async updateIncident(id: string, data: Prisma.IncidentUpdateArgs['data']) {
        return prisma.incident.update({
            where: { id },
            data,
            include: incidentDefaultInclude,
        });
    }

    async updateIncidentWithVersion(id: string, version: number, data: Prisma.IncidentUpdateArgs['data']) {
        return prisma.incident.update({
            where: { id, version },
            data,
            include: incidentDefaultInclude,
        });
    }

    async deleteIncident(id: string) {
        return prisma.incident.delete({ where: { id } });
    }

    async findProcedureById(id: string) {
        return prisma.procedure.findUnique({ where: { id } });
    }

    async createIncidentLog(data: Prisma.IncidentLogCreateArgs['data']) {
        return prisma.incidentLog.create({ data });
    }

    async findFileLog(incidentId: string, fileName: string) {
        return prisma.incidentLog.findFirst({
            where: { incidentId, fileName, logType: 'file' },
        });
    }

    async deleteIncidentLog(id: string) {
        return prisma.incidentLog.delete({ where: { id } });
    }

    async findActivityLogs(incidentId: string) {
        return prisma.incidentLog.findMany({
            where: {
                incidentId,
                logType: { in: ['activity', 'note', 'investigation', 'resolution', 'analysis', 'communication', 'other', 'file'] },
            },
            include: {
                createdBy: { select: { id: true, name: true, email: true } },
            },
            orderBy: { createdAt: 'asc' },
        });
    }

    async countIncidents(where: Record<string, unknown>) {
        return prisma.incident.count({ where });
    }

    async aggregateIncidentResolution(where: Record<string, unknown>) {
        return prisma.incident.aggregate({
            where,
            _avg: { timeToResolve: true },
        });
    }

    async groupIncidentsByStatus(where: Record<string, unknown>) {
        return prisma.incident.groupBy({
            by: ['status'],
            where,
            _count: { status: true },
        });
    }

    async queryCreatedTrend(start: Date, end: Date) {
        return prisma.$queryRaw<IncidentTrendRow[]>`
            SELECT DATE_TRUNC('day', "createdAt") AS day, COUNT(*)::bigint AS count
            FROM "Incident"
            WHERE "createdAt" >= ${start} AND "createdAt" <= ${end}
            GROUP BY day ORDER BY day
        `;
    }

    async queryResolvedTrend(start: Date, end: Date) {
        return prisma.$queryRaw<IncidentTrendRow[]>`
            SELECT DATE_TRUNC('day', "resolvedAt") AS day, COUNT(*)::bigint AS count
            FROM "Incident"
            WHERE "resolvedAt" IS NOT NULL AND "resolvedAt" >= ${start} AND "resolvedAt" <= ${end}
            GROUP BY day ORDER BY day
        `;
    }

    async groupIncidentsBySystem(where: Record<string, unknown>) {
        return prisma.incident.groupBy({
            by: ['systemId'],
            where,
            _count: { id: true },
            orderBy: { _count: { id: 'desc' } },
            take: 5,
        });
    }

    async findSystemsByIds(systemIds: string[]) {
        return prisma.system.findMany({
            where: { id: { in: systemIds } },
            select: { id: true, name: true },
        });
    }

    async findIncidentSuggestions(where: Record<string, unknown>) {
        return prisma.incident.findMany({
            where,
            select: {
                linkedProcedureId: true,
                timeToResolve: true,
                linkedProcedure: {
                    select: { id: true, title: true },
                },
                system: {
                    select: { name: true },
                },
            },
        });
    }
}

export const incidentRepository = new PrismaIncidentRepository();
