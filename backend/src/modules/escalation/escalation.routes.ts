
/**
 * Escalation Routes
 * @module modules/escalation/escalation.routes
 */

import { Router, Request, Response, NextFunction } from 'express';
import { escalationService, createEscalationRuleSchema, updateEscalationRuleSchema } from './escalation.service';
import { authenticate, checkPermission } from '../../common/middleware/auth.middleware';
import { createResponse } from '../../common/types/api.response';

const router = Router();

router.get('/', authenticate, checkPermission('SLA_MANAGE'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const rules = await escalationService.findAll();
        res.json(createResponse(true, rules));
    } catch (error) { next(error); }
});

router.post('/', authenticate, checkPermission('SLA_MANAGE'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const data = createEscalationRuleSchema.parse(req.body);
        const rule = await escalationService.create(data);
        res.status(201).json(createResponse(true, rule, 'Escalation rule created'));
    } catch (error) { next(error); }
});

router.put('/:id', authenticate, checkPermission('SLA_MANAGE'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const data = updateEscalationRuleSchema.parse(req.body);
        const rule = await escalationService.update(req.params.id, data);
        res.json(createResponse(true, rule, 'Escalation rule updated'));
    } catch (error) { next(error); }
});

router.delete('/:id', authenticate, checkPermission('SLA_MANAGE'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        await escalationService.delete(req.params.id);
        res.json(createResponse(true, null, 'Escalation rule deleted'));
    } catch (error) { next(error); }
});

export const escalationRoutes = router;
