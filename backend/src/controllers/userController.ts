import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { userService } from '../services/UserService';
import { NotFoundError } from '../errors/AppError';
import { logAudit } from '../services/auditService';

export const getAllUsers = async (req: AuthRequest, res: Response) => {
    const users = await userService.findAllDetailed();
    res.json(users);
};

export const deleteUser = async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    await userService.delete(id);

    // Audit log
    await logAudit({ userId: req.user?.id || 'unknown', actionType: 'DELETE', entityType: 'USER', entityId: id, details: JSON.stringify({ deletedUserId: id }), req });

    res.json({ message: 'User deleted successfully' });
};

export const updateUser = async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const { name, email, role, isActive } = req.body;

    const user = await userService.update(id, {
        name,
        email,
        role,
        isActive
    });

    // Audit log
    await logAudit({ userId: req.user?.id || 'unknown', actionType: 'UPDATE', entityType: 'USER', entityId: id, details: JSON.stringify({ name, email, role, isActive }), req });

    res.json(user);
};
