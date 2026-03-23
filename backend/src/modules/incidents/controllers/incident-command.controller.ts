import type { NextFunction, Request, Response } from 'express';
import { ForbiddenError } from '../../../common/errors/app.error';
import type { AuthRequest } from '../../../common/middleware/auth.middleware';
import { createResponse } from '../../../common/types/api.response';
import { sanitizeObject } from '../../../common/utils/sanitize';
import { UserRole } from '../../../constants';
import type { CreateIncidentDTO, UpdateIncidentDTO } from '../../../types';
import { logAudit, generateAuditDiff } from '../../audit/audit.service';
import { addIncidentLogSchema, createIncidentSchema, updateIncidentSchema } from '../incident.schema';
import { incidentCrudService } from '../services/incident-crud.service';
import { incidentFileService } from '../services/incident-file.service';
import { incidentStatusService } from '../services/incident-status.service';
import { canAccessIncidentTeam, hasGlobalIncidentAccess } from '../services/incident-visibility.service';
import { requireAuthenticatedUserId } from './incident-controller.shared';

export class IncidentCommandController {
    static async createIncident(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const userId = requireAuthenticatedUserId(req);
            const data = sanitizeObject(createIncidentSchema.parse(req.body), ['description']);
            const incident = await incidentCrudService.create(data as CreateIncidentDTO, userId);

            await logAudit({
                userId,
                actionType: 'CREATE',
                entityType: 'INCIDENT',
                entityId: incident.id,
                details: `Created incident: ${incident.title}`,
                req,
            });

            res.status(201).json(createResponse(true, incident, 'Incident created successfully'));
        } catch (error) {
            next(error);
        }
    }

    static async updateIncident(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const userId = requireAuthenticatedUserId(req);
            const existingIncident = await incidentCrudService.findById(req.params.id);
            const data = sanitizeObject(updateIncidentSchema.parse(req.body), ['description']);

            if (data.status === 'Closed' && req.user?.role !== UserRole.ADMIN) {
                throw new ForbiddenError('Only Administrators can close incidents');
            }

            if (data.status === 'Resolved' && !([UserRole.ADMIN, UserRole.OPERATOR, UserRole.EXPERT] as readonly string[]).includes(req.user?.role ?? '')) {
                throw new ForbiddenError('Only Administrators, Experts or Operators can resolve incidents');
            }

            const incident = await incidentCrudService.update(req.params.id, data as UpdateIncidentDTO, userId);
            const changes = generateAuditDiff(
                existingIncident as unknown as Record<string, unknown>,
                incident as unknown as Record<string, unknown>
            );

            if (changes !== 'No changes detected') {
                await logAudit({
                    userId,
                    actionType: 'UPDATE',
                    entityType: 'INCIDENT',
                    entityId: req.params.id,
                    details: changes,
                    req,
                });
            }

            res.json(createResponse(true, incident));
        } catch (error) {
            next(error);
        }
    }

    static async updateIncidentStatus(req: AuthRequest, res: Response, next: NextFunction) {
        req.body = { status: req.body.status };
        return IncidentCommandController.updateIncident(req, res, next);
    }

    static async acknowledgeIncident(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const userId = requireAuthenticatedUserId(req);
            const incident = await incidentStatusService.acknowledge(req.params.id, userId);
            res.json(createResponse(true, incident, 'Incident acknowledged'));
        } catch (error) {
            next(error);
        }
    }

    static async addIncidentLog(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const userId = requireAuthenticatedUserId(req);
            const data = addIncidentLogSchema.parse(req.body);
            const log = await incidentFileService.addLog(req.params.id, data, userId);
            res.status(201).json(createResponse(true, log));
        } catch (error) {
            next(error);
        }
    }

    static async linkProcedure(req: Request, res: Response, next: NextFunction) {
        try {
            const authReq = req as AuthRequest;
            const existingIncident = await incidentCrudService.findById(req.params.id);

            if (!hasGlobalIncidentAccess(authReq.user) && !canAccessIncidentTeam(authReq.user, existingIncident.assignedTeamId)) {
                throw new ForbiddenError('You do not have access to this incident');
            }

            const incident = await incidentCrudService.linkProcedure(req.params.id, req.params.procedureId);
            res.json(createResponse(true, incident));
        } catch (error) {
            next(error);
        }
    }

    static async deleteIncident(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const userId = requireAuthenticatedUserId(req);

            if (req.user?.role !== UserRole.ADMIN) {
                throw new ForbiddenError('Only Administrators can delete incidents');
            }

            await incidentCrudService.delete(req.params.id, userId);
            res.json(createResponse(true, null, 'Incident deleted successfully'));
        } catch (error) {
            next(error);
        }
    }
}
