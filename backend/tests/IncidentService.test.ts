import { incidentService } from '../src/modules/incidents/incident.service';
import { prisma } from '../src/common/utils/prisma';
import { IncidentStatus, Severity, Environment } from '../src/types';

// Mock prisma
jest.mock('../src/common/utils/prisma', () => ({
    prisma: {
        incident: {
            findUnique: jest.fn(),
            findMany: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            count: jest.fn(),
            groupBy: jest.fn(),
            aggregate: jest.fn(),
        },
        auditLog: {
            create: jest.fn(),
        },
        incidentLog: {
            create: jest.fn(),
        },
        teamMember: {
            findMany: jest.fn(),
        },
        system: {
            findMany: jest.fn(),
            findUnique: jest.fn(),
        },
        autoAssignmentRule: {
            findFirst: jest.fn(),
        },
        sLA: {
            findFirst: jest.fn(),
        },
        emailTemplate: {
            findUnique: jest.fn(),
        },
        $transaction: jest.fn(),
        $queryRaw: jest.fn(),
    }
}));

(prisma as any).$transaction.mockImplementation((cb: Function) => cb(prisma));

describe('IncidentService', () => {
    const mockDate = new Date('2024-01-01T00:00:00.000Z');

    beforeEach(() => {
        jest.clearAllMocks();
        // Mock global Date
        jest.useFakeTimers();
        jest.setSystemTime(mockDate);
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    describe('create', () => {
        it('should create an incident successfully', async () => {
            const mockInput = {
                title: 'Test Incident',
                description: 'Description',
                severity: Severity.MEDIUM,
                status: IncidentStatus.OPEN,
                environment: Environment.PROD,
                systemId: 'system-123'
            };
            const userId = 'user-123';

            (prisma.system.findUnique as jest.Mock).mockResolvedValue({
                id: 'system-123',
                name: 'Test System'
            });

            (prisma.incident.create as jest.Mock).mockResolvedValue({
                id: 'incident-1',
                ...mockInput,
                createdById: userId,
                createdAt: mockDate
            });

            (prisma.auditLog.create as jest.Mock).mockResolvedValue({});

            const result = await incidentService.create(mockInput, userId);

            expect(prisma.incident.create).toHaveBeenCalledWith({
                data: expect.objectContaining({
                    title: 'Test Incident',
                    createdById: userId,
                    status: 'Open'
                }),
                include: expect.anything()
            });

            expect(result).toHaveProperty('id', 'incident-1');
        });
    });

    describe('getStats', () => {
        it('should return aggregated stats', async () => {
            (prisma.incident.findMany as jest.Mock).mockResolvedValue([]);
            (prisma.incident.groupBy as jest.Mock).mockResolvedValue([]); // top systems
            ((prisma.incident as any).aggregate as jest.Mock).mockResolvedValue({ _avg: { id: null } });
            (prisma.$queryRaw as jest.Mock).mockResolvedValue([]);

            // Mock separate count calls
            (prisma.incident.count as jest.Mock)
                .mockResolvedValueOnce(10) // created
                .mockResolvedValueOnce(5)  // resolved
                .mockResolvedValueOnce(2); // active

            const result = await incidentService.getStats({});

            expect(result).toEqual(expect.objectContaining({
                createdToday: 10,
                resolvedToday: 5,
                activeIncidents: 2
            }));
        });
    });
});
