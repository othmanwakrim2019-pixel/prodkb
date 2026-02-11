import { Request, Response } from 'express';
import { prisma } from '../utils/prisma';
import { z } from 'zod';
import { logger } from '../utils/logger';

// Validation schemas
const createSLASchema = z.object({
    name: z.string().min(2).max(100),
    description: z.string().max(500).optional(),
    severity: z.enum(['Critical', 'High', 'Medium', 'Low']),
    acknowledgeTimeMinutes: z.number().int().min(1),
    resolveTimeMinutes: z.number().int().min(1),
});

const updateSLASchema = z.object({
    name: z.string().min(2).max(100).optional(),
    description: z.string().max(500).optional().nullable(),
    severity: z.enum(['Critical', 'High', 'Medium', 'Low']).optional(),
    acknowledgeTimeMinutes: z.number().int().min(1).optional(),
    resolveTimeMinutes: z.number().int().min(1).optional(),
    isActive: z.boolean().optional(),
});

export const createSLA = async (req: Request, res: Response) => {
    try {
        const data = createSLASchema.parse(req.body);

        const sla = await prisma.sLA.create({
            data,
        });

        res.status(201).json(sla);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: 'Invalid input', details: error.issues });
        }
        logger.error('Error creating SLA:', error);
        res.status(500).json({ error: 'Failed to create SLA' });
    }
};

export const listSLAs = async (req: Request, res: Response) => {
    try {
        const slas = await prisma.sLA.findMany({
            include: {
                _count: {
                    select: {
                        incidents: true,
                    },
                },
            },
            orderBy: [
                { severity: 'asc' },
                { name: 'asc' },
            ],
        });

        res.json(slas);
    } catch (error) {
        logger.error('Error listing SLAs:', error);
        res.status(500).json({ error: 'Failed to list SLAs' });
    }
};

export const getSLA = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const sla = await prisma.sLA.findUnique({
            where: { id },
            include: {
                _count: {
                    select: {
                        incidents: true,
                    },
                },
            },
        });

        if (!sla) {
            return res.status(404).json({ error: 'SLA not found' });
        }

        res.json(sla);
    } catch (error) {
        logger.error('Error getting SLA:', error);
        res.status(500).json({ error: 'Failed to get SLA' });
    }
};

export const updateSLA = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const data = updateSLASchema.parse(req.body);

        const sla = await prisma.sLA.update({
            where: { id },
            data,
        });

        res.json(sla);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: 'Invalid input', details: error.issues });
        }
        logger.error('Error updating SLA:', error);
        res.status(500).json({ error: 'Failed to update SLA' });
    }
};

export const deleteSLA = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        await prisma.sLA.delete({
            where: { id },
        });

        res.status(204).send();
    } catch (error) {
        logger.error('Error deleting SLA:', error);
        res.status(500).json({ error: 'Failed to delete SLA' });
    }
};
