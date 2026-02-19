
import { Router, Request, Response, NextFunction } from 'express';
import { autoAssignService, createAutoAssignRuleSchema, updateAutoAssignRuleSchema } from './auto-assign.service';
import { authenticate, checkPermission } from '../../common/middleware/auth.middleware';
import { createResponse } from '../../common/types/api.response';

const router = Router();

router.get('/', authenticate, checkPermission('SYSTEM_MANAGE'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const rules = await autoAssignService.findAll();
        res.json(createResponse(true, rules));
    } catch (error) { next(error); }
});

router.post('/', authenticate, checkPermission('SYSTEM_MANAGE'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const data = createAutoAssignRuleSchema.parse(req.body);
        const rule = await autoAssignService.create(data);
        res.status(201).json(createResponse(true, rule, 'Auto-assignment rule created'));
    } catch (error) { next(error); }
});

router.put('/:id', authenticate, checkPermission('SYSTEM_MANAGE'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const data = updateAutoAssignRuleSchema.parse(req.body);
        const rule = await autoAssignService.update(req.params.id, data);
        res.json(createResponse(true, rule, 'Auto-assignment rule updated'));
    } catch (error) { next(error); }
});

router.delete('/:id', authenticate, checkPermission('SYSTEM_MANAGE'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        await autoAssignService.delete(req.params.id);
        res.json(createResponse(true, null, 'Auto-assignment rule deleted'));
    } catch (error) { next(error); }
});

export const autoAssignRoutes = router;
