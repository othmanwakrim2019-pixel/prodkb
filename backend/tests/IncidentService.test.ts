import { incidentCrudService } from '../src/modules/incidents/services/incident-crud.service';
import { incidentRepository } from '../src/modules/incidents/repositories/incident.repository';
import { autoAssignService } from '../src/modules/auto-assign/auto-assign.service';
import { webhookService } from '../src/modules/webhooks/webhook.service';
import { eventPublisher } from '../src/modules/events/event.publisher';
import { IncidentStatus } from '../src/constants';

jest.mock('../src/modules/incidents/repositories/incident.repository', () => ({
    incidentRepository: {
        findIncidents: jest.fn(),
        findIncidentById: jest.fn(),
        findSystemById: jest.fn(),
        findJobById: jest.fn(),
        createIncident: jest.fn(),
        createIncidentLog: jest.fn(),
        updateIncidentWithVersion: jest.fn(),
        updateIncident: jest.fn(),
        deleteIncident: jest.fn(),
        findProcedureById: jest.fn(),
        findCurrentAstreinteForTeam: jest.fn(),
    },
}));
jest.mock('../src/modules/auto-assign/auto-assign.service', () => ({
    autoAssignService: {
        matchRule: jest.fn(),
    },
}));
jest.mock('../src/modules/webhooks/webhook.service', () => ({
    webhookService: {
        dispatch: jest.fn().mockResolvedValue(undefined),
    },
}));
jest.mock('../src/modules/events/event.publisher', () => ({
    eventPublisher: {
        emit: jest.fn().mockResolvedValue(undefined),
    },
}));
jest.mock('../src/modules/incidents/services/incident-shared', () => {
    const actual = jest.requireActual('../src/modules/incidents/services/incident-shared');
    return {
        ...actual,
        sendNotification: jest.fn().mockResolvedValue(undefined),
    };
});
jest.mock('../src/common/utils/logger', () => ({
    logger: {
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
        debug: jest.fn(),
    },
}));

describe('IncidentCrudService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.useFakeTimers();
        jest.setSystemTime(new Date('2026-03-23T12:00:00.000Z'));
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    describe('create', () => {
        it('rejects invalid systems', async () => {
            (incidentRepository.findSystemById as jest.Mock).mockResolvedValue(null);

            await expect(incidentCrudService.create({
                title: 'Incident',
                description: 'Description',
                severity: 'HIGH' as any,
                environment: 'PROD' as any,
                systemId: 'system-1',
            }, 'user-1')).rejects.toThrow('Invalid system ID');
        });

        it('rejects invalid jobs', async () => {
            (incidentRepository.findSystemById as jest.Mock).mockResolvedValue({ id: 'system-1' });
            (incidentRepository.findJobById as jest.Mock).mockResolvedValue(null);

            await expect(incidentCrudService.create({
                title: 'Incident',
                description: 'Description',
                severity: 'HIGH' as any,
                environment: 'PROD' as any,
                systemId: 'system-1',
                jobId: 'job-1',
            }, 'user-1')).rejects.toThrow('Invalid job ID');
        });

        it('auto-assigns a team when no explicit team is provided', async () => {
            (incidentRepository.findSystemById as jest.Mock).mockResolvedValue({ id: 'system-1' });
            (autoAssignService.matchRule as jest.Mock).mockResolvedValue('team-42');
            (incidentRepository.findCurrentAstreinteForTeam as jest.Mock).mockResolvedValue(null);
            (incidentRepository.createIncidentLog as jest.Mock).mockResolvedValue({ id: 'log-1' });
            (incidentRepository.createIncident as jest.Mock).mockResolvedValue({
                id: 'incident-1',
                title: 'Incident',
                status: IncidentStatus.OPEN,
                severity: 'HIGH',
                system: { name: 'Payments' },
                assignedTeamId: 'team-42',
            });

            const result = await incidentCrudService.create({
                title: 'Incident',
                description: 'Description',
                severity: 'HIGH' as any,
                environment: 'PROD' as any,
                systemId: 'system-1',
            }, 'user-1');

            expect(autoAssignService.matchRule).toHaveBeenCalledWith('system-1', 'HIGH');
            expect(incidentRepository.createIncident).toHaveBeenCalledWith(expect.objectContaining({
                assignedTeamId: 'team-42',
                createdById: 'user-1',
                status: IncidentStatus.OPEN,
            }));
            expect(webhookService.dispatch).toHaveBeenCalledWith('incident.created', { incident: result });
            expect(eventPublisher.emit).toHaveBeenCalled();
        });
    });

    describe('update', () => {
        it('rejects invalid status transitions', async () => {
            (incidentRepository.findIncidentById as jest.Mock).mockResolvedValue({
                id: 'incident-1',
                title: 'Incident',
                status: IncidentStatus.CLOSED,
                createdAt: new Date('2026-03-23T10:00:00.000Z'),
                version: 1,
            });

            await expect(incidentCrudService.update('incident-1', {
                status: IncidentStatus.ACKNOWLEDGED,
            } as any, 'user-1')).rejects.toThrow('Invalid status transition');
        });

        it('sets acknowledge timestamps and increments version', async () => {
            const createdAt = new Date('2026-03-23T11:00:00.000Z');
            (incidentRepository.findIncidentById as jest.Mock).mockResolvedValue({
                id: 'incident-1',
                title: 'Incident',
                status: IncidentStatus.OPEN,
                createdAt,
                acknowledgedAt: null,
                version: 2,
            });
            (incidentRepository.updateIncidentWithVersion as jest.Mock).mockResolvedValue({
                id: 'incident-1',
                title: 'Incident',
                status: IncidentStatus.ACKNOWLEDGED,
                severity: 'HIGH',
                system: { name: 'Payments' },
            });
            (incidentRepository.createIncidentLog as jest.Mock).mockResolvedValue({ id: 'log-1' });

            await incidentCrudService.update('incident-1', {
                status: IncidentStatus.ACKNOWLEDGED,
            } as any, 'user-1');

            expect(incidentRepository.updateIncidentWithVersion).toHaveBeenCalledWith(
                'incident-1',
                2,
                expect.objectContaining({
                    status: IncidentStatus.ACKNOWLEDGED,
                    updatedById: 'user-1',
                    version: 3,
                    timeToAcknowledge: 60,
                    acknowledgedAt: expect.any(Date),
                }),
            );
        });

        it('sets resolution metadata when moving to resolved', async () => {
            const createdAt = new Date('2026-03-23T10:00:00.000Z');
            (incidentRepository.findIncidentById as jest.Mock).mockResolvedValue({
                id: 'incident-1',
                title: 'Incident',
                status: IncidentStatus.IN_PROGRESS,
                createdAt,
                version: 4,
            });
            (incidentRepository.updateIncidentWithVersion as jest.Mock).mockResolvedValue({
                id: 'incident-1',
                title: 'Incident',
                status: IncidentStatus.RESOLVED,
                severity: 'HIGH',
                system: { name: 'Payments' },
            });
            (incidentRepository.createIncidentLog as jest.Mock).mockResolvedValue({ id: 'log-1' });

            await incidentCrudService.update('incident-1', {
                status: IncidentStatus.RESOLVED,
            } as any, 'resolver-1');

            expect(incidentRepository.updateIncidentWithVersion).toHaveBeenCalledWith(
                'incident-1',
                4,
                expect.objectContaining({
                    status: IncidentStatus.RESOLVED,
                    updatedById: 'resolver-1',
                    resolvedById: 'resolver-1',
                    timeToResolve: 120,
                    resolvedAt: expect.any(Date),
                    version: 5,
                }),
            );
        });

        it('rejects stale optimistic-concurrency versions', async () => {
            (incidentRepository.findIncidentById as jest.Mock).mockResolvedValue({
                id: 'incident-1',
                title: 'Incident',
                status: IncidentStatus.OPEN,
                createdAt: new Date('2026-03-23T10:00:00.000Z'),
                version: 3,
            });

            await expect(incidentCrudService.update('incident-1', {
                version: 2,
                title: 'Updated title',
            } as any, 'user-1')).rejects.toThrow('Incident has been modified by another user');
        });
    });

    describe('delete', () => {
        it('deletes an existing incident', async () => {
            (incidentRepository.findIncidentById as jest.Mock).mockResolvedValue({
                id: 'incident-1',
                title: 'Incident',
                status: IncidentStatus.OPEN,
                createdAt: new Date('2026-03-23T10:00:00.000Z'),
                version: 1,
            });
            (incidentRepository.deleteIncident as jest.Mock).mockResolvedValue(undefined);

            await incidentCrudService.delete('incident-1', 'user-1');

            expect(incidentRepository.deleteIncident).toHaveBeenCalledWith('incident-1');
            expect(eventPublisher.emit).toHaveBeenCalledWith(expect.objectContaining({
                type: 'incident.deleted',
                incidentId: 'incident-1',
            }));
        });
    });

    describe('linkProcedure', () => {
        it('rejects missing procedures', async () => {
            (incidentRepository.findIncidentById as jest.Mock).mockResolvedValue({
                id: 'incident-1',
                title: 'Incident',
                status: IncidentStatus.OPEN,
                createdAt: new Date('2026-03-23T10:00:00.000Z'),
                version: 1,
            });
            (incidentRepository.findProcedureById as jest.Mock).mockResolvedValue(null);

            await expect(incidentCrudService.linkProcedure('incident-1', 'procedure-1'))
                .rejects.toThrow('Procedure not found');
        });
    });
});
