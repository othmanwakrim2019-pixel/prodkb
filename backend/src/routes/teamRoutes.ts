import express from 'express';
import {
    createTeam,
    listTeams,
    getTeam,
    updateTeam,
    deleteTeam,
    addTeamMember,
    removeTeamMember,
} from '../controllers/teamController';
import { authenticate, authorize, checkPermission } from '../middleware/auth';

const router = express.Router();

// Team routes - Admin only for create/update/delete
router.post('/', authenticate, checkPermission('TEAM_MANAGE'), createTeam);
router.get('/', authenticate, listTeams); // All authenticated users can list
router.get('/:id', authenticate, getTeam);
router.put('/:id', authenticate, checkPermission('TEAM_MANAGE'), updateTeam);
router.delete('/:id', authenticate, checkPermission('TEAM_DELETE'), deleteTeam);

// Team member management
router.post('/:id/members', authenticate, checkPermission('TEAM_MANAGE'), addTeamMember);
router.delete('/:id/members/:userId', authenticate, checkPermission('TEAM_MANAGE'), removeTeamMember);

export default router;
