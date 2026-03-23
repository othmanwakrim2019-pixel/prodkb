import { NotFoundError, ValidationError } from '../../common/errors/app.error';
import { maintenanceRepository } from './repositories/maintenance.repository';

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
        await this.syncStatuses();
        return maintenanceRepository.findMaintenanceWindows(systemId);
    }

    async findActive() {
        return maintenanceRepository.findActiveMaintenanceWindows(new Date());
    }

    async findById(id: string) {
        const maintenanceWindow = await maintenanceRepository.findMaintenanceWindowById(id);
        if (!maintenanceWindow) throw new NotFoundError('Maintenance window not found');
        return maintenanceWindow;
    }

    async create(data: CreateMaintenanceDTO, userId: string) {
        const scheduledAt = typeof data.scheduledAt === 'string' ? new Date(data.scheduledAt) : data.scheduledAt;
        const endsAt = typeof data.endsAt === 'string' ? new Date(data.endsAt) : data.endsAt;

        if (isNaN(scheduledAt.getTime()) || isNaN(endsAt.getTime())) {
            throw new ValidationError('Invalid date format');
        }
        if (endsAt <= scheduledAt) {
            throw new ValidationError('End time must be after start time');
        }

        const system = await maintenanceRepository.findSystemById(data.systemId);
        if (!system) throw new ValidationError('System not found');

        return maintenanceRepository.createMaintenanceWindow({
            systemId: data.systemId,
            title: data.title,
            description: data.description,
            scheduledAt,
            endsAt,
            createdById: userId,
        });
    }

    async update(id: string, data: UpdateMaintenanceDTO) {
        await this.findById(id);

        const updateData: Record<string, unknown> = {};
        if (data.title) updateData.title = data.title;
        if (data.description !== undefined) updateData.description = data.description;
        if (data.scheduledAt) {
            const scheduledAt = typeof data.scheduledAt === 'string' ? new Date(data.scheduledAt) : data.scheduledAt;
            if (isNaN(scheduledAt.getTime())) {
                throw new ValidationError('Invalid scheduledAt date format');
            }
            updateData.scheduledAt = scheduledAt;
        }
        if (data.endsAt) {
            const endsAt = typeof data.endsAt === 'string' ? new Date(data.endsAt) : data.endsAt;
            if (isNaN(endsAt.getTime())) {
                throw new ValidationError('Invalid endsAt date format');
            }
            updateData.endsAt = endsAt;
        }
        if (data.status) updateData.status = data.status;

        return maintenanceRepository.updateMaintenanceWindow(id, updateData);
    }

    async delete(id: string) {
        await this.findById(id);
        await maintenanceRepository.deleteMaintenanceWindow(id);
    }

    async isInMaintenance(systemId: string): Promise<boolean> {
        const count = await maintenanceRepository.countActiveMaintenanceForSystem(systemId, new Date());
        return count > 0;
    }

    async syncStatuses() {
        const now = new Date();
        await maintenanceRepository.activateScheduledMaintenance(now);
        await maintenanceRepository.completeFinishedMaintenance(now);
    }
}

export const maintenanceService = new MaintenanceService();
