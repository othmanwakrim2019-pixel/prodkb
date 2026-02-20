
import { Request, Response, NextFunction } from 'express';
import { roleService } from './role.service';
import { AuthRequest } from '../../common/middleware/auth.middleware';
import { createResponse } from '../../common/types/api.response';
import { logAudit, generateAuditDiff } from '../audit/audit.service';
import { createRoleSchema, updateRoleSchema } from './role.schema';


export class RoleController {
    static async getAllRoles(req: Request, res: Response, next: NextFunction) {
        try {
            const roles = await roleService.findAllRoles();
            res.json(createResponse(true, roles));
        } catch (error) {
            next(error);
        }
    }

    static async getAllPermissions(req: Request, res: Response, next: NextFunction) {
        try {
            const perms = await roleService.findAllPermissions();
            res.json(createResponse(true, perms));
        } catch (error) {
            next(error);
        }
    }

    static async createRole(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const data = createRoleSchema.parse(req.body);
            const role = await roleService.createRole(data);

            await logAudit({
                userId: req.user?.id || 'unknown',
                actionType: 'CREATE',
                entityType: 'ROLE',
                entityId: role.id,
                details: JSON.stringify({ name: data.name, description: data.description, permissionCount: data.permissionIds.length }),
                req
            });

            res.status(201).json(createResponse(true, role, 'Role created successfully'));
        } catch (error) {
            next(error);
        }
    }

    static async updateRole(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const data = updateRoleSchema.parse(req.body);

            const existing = await roleService.findRoleById(id);
            const updated = await roleService.updateRole(id, data);

            const changes = generateAuditDiff(existing, updated);
            if (changes !== 'No changes detected') {
                await logAudit({
                    userId: req.user?.id || 'unknown',
                    actionType: 'UPDATE',
                    entityType: 'ROLE',
                    entityId: id,
                    details: changes,
                    req
                });
            }

            res.json(createResponse(true, updated, 'Role updated successfully'));
        } catch (error) {
            next(error);
        }
    }

    static async deleteRole(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const role = await roleService.deleteRole(id);

            await logAudit({
                userId: req.user?.id || 'unknown',
                actionType: 'DELETE',
                entityType: 'ROLE',
                entityId: id,
                details: JSON.stringify({ roleName: role.name }),
                req
            });

            res.json(createResponse(true, null, 'Role deleted successfully'));
        } catch (error) {
            next(error);
        }
    }
}
