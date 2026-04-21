import type { NextFunction, Request, Response } from 'express';
import { createResponse } from '../../../common/types/api.response';
import { escalationService } from '../application/escalation.service';
import { createEscalationRuleSchema, updateEscalationRuleSchema } from '../presentation/escalation.schema';

export class EscalationController {
    static async getAll(req: Request, res: Response, next: NextFunction) {
        try {
            const rules = await escalationService.findAll();
            res.json(createResponse(true, rules));
        } catch (error) {
            next(error);
        }
    }

    static async create(req: Request, res: Response, next: NextFunction) {
        try {
            const data = createEscalationRuleSchema.parse(req.body);
            const rule = await escalationService.create(data);
            res.status(201).json(createResponse(true, rule, 'Escalation rule created'));
        } catch (error) {
            next(error);
        }
    }

    static async update(req: Request, res: Response, next: NextFunction) {
        try {
            const data = updateEscalationRuleSchema.parse(req.body);
            const rule = await escalationService.update(req.params.id, data);
            res.json(createResponse(true, rule, 'Escalation rule updated'));
        } catch (error) {
            next(error);
        }
    }

    static async delete(req: Request, res: Response, next: NextFunction) {
        try {
            await escalationService.delete(req.params.id);
            res.json(createResponse(true, null, 'Escalation rule deleted'));
        } catch (error) {
            next(error);
        }
    }
}
