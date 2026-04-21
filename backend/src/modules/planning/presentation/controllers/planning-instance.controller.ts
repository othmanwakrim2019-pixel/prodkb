import type { NextFunction, Response } from 'express';
import type { PlanningPeriod, TaskType } from '@prisma/client';
import Papa from 'papaparse';
import type { AuthRequest } from '../../../../common/middleware/auth.middleware';
import { createResponse } from '../../../../common/types/api.response';
import { logAudit } from '../../../audit/application/audit.service';
import {
    createInstanceSchema,
    instanceStatusEnum,
    periodEnum,
} from '../planning.schema';
import { planningInstanceService } from '../../application/planning-instance.service';
import { requirePlanningUserId } from './planning-controller.shared';

export class PlanningInstanceController {
    static async getInstances(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const period = req.query.period ? periodEnum.parse(req.query.period) : undefined;
            const status = req.query.status ? instanceStatusEnum.parse(req.query.status) : undefined;
            const instances = await planningInstanceService.findAll({ period, status });
            res.json(createResponse(true, instances));
        } catch (error) {
            next(error);
        }
    }

    static async getInstance(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const instance = await planningInstanceService.findById(req.params.id);
            res.json(createResponse(true, instance));
        } catch (error) {
            next(error);
        }
    }

    static async createInstance(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const userId = requirePlanningUserId(req);
            const data = createInstanceSchema.parse(req.body);
            const instance = await planningInstanceService.create({
                ...data,
                startDate: new Date(data.startDate),
                endDate: new Date(data.endDate),
                createdById: userId,
            });

            await logAudit({
                userId,
                actionType: 'CREATE',
                entityType: 'PLANNING_INSTANCE',
                entityId: instance.id,
                details: JSON.stringify({ name: data.name, period: data.period }),
                req,
            });

            res.status(201).json(createResponse(true, instance, 'Planning instance created'));
        } catch (error) {
            next(error);
        }
    }

    static async archiveInstance(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const userId = requirePlanningUserId(req);
            const instance = await planningInstanceService.archive(req.params.id);

            await logAudit({
                userId,
                actionType: 'UPDATE',
                entityType: 'PLANNING_INSTANCE',
                entityId: req.params.id,
                details: JSON.stringify({ action: 'ARCHIVE' }),
                req,
            });

            res.json(createResponse(true, instance, 'Instance archived'));
        } catch (error) {
            next(error);
        }
    }

    static async reactivateInstance(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const instance = await planningInstanceService.reactivate(req.params.id);
            res.json(createResponse(true, instance, 'Instance reactivated'));
        } catch (error) {
            next(error);
        }
    }

    static async cloneInstance(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const userId = requirePlanningUserId(req);
            const cloned = await planningInstanceService.cloneForNextMonth(req.params.id, userId);

            await logAudit({
                userId,
                actionType: 'CREATE',
                entityType: 'PLANNING_INSTANCE',
                entityId: cloned!.id,
                details: JSON.stringify({ action: 'CLONE', sourceInstanceId: req.params.id }),
                req,
            });

            res.status(201).json(createResponse(true, cloned, 'Instance cloned for next month'));
        } catch (error) {
            next(error);
        }
    }

    static async deleteInstance(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const userId = requirePlanningUserId(req);
            const instance = await planningInstanceService.delete(req.params.id);

            await logAudit({
                userId,
                actionType: 'DELETE',
                entityType: 'PLANNING_INSTANCE',
                entityId: req.params.id,
                details: JSON.stringify({ name: instance.name }),
                req,
            });

            res.json(createResponse(true, null, 'Planning instance deleted'));
        } catch (error) {
            next(error);
        }
    }

    static async importCsv(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const userId = requirePlanningUserId(req);

            if (!req.file) {
                res.status(400).json(createResponse(false, null, 'No CSV file uploaded'));
                return;
            }

            const instanceName = (req.body.instanceName as string)?.trim();
            const period = req.body.period as string;

            if (!instanceName) {
                res.status(400).json(createResponse(false, null, 'instanceName is required'));
                return;
            }

            const validPeriods: PlanningPeriod[] = ['monthly', 'quarterly', 'annual'];
            if (!validPeriods.includes(period as PlanningPeriod)) {
                res.status(400).json(createResponse(false, null, 'period must be monthly, quarterly, or annual'));
                return;
            }

            const csvText = req.file.buffer.toString('utf-8');
            const { data } = Papa.parse<Record<string, string>>(csvText, {
                header: true,
                skipEmptyLines: true,
                transformHeader: (header) => header.trim().toLowerCase().replace(/\s+/g, '_'),
            });

            const result = await planningInstanceService.importFromCsv({
                instanceName,
                period: period as PlanningPeriod,
                rows: data,
                createdById: userId,
            });

            await logAudit({
                userId,
                actionType: 'CREATE',
                entityType: 'PLANNING_INSTANCE',
                entityId: result.instance.id,
                details: JSON.stringify({ action: 'CSV_IMPORT', jobsCreated: result.jobsCreated }),
                req,
            });

            res.status(201).json(createResponse(true, result, `Imported ${result.jobsCreated} tasks into "${instanceName}"`));
        } catch (error) {
            next(error);
        }
    }
}
