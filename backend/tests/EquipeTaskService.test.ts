import { equipeTaskService } from '../src/modules/equipe/application/services/equipe-task.service';
import { equipeRepository } from '../src/modules/equipe/infrastructure/prisma-equipe.repository';
import { equipePlanService } from '../src/modules/equipe/application/services/equipe-plan.service';
import { notificationService } from '../src/modules/notifications/application/notification.service';
import { OperationalTaskStatus } from '../src/constants';
import { NotFoundError, ForbiddenError } from '../src/common/errors/app.error';

jest.mock('../src/modules/equipe/infrastructure/prisma-equipe.repository', () => ({
    equipeRepository: {
        findTasks: jest.fn(),
        findTaskById: jest.fn(),
        createTask: jest.fn(),
        updateTask: jest.fn(),
        deleteTask: jest.fn(),
    },
}));

jest.mock('../src/modules/equipe/application/services/equipe-plan.service', () => ({
    equipePlanService: {
        getPlanById: jest.fn(),
    },
}));

jest.mock('../src/modules/notifications/application/notification.service', () => ({
    notificationService: {
        createForTeam: jest.fn().mockResolvedValue({}),
    },
}));

jest.mock('../src/common/utils/logger', () => ({
    logger: {
        info: jest.fn(),
        error: jest.fn(),
    },
}));

describe('EquipeTaskService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('createTask', () => {
        it('creates a task and verifies plan existence', async () => {
            const taskData = {
                planId: 'plan-1',
                title: 'Test Task',
                assignedToId: 'user-1',
            };
            (equipePlanService.getPlanById as jest.Mock).mockResolvedValue({ id: 'plan-1' });
            (equipeRepository.createTask as jest.Mock).mockResolvedValue({ id: 'task-1', ...taskData });

            const result = await equipeTaskService.createTask(taskData, 'admin-1');

            expect(equipePlanService.getPlanById).toHaveBeenCalledWith('plan-1');
            expect(equipeRepository.createTask).toHaveBeenCalled();
            expect(result.id).toBe('task-1');
        });
    });

    describe('updateTaskStatus', () => {
        it('allows operator to update their own task', async () => {
            (equipeRepository.findTaskById as jest.Mock).mockResolvedValue({
                id: 'task-1',
                assignedToId: 'user-1',
                status: OperationalTaskStatus.TODO,
            });
            (equipeRepository.updateTask as jest.Mock).mockResolvedValue({
                id: 'task-1',
                status: OperationalTaskStatus.IN_PROGRESS,
            });

            const result = await equipeTaskService.updateTaskStatus('task-1', { status: OperationalTaskStatus.IN_PROGRESS }, 'user-1');

            expect(equipeRepository.updateTask).toHaveBeenCalled();
            expect(result.status).toBe(OperationalTaskStatus.IN_PROGRESS);
        });

        it('denies update if not assigned to user', async () => {
            (equipeRepository.findTaskById as jest.Mock).mockResolvedValue({
                id: 'task-1',
                assignedToId: 'user-2',
            });

            await expect(equipeTaskService.updateTaskStatus('task-1', { status: 'DONE' }, 'user-1'))
                .rejects.toThrow(ForbiddenError);
        });

        it('triggers notification when BLOCKED', async () => {
            (equipeRepository.findTaskById as jest.Mock).mockResolvedValue({
                id: 'task-1',
                assignedToId: 'user-1',
                status: OperationalTaskStatus.TODO,
            });
            (equipeRepository.updateTask as jest.Mock).mockResolvedValue({
                id: 'task-1',
                title: 'Blocked Task',
                status: OperationalTaskStatus.BLOCKED,
                plan: { teamId: 'team-1' },
            });

            await equipeTaskService.updateTaskStatus('task-1', { status: OperationalTaskStatus.BLOCKED, note: 'Need help' }, 'user-1');

            expect(notificationService.createForTeam).toHaveBeenCalledWith(
                'team-1',
                'TASK_BLOCKED',
                expect.stringContaining('Tâche bloquée'),
                expect.stringContaining('Need help')
            );
        });
    });
});
