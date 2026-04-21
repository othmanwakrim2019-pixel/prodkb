import { prisma } from '../../../common/utils/prisma';
import { IMaintenanceRepository } from '../domain/maintenance.repository';

export class PrismaMaintenanceRepository implements IMaintenanceRepository {
    async findMaintenanceWindows(systemId?: string) {
        return prisma.maintenanceWindow.findMany({
            where: systemId ? { systemId } : undefined,
            include: {
                system: { select: { id: true, name: true } },
                createdBy: { select: { id: true, name: true } },
            },
            orderBy: { scheduledAt: 'asc' },
        });
    }

    async findActiveMaintenanceWindows(now: Date) {
        return prisma.maintenanceWindow.findMany({
            where: {
                scheduledAt: { lte: now },
                endsAt: { gt: now },
                status: { in: ['scheduled', 'active'] },
            },
            include: {
                system: { select: { id: true, name: true } },
            },
        });
    }

    async findMaintenanceWindowById(id: string) {
        return prisma.maintenanceWindow.findUnique({
            where: { id },
            include: {
                system: { select: { id: true, name: true } },
                createdBy: { select: { id: true, name: true } },
            },
        });
    }

    async findSystemById(id: string) {
        return prisma.system.findUnique({ where: { id } });
    }

    async createMaintenanceWindow(data: {
        systemId: string;
        title: string;
        description?: string;
        scheduledAt: Date;
        endsAt: Date;
        createdById: string;
    }) {
        return prisma.maintenanceWindow.create({
            data,
            include: {
                system: { select: { id: true, name: true } },
                createdBy: { select: { id: true, name: true } },
            },
        });
    }

    async updateMaintenanceWindow(id: string, data: Record<string, unknown>) {
        return prisma.maintenanceWindow.update({
            where: { id },
            data,
            include: {
                system: { select: { id: true, name: true } },
                createdBy: { select: { id: true, name: true } },
            },
        });
    }

    async deleteMaintenanceWindow(id: string) {
        return prisma.maintenanceWindow.delete({ where: { id } });
    }

    async countActiveMaintenanceForSystem(systemId: string, now: Date) {
        return prisma.maintenanceWindow.count({
            where: {
                systemId,
                scheduledAt: { lte: now },
                endsAt: { gt: now },
                status: { in: ['scheduled', 'active'] },
            },
        });
    }

    async activateScheduledMaintenance(now: Date) {
        return prisma.maintenanceWindow.updateMany({
            where: { scheduledAt: { lte: now }, endsAt: { gt: now }, status: 'scheduled' },
            data: { status: 'active' },
        });
    }

    async completeFinishedMaintenance(now: Date) {
        return prisma.maintenanceWindow.updateMany({
            where: { endsAt: { lte: now }, status: { in: ['scheduled', 'active'] } },
            data: { status: 'completed' },
        });
    }
}

export const maintenanceRepository = new PrismaMaintenanceRepository();
