/**
 * SLA Enforcement Service Tests
 * Tests the core breach-detection and escalation logic without needing BullMQ or Redis.
 */
import { SLAEnforcementService } from '../src/modules/sla/sla-enforcement.service';
import { prisma } from '../src/common/utils/prisma';
import { IncidentStatus } from '../src/constants';

// Mock all external dependencies
jest.mock('../src/common/utils/prisma', () => ({
    prisma: {
        incident: {
            findMany: jest.fn(),
            update: jest.fn(),
        },
        incidentLog: {
            create: jest.fn().mockResolvedValue({}),
        },
        escalationRule: {
            findMany: jest.fn(),
        },
        $transaction: jest.fn(),
    },
}));

jest.mock('../src/common/services/emailService', () => ({
    emailService: {
        sendEmail: jest.fn().mockResolvedValue(undefined),
        isConfigured: jest.fn().mockReturnValue(false),
    },
}));

jest.mock('../src/modules/escalation/escalation.service', () => ({
    escalationService: {
        escalateIncident: jest.fn().mockResolvedValue(undefined),
    },
}));

jest.mock('../src/modules/webhooks/webhook.service', () => ({
    webhookService: {
        dispatch: jest.fn().mockResolvedValue(undefined),
    },
}));

jest.mock('../src/common/utils/logger', () => ({
    logger: {
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
        debug: jest.fn(),
    },
}));

describe('SLAEnforcementService', () => {
    let service: SLAEnforcementService;

    beforeEach(() => {
        jest.clearAllMocks();
        service = new SLAEnforcementService();
    });

    describe('check()', () => {
        it('should call detectNewBreaches and escalateBreachedIncidents', async () => {
            // Mock both internal methods
            const detectSpy = jest.spyOn(service as any, 'detectNewBreaches').mockResolvedValue(undefined);
            const escalateSpy = jest.spyOn(service as any, 'escalateBreachedIncidents').mockResolvedValue(undefined);

            await service.check();

            expect(detectSpy).toHaveBeenCalledTimes(1);
            expect(escalateSpy).toHaveBeenCalledTimes(1);
        });

        it('should re-throw errors so BullMQ can retry', async () => {
            jest.spyOn(service as any, 'detectNewBreaches').mockRejectedValue(new Error('DB connection lost'));

            await expect(service.check()).rejects.toThrow('DB connection lost');
        });
    });

    describe('detectNewBreaches()', () => {
        it('should not fail when there are no breached incidents', async () => {
            (prisma.incident.findMany as jest.Mock).mockResolvedValue([]);

            await expect((service as any).detectNewBreaches(new Date())).resolves.not.toThrow();
        });

        it('should detect acknowledge breach for overdue incidents', async () => {
            const now = new Date();
            const created30MinAgo = new Date(now.getTime() - 30 * 60 * 1000);

            const breachedIncident = {
                id: 'inc-1',
                title: 'Test Incident',
                status: IncidentStatus.OPEN,
                acknowledgedAt: null,
                createdAt: created30MinAgo,
                sla: {
                    acknowledgeTimeMinutes: 15, // 15 min SLA, but 30 min elapsed
                    resolveTimeMinutes: 120,
                },
                slaBreached: false,
                team: { name: 'Test Team', emailDistribution: 'team@test.com' },
            };

            (prisma.incident.findMany as jest.Mock).mockResolvedValue([breachedIncident]);
            (prisma.incident.update as jest.Mock).mockResolvedValue({ ...breachedIncident, slaBreached: true });

            await (service as any).detectNewBreaches(now);

            expect(prisma.incident.update).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { id: 'inc-1' },
                    data: expect.objectContaining({ slaBreached: true }),
                })
            );
        });
    });

    describe('escalateBreachedIncidents()', () => {
        it('should not fail when there are no breached incidents to escalate', async () => {
            (prisma.incident.findMany as jest.Mock).mockResolvedValue([]);

            await expect((service as any).escalateBreachedIncidents()).resolves.not.toThrow();
        });
    });
});
