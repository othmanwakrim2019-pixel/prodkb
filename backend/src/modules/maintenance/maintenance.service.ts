import { prisma } from '../../common/utils/prisma';
import { AuthRequest } from '../../common/middleware/auth.middleware';
import { NotFoundError, ValidationError } from '../../common/errors/app.error';

export interface CreateMaintenanceDTO {
    systemId: string;
    title: string;
    description?: string;
    scheduledAt: Date | string;
    endsAt: Date | string;
}

export interface UpdateMaintenanceDTO {
    title?: string;
    description?: string;
    scheduledAt?: Date | string;
    endsAt?: Date | string;
    status?: string;
}

class MaintenanceService {
    async findAll(systemId?: string) {
        return prisma.maintenanceWindow.findMany({
            where: systemId ? { systemId } : undefined,
            include: {
                system: { select: { id: true, name: true } },
                createdBy: { select: { id: true, name: true } },
            },
            orderBy: { scheduledAt: 'asc' },
        });
    }

    async findActive() {
        const now = new Date();
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

    async findById(id: string) {
        const mw = await prisma.maintenanceWindow.findUnique({
            where: { id },
            include: {
                system: { select: { id: true, name: true } },
                createdBy: { select: { id: true, name: true } },
            },
        });
        if (!mw) throw new NotFoundError('Maintenance window not found');
        return mw;
    }

    async create(data: CreateMaintenanceDTO, userId: string) {
        const scheduledAt = new Date(data.scheduledAt);
        const endsAt = new Date(data.endsAt);

        if (endsAt <= scheduledAt) {
            throw new ValidationError('End time must be after start time');
        }

        const system = await prisma.system.findUnique({ where: { id: data.systemId } });
        if (!system) throw new ValidationError('System not found');

        return prisma.maintenanceWindow.create({
            data: {
                systemId: data.systemId,
                title: data.title,
                description: data.description,
                scheduledAt,
                endsAt,
                createdById: userId,
            },
            include: {
                system: { select: { id: true, name: true } },
                createdBy: { select: { id: true, name: true } },
            },
        });
    }

    async update(id: string, data: UpdateMaintenanceDTO) {
        await this.findById(id);
        const updateData: Record<string, unknown> = {};
        if (data.title) updateData.title = data.title;
        if (data.description !== undefined) updateData.description = data.description;
        if (data.scheduledAt) updateData.scheduledAt = new Date(data.scheduledAt);
        if (data.endsAt) updateData.endsAt = new Date(data.endsAt);
        if (data.status) updateData.status = data.status;

        return prisma.maintenanceWindow.update({
            where: { id },
            data: updateData,
            include: {
                system: { select: { id: true, name: true } },
                createdBy: { select: { id: true, name: true } },
            },
        });
    }

    async delete(id: string) {
        await this.findById(id);
        await prisma.maintenanceWindow.delete({ where: { id } });
    }

    /**
     * Check if a given system is currently within a maintenance window.
     */
    async isInMaintenance(systemId: string): Promise<boolean> {
        const now = new Date();
        const count = await prisma.maintenanceWindow.count({
            where: {
                systemId,
                scheduledAt: { lte: now },
                endsAt: { gt: now },
                status: { in: ['scheduled', 'active'] },
            },
        });
        return count > 0;
    }

    /**
     * Update statuses automatically (call from cron or on demand).
     */
    async syncStatuses() {
        const now = new Date();
        await prisma.maintenanceWindow.updateMany({
            where: { scheduledAt: { lte: now }, endsAt: { gt: now }, status: 'scheduled' },
            data: { status: 'active' },
        });
        await prisma.maintenanceWindow.updateMany({
            where: { endsAt: { lte: now }, status: { in: ['scheduled', 'active'] } },
            data: { status: 'completed' },
        });
    }
}

export const maintenanceService = new MaintenanceService();
