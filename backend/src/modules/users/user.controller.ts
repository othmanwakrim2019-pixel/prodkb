
import { Request, Response, NextFunction } from 'express';
import { userService } from './user.service';
import { AuthRequest } from '../../common/middleware/auth.middleware';
import { createResponse } from '../../common/types/api.response';
import { generateAuditDiff, logAudit } from '../audit/audit.service';
import { updateUserSchema, changePasswordSchema } from './user.schema';


export class UserController {
    static async getAllUsers(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const users = await userService.findAllDetailed();
            res.json(createResponse(true, users));
        } catch (error) {
            next(error);
        }
    }

    static async deleteUser(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            await userService.delete(id);

            // Audit
            await logAudit({
                userId: req.user?.id || 'unknown',
                actionType: 'DELETE',
                entityType: 'USER',
                entityId: id,
                details: JSON.stringify({ deletedUserId: id }),
                req
            });

            res.json(createResponse(true, null, 'User deleted successfully'));
        } catch (error) {
            next(error);
        }
    }

    static async updateUser(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const updates = updateUserSchema.parse(req.body);

            const existingUser = await userService.findById(id);
            const updatedUser = await userService.update(id, updates);

            // Audit
            const changes = generateAuditDiff(
                existingUser as unknown as Record<string, unknown>,
                updatedUser as unknown as Record<string, unknown>,
            );
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

            res.json(createResponse(true, updatedUser, 'User updated successfully'));
        } catch (error) {
            next(error);
        }
    }

    static async changePassword(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json(createResponse(false, null, 'Not authenticated'));
            }

            const { currentPassword, newPassword } = changePasswordSchema.parse(req.body);
            await userService.changePassword(userId, currentPassword, newPassword);

            // Audit
            await logAudit({
                userId,
                actionType: 'UPDATE',
                entityType: 'USER',
                entityId: userId,
                details: 'Password changed',
                req
            });

            res.json(createResponse(true, null, 'Password changed successfully'));
        } catch (error) {
            next(error);
        }
    }

    static async adminResetPassword(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const { newPassword } = req.body;

            if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 8) {
                return res.status(400).json(createResponse(false, null, 'New password must be at least 8 characters'));
            }

            await userService.adminResetPassword(id, newPassword);

            // Audit
            await logAudit({
                userId: req.user?.id || 'unknown',
                actionType: 'UPDATE',
                entityType: 'USER',
                entityId: id,
                details: 'Admin reset password',
                req
            });

            res.json(createResponse(true, null, 'Password has been reset successfully'));
        } catch (error) {
            next(error);
        }
    }
}
