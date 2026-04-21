import { astreinteService } from '../src/modules/astreinte/application/astreinte.service';
import { astreinteRepository } from '../src/modules/astreinte/infrastructure/prisma-astreinte.repository';
import { NotFoundError, ConflictError } from '../src/common/errors/app.error';

jest.mock('../src/modules/astreinte/infrastructure/prisma-astreinte.repository', () => ({
    astreinteRepository: {
        findMany: jest.fn(),
        findById: jest.fn(),
        findCurrent: jest.fn(),
        findByWeek: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
    },
}));

jest.mock('../src/common/utils/logger', () => ({
    logger: {
        info: jest.fn(),
        error: jest.fn(),
    },
}));

describe('AstreinteService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('list', () => {
        it('lists astreintes with filters', async () => {
            const mockAstreintes = [{ id: '1', weekNumber: 20 }];
            (astreinteRepository.findMany as jest.Mock).mockResolvedValue(mockAstreintes);

            const result = await astreinteService.list({ teamId: 'team-1', year: 2026 });

            expect(astreinteRepository.findMany).toHaveBeenCalledWith({ teamId: 'team-1', year: 2026 });
            expect(result).toEqual(mockAstreintes);
        });
    });

    describe('getById', () => {
        it('returns an astreinte by ID', async () => {
            const mockAstreinte = { id: '1', weekNumber: 20 };
            (astreinteRepository.findById as jest.Mock).mockResolvedValue(mockAstreinte);

            const result = await astreinteService.getById('1');

            expect(astreinteRepository.findById).toHaveBeenCalledWith('1');
            expect(result).toEqual(mockAstreinte);
        });

        it('throws NotFoundError if not found', async () => {
            (astreinteRepository.findById as jest.Mock).mockResolvedValue(null);

            await expect(astreinteService.getById('999')).rejects.toThrow(NotFoundError);
        });
    });

    describe('getCurrent', () => {
        it('returns the current astreinte for a team', async () => {
            const mockAstreinte = { id: '1', weekNumber: 20 };
            (astreinteRepository.findCurrent as jest.Mock).mockResolvedValue(mockAstreinte);

            const result = await astreinteService.getCurrent('team-1');

            expect(astreinteRepository.findCurrent).toHaveBeenCalledWith('team-1');
            expect(result).toEqual(mockAstreinte);
        });
    });

    describe('assign', () => {
        const assignData = {
            weekNumber: 20,
            year: 2026,
            startDate: new Date('2026-05-11'),
            endDate: new Date('2026-05-17'),
            teamId: 'team-1',
            userId: 'user-1',
        };

        it('assigns a new astreinte', async () => {
            (astreinteRepository.findByWeek as jest.Mock).mockResolvedValue(null);
            (astreinteRepository.create as jest.Mock).mockResolvedValue({ id: 'new-id', ...assignData });

            const result = await astreinteService.assign(assignData, 'admin-1');

            expect(astreinteRepository.findByWeek).toHaveBeenCalledWith('team-1', 20, 2026);
            expect(astreinteRepository.create).toHaveBeenCalledWith({ ...assignData, createdById: 'admin-1' });
            expect(result.id).toBe('new-id');
        });

        it('throws ConflictError if already assigned', async () => {
            (astreinteRepository.findByWeek as jest.Mock).mockResolvedValue({ id: 'existing' });

            await expect(astreinteService.assign(assignData, 'admin-1')).rejects.toThrow(ConflictError);
        });
    });

    describe('update', () => {
        it('updates an existing astreinte', async () => {
            (astreinteRepository.findById as jest.Mock).mockResolvedValue({ id: '1' });
            (astreinteRepository.update as jest.Mock).mockResolvedValue({ id: '1', phone: '123' });

            const result = await astreinteService.update('1', { phone: '123' });

            expect(astreinteRepository.update).toHaveBeenCalledWith('1', { phone: '123' });
            expect(result.phone).toBe('123');
        });
    });

    describe('delete', () => {
        it('deletes an existing astreinte', async () => {
            (astreinteRepository.findById as jest.Mock).mockResolvedValue({ id: '1' });
            (astreinteRepository.delete as jest.Mock).mockResolvedValue(undefined);

            await astreinteService.delete('1');

            expect(astreinteRepository.delete).toHaveBeenCalledWith('1');
        });
    });
});
