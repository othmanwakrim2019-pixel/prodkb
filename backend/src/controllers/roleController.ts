import { Request, Response } from 'express';
import { prisma } from '../utils/prisma';

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

export const createRole = async (req: Request, res: Response) => {
    const { name, description, permissionIds } = req.body;
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
        res.status(201).json(role);
    } catch (error) {
        res.status(400).json({ error: 'Failed to create role' });
    }
};

export const updateRole = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { name, description, permissionIds } = req.body;
    try {
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
        res.json(role);
    } catch (error) {
        res.status(400).json({ error: 'Failed to update role' });
    }
};

export const deleteRole = async (req: Request, res: Response) => {
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
        res.json({ message: 'Role deleted' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete role' });
    }
};
