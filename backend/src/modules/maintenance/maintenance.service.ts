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
        // Sync statuses first so scheduled→active→completed transitions happen automatically
        await this.syncStatuses();

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
        // Parse dates from ISO string (datetime-local format: 2026-03-10T14:30)
        const scheduledAt = typeof data.scheduledAt === 'string'
            ? new Date(data.scheduledAt)
            : data.scheduledAt;
        const endsAt = typeof data.endsAt === 'string'
            ? new Date(data.endsAt)
            : data.endsAt;

        if (isNaN(scheduledAt.getTime()) || isNaN(endsAt.getTime())) {
            throw new ValidationError('Invalid date format');
        }

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
        if (data.scheduledAt) {
            const scheduledAt = typeof data.scheduledAt === 'string'
                ? new Date(data.scheduledAt)
                : data.scheduledAt;
            if (isNaN(scheduledAt.getTime())) {
                throw new ValidationError('Invalid scheduledAt date format');
            }
            updateData.scheduledAt = scheduledAt;
        }
        if (data.endsAt) {
            const endsAt = typeof data.endsAt === 'string'
                ? new Date(data.endsAt)
                : data.endsAt;
            if (isNaN(endsAt.getTime())) {
                throw new ValidationError('Invalid endsAt date format');
            }
            updateData.endsAt = endsAt;
        }
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
