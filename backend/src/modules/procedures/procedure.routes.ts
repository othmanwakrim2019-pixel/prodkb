
import { Router } from 'express';
import { ProcedureController } from './procedure.controller';
import { authenticate, checkPermission } from '../../common/middleware/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/', checkPermission('PROCEDURE_VIEW'), ProcedureController.getProcedures);
router.post('/', checkPermission('PROCEDURE_CREATE'), ProcedureController.createProcedure);
router.get('/:id', checkPermission('PROCEDURE_VIEW'), ProcedureController.getProcedureById);
router.get('/:id/stats', checkPermission('PROCEDURE_VIEW'), ProcedureController.getProcedureStats);
router.put('/:id', checkPermission('PROCEDURE_EDIT'), ProcedureController.updateProcedure);
router.delete('/:id', checkPermission('PROCEDURE_DELETE'), ProcedureController.deleteProcedure);

export const procedureRoutes = router;
