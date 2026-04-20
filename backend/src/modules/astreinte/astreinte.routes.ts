import { Router } from 'express';
import { authenticate, requirePermission } from '../../common/middleware/auth.middleware';
import { validateRequest } from '../../common/middleware/zod-setup';
import { createAstreinteSchema, updateAstreinteSchema } from './astreinte.schema';
import { AstreinteQueryController } from './controllers/astreinte-query.controller';
import { AstreinteCommandController } from './controllers/astreinte-command.controller';

const router = Router();

router.use(authenticate);

// ── Read routes (EQUIPE_VIEW) ────────────────────────────────────────────────
router.get('/',                    requirePermission('EQUIPE_VIEW'), AstreinteQueryController.list);
router.get('/current/:teamId',     requirePermission('EQUIPE_VIEW'), AstreinteQueryController.getCurrent);

// ── Write routes (EQUIPE_MANAGE) ─────────────────────────────────────────────
router.post('/',
    requirePermission('EQUIPE_MANAGE'),
    validateRequest(createAstreinteSchema),
    AstreinteCommandController.assign
);

router.patch('/:id',
    requirePermission('EQUIPE_MANAGE'),
    validateRequest(updateAstreinteSchema),
    AstreinteCommandController.update
);

router.delete('/:id',
    requirePermission('EQUIPE_MANAGE'),
    AstreinteCommandController.delete
);

export const astreinteRoutes = router;
