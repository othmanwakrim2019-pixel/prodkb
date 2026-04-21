
import { Router } from 'express';
import { TeamController } from '../presentation/team.controller';
import { authenticate, requirePermission } from '../../../common/middleware/auth.middleware';

const router = Router();

router.use(authenticate);

// Team routes - Admin only for create/update/delete
router.post('/', requirePermission('TEAM_MANAGE'), TeamController.createTeam);
router.get('/', TeamController.listTeams); // All authenticated users can list
router.get('/:id', TeamController.getTeam);
router.put('/:id', requirePermission('TEAM_MANAGE'), TeamController.updateTeam);
router.delete('/:id', requirePermission('TEAM_DELETE'), TeamController.deleteTeam);

// Team member management
router.post('/:id/members', requirePermission('TEAM_MANAGE'), TeamController.addMember);
router.delete('/:id/members/:userId', requirePermission('TEAM_MANAGE'), TeamController.removeMember);

export const teamRoutes = router;
