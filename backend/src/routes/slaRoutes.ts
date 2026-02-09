import express from 'express';
import {
    createSLA,
    listSLAs,
    getSLA,
    updateSLA,
    deleteSLA,
} from '../controllers/slaController';
import { authenticate, authorize, checkPermission } from '../middleware/auth';

const router = express.Router();

// SLA routes - Admin only for create/update/delete
router.post('/', authenticate, checkPermission('SLA_MANAGE'), createSLA);
router.get('/', authenticate, listSLAs); // All authenticated users can list
router.get('/:id', authenticate, getSLA);
router.put('/:id', authenticate, checkPermission('SLA_MANAGE'), updateSLA);
router.delete('/:id', authenticate, checkPermission('SLA_MANAGE'), deleteSLA);

export default router;
