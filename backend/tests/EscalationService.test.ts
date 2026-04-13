import { escalationService } from '../src/modules/escalation/escalation.service';
import { escalationRepository } from '../src/modules/escalation/repositories/escalation.repository';

jest.mock('../src/modules/escalation/repositories/escalation.repository', () => ({
    escalationRepository: {
        findRules: jest.fn(),
        createRule: jest.fn(),
        findRuleById: jest.fn(),
        updateRule: jest.fn(),
        deleteRule: jest.fn(),
        findIncidentForEscalation: jest.fn(),
        findNextEscalationRule: jest.fn(),
        escalateIncident: jest.fn(),
        createIncidentLog: jest.fn(),
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

describe('EscalationService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.useFakeTimers();
        jest.setSystemTime(new Date('2026-03-23T12:00:00.000Z'));
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    describe('basic rule operations', () => {
        it('returns all rules', async () => {
            (escalationRepository.findRules as jest.Mock).mockResolvedValue([{ id: 'rule-1' }]);

            await expect(escalationService.findAll()).resolves.toEqual([{ id: 'rule-1' }]);
        });

        it('creates a rule', async () => {
            const payload = {
                name: 'High severity escalation',
                level: 2,
                teamId: 'team-2',
                delayMinutes: 15,
            };
            (escalationRepository.createRule as jest.Mock).mockResolvedValue({ id: 'rule-1', ...payload });

            await expect(escalationService.create(payload as any)).resolves.toEqual({ id: 'rule-1', ...payload });
        });
    });

    describe('update', () => {
        it('rejects updates for missing rules', async () => {
            (escalationRepository.findRuleById as jest.Mock).mockResolvedValue(null);

            await expect(escalationService.update('missing', {} as any))
                .rejects.toThrow('Escalation rule not found');
        });
    });

    describe('delete', () => {
        it('rejects deletes for missing rules', async () => {
            (escalationRepository.findRuleById as jest.Mock).mockResolvedValue(null);

            await expect(escalationService.delete('missing'))
                .rejects.toThrow('Escalation rule not found');
        });
    });

    describe('escalateIncident', () => {
        it('returns silently when the incident does not exist', async () => {
            (escalationRepository.findIncidentForEscalation as jest.Mock).mockResolvedValue(null);

            await expect(escalationService.escalateIncident('incident-1')).resolves.toBeUndefined();
        });

        it('returns when no next escalation rule is found', async () => {
            (escalationRepository.findIncidentForEscalation as jest.Mock).mockResolvedValue({
                id: 'incident-1',
                systemId: 'system-1',
                severity: 'HIGH',
                escalationLevel: 1,
                slaBreachNotifiedAt: null,
            });
            (escalationRepository.findNextEscalationRule as jest.Mock).mockResolvedValue(null);

            await escalationService.escalateIncident('incident-1');

            expect(escalationRepository.escalateIncident).not.toHaveBeenCalled();
        });

        it('respects rule delay after breach notification', async () => {
            (escalationRepository.findIncidentForEscalation as jest.Mock).mockResolvedValue({
                id: 'incident-1',
                systemId: 'system-1',
                severity: 'HIGH',
                escalationLevel: 1,
                slaBreachNotifiedAt: new Date('2026-03-23T11:50:00.000Z'),
            });
            (escalationRepository.findNextEscalationRule as jest.Mock).mockResolvedValue({
                id: 'rule-1',
                name: 'High severity escalation',
                teamId: 'team-2',
                delayMinutes: 15,
            });

            await escalationService.escalateIncident('incident-1');

            expect(escalationRepository.escalateIncident).not.toHaveBeenCalled();
        });

        it('escalates incidents and writes a log once the delay has passed', async () => {
            (escalationRepository.findIncidentForEscalation as jest.Mock).mockResolvedValue({
                id: 'incident-1',
                systemId: 'system-1',
                severity: 'HIGH',
                escalationLevel: 1,
                slaBreachNotifiedAt: new Date('2026-03-23T11:30:00.000Z'),
            });
            (escalationRepository.findNextEscalationRule as jest.Mock).mockResolvedValue({
                id: 'rule-1',
                name: 'High severity escalation',
                teamId: 'team-2',
                delayMinutes: 15,
            });
            (escalationRepository.escalateIncident as jest.Mock).mockResolvedValue(undefined);
            (escalationRepository.createIncidentLog as jest.Mock).mockResolvedValue(undefined);

            await escalationService.escalateIncident('incident-1');

            expect(escalationRepository.escalateIncident).toHaveBeenCalledWith('incident-1', 'team-2', 2);
            expect(escalationRepository.createIncidentLog).toHaveBeenCalledWith(
                'incident-1',
                expect.stringContaining('AUTO-ESCALATION'),
            );
        });
    });
});
