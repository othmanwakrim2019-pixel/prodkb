import { equipePlanService } from '../src/modules/equipe/application/services/equipe-plan.service';
import { equipeRepository } from '../src/modules/equipe/infrastructure/prisma-equipe.repository';
import { NotFoundError, ConflictError } from '../src/common/errors/app.error';

jest.mock('../src/modules/equipe/infrastructure/prisma-equipe.repository', () => ({
    equipeRepository: {
        findPlans: jest.fn(),
        findPlanById: jest.fn(),
        findPlanByDate: jest.fn(),
        createPlan: jest.fn(),
        updatePlan: jest.fn(),
        deletePlan: jest.fn(),
    },
}));

jest.mock('../src/common/utils/logger', () => ({
    logger: {
        info: jest.fn(),
        error: jest.fn(),
    },
}));

describe('EquipePlanService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('listPlans', () => {
        it('lists plans with filters', async () => {
            const mockPlans = [{ id: '1', date: new Date() }];
            (equipeRepository.findPlans as jest.Mock).mockResolvedValue(mockPlans);

            const result = await equipePlanService.listPlans({ teamId: 'team-1' });

            expect(equipeRepository.findPlans).toHaveBeenCalledWith({ teamId: 'team-1' });
            expect(result).toEqual(mockPlans);
        });
    });

    describe('getPlanById', () => {
        it('returns a plan by ID', async () => {
            const mockPlan = { id: '1', date: new Date() };
            (equipeRepository.findPlanById as jest.Mock).mockResolvedValue(mockPlan);

            const result = await equipePlanService.getPlanById('1');

            expect(equipeRepository.findPlanById).toHaveBeenCalledWith('1');
            expect(result).toEqual(mockPlan);
        });

        it('throws NotFoundError if not found', async () => {
            (equipeRepository.findPlanById as jest.Mock).mockResolvedValue(null);

            await expect(equipePlanService.getPlanById('999')).rejects.toThrow(NotFoundError);
        });
    });

    describe('createPlan', () => {
        const planData = {
            date: new Date('2026-04-21'),
            teamId: 'team-1',
            label: 'Test Plan',
        };

        it('creates a new plan', async () => {
            (equipeRepository.findPlanByDate as jest.Mock).mockResolvedValue(null);
            (equipeRepository.createPlan as jest.Mock).mockResolvedValue({ id: 'new-id', ...planData });

            const result = await equipePlanService.createPlan(planData, 'admin-1');

            expect(equipeRepository.findPlanByDate).toHaveBeenCalled();
            expect(equipeRepository.createPlan).toHaveBeenCalled();
            expect(result.id).toBe('new-id');
        });

        it('throws ConflictError if plan already exists for that day', async () => {
            (equipeRepository.findPlanByDate as jest.Mock).mockResolvedValue({ id: 'existing' });

            await expect(equipePlanService.createPlan(planData, 'admin-1')).rejects.toThrow(ConflictError);
        });
    });
});
