import type { NextFunction, Request, Response } from 'express';
import { ForbiddenError } from '../../../common/errors/app.error';
import type { AuthRequest } from '../../../common/middleware/auth.middleware';
import { createResponse } from '../../../common/types/api.response';
import { incidentAnalyticsService } from '../services/incident-analytics.service';
import { incidentCrudService, type FindAllFilters } from '../services/incident-crud.service';
import { canAccessIncidentTeam, getScopedIncidentTeamIds } from '../services/incident-visibility.service';
import { incidentSuggestionService } from '../services/suggestion.service';
import { incidentRepository } from '../repositories/incident.repository';

export class IncidentQueryController {
    static async getStats(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const timezoneOffset = Number(req.query.timezoneOffsetMinutes);
            const filters = {
                startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
                endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
                systemId: req.query.systemId as string,
                teamId: req.query.teamId as string,
                userId: req.user?.id,
                userRole: req.user?.role,
                userPermissions: req.user?.permissions || [],
                userTeamIds: req.user?.teamIds || [],
                timezoneOffsetMinutes: Number.isFinite(timezoneOffset) ? timezoneOffset : undefined,
            };

            const stats = await incidentAnalyticsService.getStats(filters);
            res.json(createResponse(true, stats));
        } catch (error) {
            next(error);
        }
    }

    static async searchSimilar(req: Request, res: Response, next: NextFunction) {
        try {
            const { query } = req.query;
            if (!query) {
                res.json(createResponse(true, []));
                return;
            }

            const incidents = await incidentCrudService.searchSimilar(query as string);
            res.json(createResponse(true, incidents));
        } catch (error) {
            next(error);
        }
    }

    static async suggestProcedures(req: Request, res: Response, next: NextFunction) {
        try {
            const systemId = req.query.systemId as string;
            if (!systemId) {
                res.json(createResponse(true, []));
                return;
            }

            const jobId = req.query.jobId as string | undefined;
            const severity = req.query.severity as string | undefined;
            const suggestions = await incidentSuggestionService.suggestProcedures(systemId, jobId, severity);
            res.json(createResponse(true, suggestions));
        } catch (error) {
            next(error);
        }
    }

    static async getIncidents(req: Request, res: Response, next: NextFunction) {
        try {
            const pagination = req.pagination || { page: 1, limit: 50, sortBy: 'createdAt', sortOrder: 'desc' };

            const filters: FindAllFilters = {
                status: req.query.status as string,
                severity: req.query.severity as string,
                systemId: req.query.systemId as string,
                search: req.query.search as string,
                startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
                endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
            };

            const user = (req as AuthRequest).user;
            const scopedTeamIds = getScopedIncidentTeamIds(user);

            if (scopedTeamIds) {
                if (scopedTeamIds.length === 0) {
                    filters.teamId = 'NONE';
                } else if (req.query.teamId) {
                    filters.teamId = scopedTeamIds.includes(req.query.teamId as string)
                        ? req.query.teamId as string
                        : 'NONE';
                } else {
                    filters.teamId = scopedTeamIds;
                }
            } else if (req.query.teamId) {
                filters.teamId = req.query.teamId as string;
            }

            const result = await incidentCrudService.findAll(filters, pagination);

            res.json(createResponse(true, {
                items: result.data,
                meta: {
                    total: result.total,
                    page: result.page,
                    limit: result.limit,
                    totalPages: result.totalPages,
                },
            }));
        } catch (error) {
            next(error);
        }
    }

    static async getIncidentById(req: Request, res: Response, next: NextFunction) {
        try {
            const authReq = req as AuthRequest;
            const incident = await incidentCrudService.findById(req.params.id);

            if (!canAccessIncidentTeam(authReq.user, incident.assignedTeamId)) {
                throw new ForbiddenError('You do not have access to this incident');
            }

            res.json(createResponse(true, incident));
        } catch (error) {
            next(error);
        }
    }

    static async getActivity(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const logs = await incidentRepository.findActivityLogs(id);
            res.json(createResponse(true, logs));
        } catch (error) {
            next(error);
        }
    }
}
