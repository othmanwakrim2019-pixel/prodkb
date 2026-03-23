import { SLAEnforcementService } from '../src/modules/sla/sla-enforcement.service';
import { slaRepository } from '../src/modules/sla/repositories/sla.repository';
import { escalationService } from '../src/modules/escalation/escalation.service';
import { webhookService } from '../src/modules/webhooks/webhook.service';
import { emailService } from '../src/common/services/email.service';
import { IncidentStatus } from '../src/constants';

jest.mock('../src/modules/sla/repositories/sla.repository', () => ({
    slaRepository: {
        findUnbreachedActiveIncidentsWithSla: jest.fn(),
        markIncidentSlaBreached: jest.fn(),
        createIncidentLog: jest.fn(),
        findBreachedActiveIncidents: jest.fn(),
        findIncidentEscalationState: jest.fn(),
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
jest.mock('../src/common/services/email.service', () => ({
    emailService: {
        sendIncidentUpdated: jest.fn().mockResolvedValue(undefined),
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
        it('runs breach detection and escalation checks', async () => {
            const detectSpy = jest.spyOn(service as any, 'detectNewBreaches').mockResolvedValue(undefined);
            const escalateSpy = jest.spyOn(service as any, 'escalateBreachedIncidents').mockResolvedValue(undefined);

            await service.check();

            expect(detectSpy).toHaveBeenCalledTimes(1);
            expect(escalateSpy).toHaveBeenCalledTimes(1);
        });

        it('rethrows processing failures so the worker can retry', async () => {
            jest.spyOn(service as any, 'detectNewBreaches').mockRejectedValue(new Error('DB connection lost'));

            await expect(service.check()).rejects.toThrow('DB connection lost');
        });
    });

    describe('detectNewBreaches()', () => {
        it('does nothing when there are no active SLA incidents', async () => {
            (slaRepository.findUnbreachedActiveIncidentsWithSla as jest.Mock).mockResolvedValue([]);

            await expect((service as any).detectNewBreaches(new Date())).resolves.not.toThrow();

            expect(slaRepository.markIncidentSlaBreached).not.toHaveBeenCalled();
        });

        it('marks breached incidents, logs them, and triggers escalation', async () => {
            const now = new Date('2026-03-23T12:00:00.000Z');
            const incident = {
                id: 'incident-1',
                title: 'Payments outage',
                severity: 'HIGH',
                status: IncidentStatus.OPEN,
                createdAt: new Date('2026-03-23T11:00:00.000Z'),
                acknowledgedAt: null,
                resolvedAt: null,
                assignedTeam: { id: 'team-1', name: 'Ops', emailDistribution: 'ops@example.com' },
                system: { id: 'system-1', name: 'Payments' },
                sla: {
                    name: 'High severity SLA',
                    acknowledgeTimeMinutes: 15,
                    resolveTimeMinutes: 120,
                },
            };

            (slaRepository.findUnbreachedActiveIncidentsWithSla as jest.Mock).mockResolvedValue([incident]);
            (slaRepository.markIncidentSlaBreached as jest.Mock).mockResolvedValue(undefined);
            (slaRepository.createIncidentLog as jest.Mock).mockResolvedValue(undefined);

            await (service as any).detectNewBreaches(now);

            expect(slaRepository.markIncidentSlaBreached).toHaveBeenCalledWith('incident-1', now);
            expect(slaRepository.createIncidentLog).toHaveBeenCalledWith(expect.objectContaining({
                incidentId: 'incident-1',
                logType: 'note',
            }));
            expect(emailService.sendIncidentUpdated).toHaveBeenCalled();
            expect(webhookService.dispatch).toHaveBeenCalledWith('incident.sla_breached', expect.any(Object));
            expect(escalationService.escalateIncident).toHaveBeenCalledWith('incident-1');
        });
    });

    describe('escalateBreachedIncidents()', () => {
        it('does nothing when there are no breached incidents to escalate', async () => {
            (slaRepository.findBreachedActiveIncidents as jest.Mock).mockResolvedValue([]);

            await expect((service as any).escalateBreachedIncidents()).resolves.not.toThrow();

            expect(escalationService.escalateIncident).not.toHaveBeenCalled();
        });

        it('dispatches an escalation webhook only when the level increases', async () => {
            (slaRepository.findBreachedActiveIncidents as jest.Mock).mockResolvedValue([
                {
                    id: 'incident-1',
                    escalationLevel: 1,
                    title: 'Payments outage',
                    severity: 'HIGH',
                },
            ]);
            (slaRepository.findIncidentEscalationState as jest.Mock).mockResolvedValue({
                escalationLevel: 2,
                assignedTeamId: 'team-2',
            });

            await (service as any).escalateBreachedIncidents();

            expect(escalationService.escalateIncident).toHaveBeenCalledWith('incident-1');
            expect(webhookService.dispatch).toHaveBeenCalledWith('incident.escalated', {
                incident: {
                    id: 'incident-1',
                    title: 'Payments outage',
                    severity: 'HIGH',
                    escalationLevel: 2,
                    assignedTeamId: 'team-2',
                },
            });
        });

        it('swallows escalation failures and continues the batch', async () => {
            (slaRepository.findBreachedActiveIncidents as jest.Mock).mockResolvedValue([
                {
                    id: 'incident-1',
                    escalationLevel: 1,
                    title: 'Payments outage',
                    severity: 'HIGH',
                },
            ]);
            (escalationService.escalateIncident as jest.Mock).mockRejectedValue(new Error('Escalation failed'));

            await expect((service as any).escalateBreachedIncidents()).resolves.not.toThrow();
        });
    });
});
