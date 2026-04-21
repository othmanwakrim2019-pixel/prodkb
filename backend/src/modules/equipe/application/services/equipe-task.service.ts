import { OperationalTaskStatus } from '../../../../constants';
import type { OperationalTaskType, OperationalTaskPriority } from '@prisma/client';
import { IOperationalTask } from '../../../../types';
import { equipeRepository } from '../../infrastructure/prisma-equipe.repository';
import { NotFoundError, ForbiddenError } from '../../../../common/errors/app.error';
import { logger } from '../../../../common/utils/logger';
import { equipePlanService } from './equipe-plan.service';
import { notificationService } from '../../../notifications/notification.service';

export class EquipeTaskService {
    async getTaskById(id: string): Promise<IOperationalTask> {
        const result = await equipeRepository.findTaskById(id);
        if (!result) throw new NotFoundError('Task not found');
        return result as unknown as IOperationalTask;
    }

    async getMyTasksToday(userId: string): Promise<IOperationalTask[]> {
        const now = new Date();
        const startOfDay = new Date(now);
        startOfDay.setUTCHours(0, 0, 0, 0);
        const endOfDay = new Date(now);
        endOfDay.setUTCHours(23, 59, 59, 999);

        const where = {
            assignedToId: userId,
            plan: { date: { gte: startOfDay, lte: endOfDay } },
        };
        const results = await equipeRepository.findTasks(where);
        return results as unknown as IOperationalTask[];
    }

    async getMyTasksThisWeek(userId: string): Promise<IOperationalTask[]> {
        const now = new Date();
        const day = now.getDay() || 7;
        const monday = new Date(now);
        monday.setDate(now.getDate() - (day - 1));
        monday.setUTCHours(0, 0, 0, 0);
        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);
        sunday.setUTCHours(23, 59, 59, 999);

        const where = {
            assignedToId: userId,
            plan: { date: { gte: monday, lte: sunday } },
        };
        const results = await equipeRepository.findTasks(where);
        return results as unknown as IOperationalTask[];
    }

    async createTask(data: {
        planId:        string;
        title:         string;
        description?:  string | null;
        taskType?:     OperationalTaskType;
        priority?:     OperationalTaskPriority;
        assignedToId:  string;
        systemId?:     string | null;
        chainLabel?:   string | null;
        startTime?:    Date | null;
        endTime?:      Date | null;
    }, createdById: string): Promise<IOperationalTask> {
        // Verify plan exists
        await equipePlanService.getPlanById(data.planId);

        const result = await equipeRepository.createTask({ ...data, createdById });
        logger.info('Operational task created', { planId: data.planId, taskId: result.id, assignedTo: data.assignedToId });
        return result as unknown as IOperationalTask;
    }

    async updateTask(id: string, data: {
        title?:        string;
        description?:  string | null;
        taskType?:     OperationalTaskType;
        priority?:     OperationalTaskPriority;
        assignedToId?: string;
        systemId?:     string | null;
        chainLabel?:   string | null;
        startTime?:    Date | null;
        endTime?:      Date | null;
        status?:       string;
        note?:         string | null;
    }): Promise<IOperationalTask> {
        const existing = await equipeRepository.findTaskById(id);
        if (!existing) throw new NotFoundError('Task not found');

        const updateData: Record<string, unknown> = { ...data };

        if (data.status && data.status !== existing.status) {
            if (data.status === OperationalTaskStatus.IN_PROGRESS && !existing.startedAt) {
                updateData.startedAt = new Date();
            } else if (data.status === OperationalTaskStatus.DONE && !existing.completedAt) {
                updateData.completedAt = new Date();
            }
        }

        const result = await equipeRepository.updateTask(id, updateData);
        logger.info('Operational task updated', { id, status: data.status });
        return result as unknown as IOperationalTask;
    }

    /**
     * Operator-facing status update — enforces ownership and triggers BLOCKED notifications.
     */
    async updateTaskStatus(id: string, data: { status: string; note?: string | null }, userId: string): Promise<IOperationalTask> {
        const existing = await equipeRepository.findTaskById(id);
        if (!existing) throw new NotFoundError('Task not found');

        if (existing.assignedToId !== userId) {
            throw new ForbiddenError('You can only update the status of your own tasks');
        }

        const updateData: Record<string, unknown> = { status: data.status, note: data.note ?? null };

        if (data.status === OperationalTaskStatus.IN_PROGRESS && !existing.startedAt) {
            updateData.startedAt = new Date();
        } else if (data.status === OperationalTaskStatus.DONE && !existing.completedAt) {
            updateData.completedAt = new Date();
        }

        const result = await equipeRepository.updateTask(id, updateData);
        logger.info('Operational task status updated', { id, status: data.status, userId });

        // Notify team leads when a task is BLOCKED
        if (data.status === OperationalTaskStatus.BLOCKED) {
            const task = result as unknown as IOperationalTask & { plan?: { teamId?: string; team?: { id: string } } };
            const teamId = task.plan?.teamId ?? task.plan?.team?.id;
            if (teamId) {
                notificationService.createForTeam(
                    teamId,
                    'TASK_BLOCKED',
                    `Tâche bloquée : ${(result as unknown as IOperationalTask).title}`,
                    `L'opérateur a signalé un blocage sur la tâche "${(result as unknown as IOperationalTask).title}".${data.note ? ` Raison : ${data.note}` : ''}`
                ).catch((err: unknown) => logger.error('Failed to send BLOCKED task notification', { error: err }));
            }
        }

        return result as unknown as IOperationalTask;
    }

    async deleteTask(id: string): Promise<IOperationalTask> {
        const existing = await equipeRepository.findTaskById(id);
        if (!existing) throw new NotFoundError('Task not found');
        await equipeRepository.deleteTask(id);
        logger.info('Operational task deleted', { id });
        return existing as unknown as IOperationalTask;
    }
}

export const equipeTaskService = new EquipeTaskService();
