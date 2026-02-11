import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../utils/prisma';
import { logAudit } from '../services/auditService';
import { AuthRequest } from '../middleware/auth';

const createRoleSchema = z.object({
    name: z.string().min(2).max(50),
    description: z.string().max(500).optional(),
    permissionIds: z.array(z.string().uuid()).min(1),
});

const updateRoleSchema = z.object({
    name: z.string().min(2).max(50).optional(),
    description: z.string().max(500).optional().nullable(),
    permissionIds: z.array(z.string().uuid()).min(1),
});

export const getAllRoles = async (req: Request, res: Response) => {
    try {
        const roles = await prisma.role.findMany({
            include: {
                permissions: true,
                _count: { select: { users: true } }
            },
            orderBy: { name: 'asc' }
        });
        res.json(roles);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch roles' });
    }
};

export const getAllPermissions = async (req: Request, res: Response) => {
    try {
        const perms = await prisma.permission.findMany({
            orderBy: { code: 'asc' }
        });
        res.json(perms);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch permissions' });
    }
};

export const createRole = async (req: AuthRequest, res: Response) => {
    const { name, description, permissionIds } = createRoleSchema.parse(req.body);
    try {
        const role = await prisma.role.create({
            data: {
                name,
                description,
                permissions: {
                    connect: permissionIds.map((id: string) => ({ id }))
                }
            },
            include: { permissions: true }
        });

        // Audit log
        await logAudit({ userId: req.user?.id || 'unknown', actionType: 'CREATE', entityType: 'ROLE', entityId: role.id, details: JSON.stringify({ name, description, permissionCount: permissionIds.length }), req });

        res.status(201).json(role);
    } catch (error) {
        res.status(400).json({ error: 'Failed to create role' });
    }
};

export const updateRole = async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const { name, description, permissionIds } = updateRoleSchema.parse(req.body);
    try {
        // Prevent modifying ADMIN role
        const currentRole = await prisma.role.findUnique({ where: { id } });
        if (currentRole?.name === 'ADMIN') {
            return res.status(403).json({ error: 'Cannot modify ADMIN role' });
        }

        const role = await prisma.role.update({
            where: { id },
            data: {
                name,
                description,
                permissions: {
                    set: [], // Clear distinct
                    connect: permissionIds.map((pid: string) => ({ id: pid }))
                }
            },
            include: { permissions: true }
        });

        // Audit log
        await logAudit({ userId: req.user?.id || 'unknown', actionType: 'UPDATE', entityType: 'ROLE', entityId: id, details: JSON.stringify({ name, description, permissionCount: permissionIds.length }), req });

        res.json(role);
    } catch (error) {
        res.status(400).json({ error: 'Failed to update role' });
    }
};

export const deleteRole = async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    try {
        // Prevent deleting admin role if likely
        const role = await prisma.role.findUnique({ where: { id }, include: { _count: { select: { users: true } } } });
        if (role?.name === 'ADMIN') {
            return res.status(400).json({ error: 'Cannot delete ADMIN role' });
        }
        if (role && role._count.users > 0) {
            return res.status(400).json({ error: 'Cannot delete role assigned to users' });
        }

        await prisma.role.delete({ where: { id } });

        // Audit log
        await logAudit({ userId: req.user?.id || 'unknown', actionType: 'DELETE', entityType: 'ROLE', entityId: id, details: JSON.stringify({ roleName: role?.name }), req });

        res.json({ message: 'Role deleted' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete role' });
    }
};
