import { Response } from 'express';
import { z } from 'zod';
import { AuthRequest } from '../middleware/auth';
import { userService } from '../services/UserService';
import { NotFoundError } from '../errors/AppError';
import { logAudit, generateAuditDiff } from '../services/auditService';

const updateUserSchema = z.object({
    name: z.string().min(2).max(100).optional(),
    email: z.string().email().optional(),
    role: z.string().optional(),
    isActive: z.boolean().optional(),
});

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
    const { name, email, role, isActive } = updateUserSchema.parse(req.body);

    const existingUser = await userService.findById(id);

    const user = await userService.update(id, {
        name,
        email,
        role,
        isActive
    });

    const changes = generateAuditDiff(existingUser as unknown as Record<string, unknown>, user as unknown as Record<string, unknown>);
    if (changes !== 'No changes detected') {
        await logAudit({
            userId: req.user?.id || 'unknown',
            actionType: 'UPDATE',
            entityType: 'USER',
            entityId: id,
            details: changes,
            req
        });
    }

    res.json(user);
};

const changePasswordSchema = z.object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string().min(8, 'New password must be at least 8 characters'),
});

export const changePassword = async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
        return res.status(401).json({ error: 'Not authenticated' });
    }

    const { currentPassword, newPassword } = changePasswordSchema.parse(req.body);

    await userService.changePassword(userId, currentPassword, newPassword);

    // Audit log
    await logAudit({
        userId,
        actionType: 'UPDATE',
        entityType: 'USER',
        entityId: userId,
        details: 'Password changed',
        req
    });

    res.json({ message: 'Password changed successfully' });
};
