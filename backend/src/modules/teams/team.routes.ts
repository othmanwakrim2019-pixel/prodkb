
import { Router } from 'express';
import { TeamController } from './team.controller';
import { authenticate, checkPermission } from '../../common/middleware/auth.middleware';

const router = Router();

router.use(authenticate);

// Team routes - Admin only for create/update/delete
router.post('/', checkPermission('TEAM_MANAGE'), TeamController.createTeam);
router.get('/', TeamController.listTeams); // All authenticated users can list
router.get('/:id', TeamController.getTeam);
router.put('/:id', checkPermission('TEAM_MANAGE'), TeamController.updateTeam);
router.delete('/:id', checkPermission('TEAM_DELETE'), TeamController.deleteTeam);

// Team member management
router.post('/:id/members', checkPermission('TEAM_MANAGE'), TeamController.addMember);
router.delete('/:id/members/:userId', checkPermission('TEAM_MANAGE'), TeamController.removeMember);

export const teamRoutes = router;
