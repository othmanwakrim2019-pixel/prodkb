import { Request, Response } from 'express';
import { prisma } from '../utils/prisma';
import { AuthRequest } from '../middleware/auth';

export const getProcedures = async (req: Request, res: Response) => {
    const { search } = req.query;

    const where: any = {};
    if (search) {
        where.OR = [
            { title: { contains: String(search) } }, // Removed mode: 'insensitive' for SQLite compatibility if needed, but Prisma usually handles it. 
            // Note: SQLite default collation is case-insensitive for ASCII, but contains is case-sensitive.
            // For proper case-insensitive search in SQLite/Postgres via Prisma, we usually use mode: 'insensitive'.
            // I'll add it assuming we might use Postgres later or acceptable for now.
            { description: { contains: String(search) } },
            { errorCode: { contains: String(search) } },
            { tags: { contains: String(search) } },
        ];
    }

    try {
        const procedures = await prisma.procedure.findMany({
            where,
            include: {
                system: true,
                job: true,
                _count: { select: { incidents: true } },
            },
        });
        res.json(procedures);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch procedures' });
    }
};

export const getProcedureById = async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        const procedure = await prisma.procedure.findUnique({
            where: { id },
            include: {
                system: true,
                job: true,
                incidents: {
                    select: { id: true, title: true, status: true, createdAt: true },
                },
                createdBy: { select: { name: true } },
            },
        });
        if (!procedure) {
            res.status(404).json({ error: 'Procedure not found' });
            return;
        }
        res.json(procedure);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch procedure' });
    }
};

export const createProcedure = async (req: AuthRequest, res: Response) => {
    const { title, description, rootCause, resolutionSteps, workaround, commands, errorCode, tags, systemId, jobId } = req.body;
    const userId = req.user?.id;

    if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
    }

    try {
        const procedure = await prisma.procedure.create({
            data: {
                title,
                description,
                rootCause,
                resolutionSteps,
                workaround,
                commands,
                errorCode,
                tags,
                systemId,
                jobId,
                createdById: userId,
            },
        });
        res.status(201).json(procedure);
    } catch (error) {
        res.status(400).json({ error: 'Failed to create procedure', details: error });
    }
};

export const updateProcedure = async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const data = req.body;
    const userId = req.user?.id;

    try {
        const procedure = await prisma.procedure.update({
            where: { id },
            data: {
                ...data,
                updatedById: userId,
            },
        });
        res.json(procedure);
    } catch (error) {
        // ... (previous)
        res.status(400).json({ error: 'Failed to update procedure' });
    }
};

export const deleteProcedure = async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    try {
        await prisma.procedure.delete({
            where: { id }
        });
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete procedure' });
    }
};
