
import { Router } from 'express';
import { ProcedureController } from './procedure.controller';
import { authenticate, requirePermission } from '../../common/middleware/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/', requirePermission('PROCEDURE_VIEW'), ProcedureController.getProcedures);
router.post('/', requirePermission('PROCEDURE_CREATE'), ProcedureController.createProcedure);
router.get('/:id', requirePermission('PROCEDURE_VIEW'), ProcedureController.getProcedureById);
router.get('/:id/stats', requirePermission('PROCEDURE_VIEW'), ProcedureController.getProcedureStats);
router.put('/:id', requirePermission('PROCEDURE_EDIT'), ProcedureController.updateProcedure);
router.delete('/:id', requirePermission('PROCEDURE_DELETE'), ProcedureController.deleteProcedure);

export const procedureRoutes = router;
