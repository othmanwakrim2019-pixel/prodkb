import { Request, Response } from 'express';
import { prisma } from '../utils/prisma';
import { z } from 'zod';
import { logAudit, generateAuditDiff } from '../services/auditService';
import { AuthRequest } from '../middleware/auth';
import { logger } from '../utils/logger';

// Validation schemas
const createTeamSchema = z.object({
    name: z.string().min(2).max(100),
    description: z.string().max(500).optional(),
    emailDistribution: z.string().email(), // Single team email
    sendEmail: z.boolean().optional(),
});

const updateTeamSchema = z.object({
    name: z.string().min(2).max(100).optional(),
    description: z.string().max(500).optional().nullable(),
    emailDistribution: z.string().email().optional(), // Single team email
    isActive: z.boolean().optional(),
    sendEmail: z.boolean().optional(),
});

const addMemberSchema = z.object({
    userId: z.string().uuid(),
    role: z.string().min(1).max(50),
});

export const createTeam = async (req: AuthRequest, res: Response) => {
    try {
        const data = createTeamSchema.parse(req.body);
        const userId = req.user?.id;

        const team = await prisma.team.create({
            data,
            include: {
                members: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                                role: true,
                            },
                        },
                    },
                },
            },
        });

        // Audit log
        if (userId) {
            await logAudit({
                userId,
                actionType: 'CREATE',
                entityType: 'TEAM',
                entityId: team.id,
                details: `Created team: ${team.name}`,
                req
            });
        }

        res.status(201).json(team);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: 'Invalid input', details: error.issues });
        }
        logger.error('Error creating team:', error);
        res.status(500).json({ error: 'Failed to create team' });
    }
};

export const listTeams = async (req: Request, res: Response) => {
    try {
        const teams = await prisma.team.findMany({
            include: {
                members: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                                role: true,
                            },
                        },
                    },
                },
                jobs: {
                    select: {
                        systemId: true,
                        system: {
                            select: {
                                id: true,
                                name: true,
                            },
                        },
                    },
                },
                _count: {
                    select: {
                        jobs: true,
                        incidents: true,
                    },
                },
            },
            orderBy: {
                name: 'asc',
            },
        });

        // Calculate unique system count per team
        const teamsWithSystemCount = teams.map(team => {
            const uniqueSystemIds = new Set(team.jobs.map(j => j.systemId));
            return {
                ...team,
                systemCount: uniqueSystemIds.size,
                systems: Array.from(uniqueSystemIds).map(sysId =>
                    team.jobs.find(j => j.systemId === sysId)?.system
                ).filter(Boolean),
            };
        });

        res.json(teamsWithSystemCount);
    } catch (error) {
        logger.error('Error listing teams:', error);
        res.status(500).json({ error: 'Failed to list teams' });
    }
};

export const getTeam = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const team = await prisma.team.findUnique({
            where: { id },
            include: {
                members: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                                role: true,
                            },
                        },
                    },
                },
                jobs: {
                    include: {
                        system: true,
                    },
                },
                _count: {
                    select: {
                        incidents: true,
                    },
                },
            },
        });

        if (!team) {
            return res.status(404).json({ error: 'Team not found' });
        }

        res.json(team);
    } catch (error) {
        logger.error('Error getting team:', error);
        res.status(500).json({ error: 'Failed to get team' });
    }
};

export const updateTeam = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const userId = req.user?.id;
        logger.debug('Update team request', { id, body: req.body });
        const data = updateTeamSchema.parse(req.body);

        const existingTeam = await prisma.team.findUnique({
            where: { id }
        });

        const team = await prisma.team.update({
            where: { id },
            data,
            include: {
                members: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                                role: true,
                            },
                        },
                    },
                },
            },
        });

        // Audit log
        if (userId) {
            const changes = generateAuditDiff(existingTeam, team);
            if (changes !== 'No changes detected') {
                await logAudit({
                    userId,
                    actionType: 'UPDATE',
                    entityType: 'TEAM',
                    entityId: team.id,
                    details: changes,
                    req
                });
            }
        }

        res.json(team);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: 'Invalid input', details: error.issues });
        }
        logger.error('Error updating team:', error);
        res.status(500).json({ error: 'Failed to update team' });
    }
};

export const deleteTeam = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const userId = req.user?.id;

        // Get team name before deleting for audit
        const teamToDelete = await prisma.team.findUnique({ where: { id } });

        await prisma.team.delete({
            where: { id },
        });

        // Audit log
        if (userId && teamToDelete) {
            await logAudit({
                userId,
                actionType: 'DELETE',
                entityType: 'TEAM',
                entityId: id,
                details: `Deleted team: ${teamToDelete.name}`,
                req
            });
        }

        res.status(204).send();
    } catch (error) {
        logger.error('Error deleting team:', error);
        res.status(500).json({ error: 'Failed to delete team' });
    }
};

export const addTeamMember = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const data = addMemberSchema.parse(req.body);

        const member = await prisma.teamMember.create({
            data: {
                teamId: id,
                userId: data.userId,
                role: data.role,
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        role: true,
                    },
                },
            },
        });

        res.status(201).json(member);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: 'Invalid input', details: error.issues });
        }
        logger.error('Error adding team member:', error);
        res.status(500).json({ error: 'Failed to add team member' });
    }
};

export const removeTeamMember = async (req: Request, res: Response) => {
    try {
        const { id, userId } = req.params;

        await prisma.teamMember.delete({
            where: {
                teamId_userId: {
                    teamId: id,
                    userId,
                },
            },
        });

        res.status(204).send();
    } catch (error) {
        logger.error('Error removing team member:', error);
        res.status(500).json({ error: 'Failed to remove team member' });
    }
};
