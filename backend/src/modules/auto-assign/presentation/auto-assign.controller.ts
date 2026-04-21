import type { NextFunction, Request, Response } from 'express';
import { createResponse } from '../../../common/types/api.response';
import { autoAssignService } from '../application/auto-assign.service';
import { createAutoAssignRuleSchema, updateAutoAssignRuleSchema } from './auto-assign.schema';

export class AutoAssignController {
    static async getAll(req: Request, res: Response, next: NextFunction) {
        try {
            const rules = await autoAssignService.findAll();
            res.json(createResponse(true, rules));
        } catch (error) {
            next(error);
        }
    }

    static async create(req: Request, res: Response, next: NextFunction) {
        try {
            const data = createAutoAssignRuleSchema.parse(req.body);
            const rule = await autoAssignService.create(data);
            res.status(201).json(createResponse(true, rule, 'Auto-assignment rule created'));
        } catch (error) {
            next(error);
        }
    }

    static async update(req: Request, res: Response, next: NextFunction) {
        try {
            const data = updateAutoAssignRuleSchema.parse(req.body);
            const rule = await autoAssignService.update(req.params.id, data);
            res.json(createResponse(true, rule, 'Auto-assignment rule updated'));
        } catch (error) {
            next(error);
        }
    }

    static async delete(req: Request, res: Response, next: NextFunction) {
        try {
            await autoAssignService.delete(req.params.id);
            res.json(createResponse(true, null, 'Auto-assignment rule deleted'));
        } catch (error) {
            next(error);
        }
    }
}
