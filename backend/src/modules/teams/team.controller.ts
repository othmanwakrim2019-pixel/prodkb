
import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { teamService } from './team.service';
import { AuthRequest } from '../../common/middleware/auth.middleware';
import { createResponse } from '../../common/types/api.response';
import { logAudit, generateAuditDiff } from '../audit/audit.service';
import { prisma } from '../../common/utils/prisma';


const createTeamSchema = z.object({
    name: z.string().min(2).max(100),
    description: z.string().max(500).optional(),
    emailDistribution: z.string().email(),
    sendEmail: z.boolean().optional(),
});

const updateTeamSchema = z.object({
    name: z.string().min(2).max(100).optional(),
    description: z.string().max(500).optional().nullable(),
    emailDistribution: z.string().email().optional(),
    isActive: z.boolean().optional(),
    sendEmail: z.boolean().optional(),
});

const addMemberSchema = z.object({
    userId: z.string().uuid(),
    role: z.string().min(1).max(50),
});

export class TeamController {
    static async createTeam(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const data = createTeamSchema.parse(req.body);
            const team = await teamService.create(data);

            if (req.user?.id) {
                await logAudit({
                    userId: req.user.id,
                    actionType: 'CREATE',
                    entityType: 'TEAM',
                    entityId: team.id,
                    details: `Created team: ${team.name}`,
                    req
                });
            }

            res.status(201).json(createResponse(true, team, 'Team created successfully'));
        } catch (error) {
            next(error);
        }
    }

    static async listTeams(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await teamService.findAll();

            // Calculate system counts (presentation logic stays in controller)
            const teamsWithSystemCount = result.data.map((team: any) => {
                const uniqueSystemIds = new Set(team.jobs.map((j: any) => j.systemId));
                return {
                    ...team,
                    systemCount: uniqueSystemIds.size,
                    systems: Array.from(uniqueSystemIds).map(sysId =>
                        team.jobs.find((j: any) => j.systemId === sysId)?.system
                    ).filter(Boolean),
                };
            });

            res.json(createResponse(true, {
                ...result,
                data: teamsWithSystemCount,
            }));
        } catch (error) {
            next(error);
        }
    }

    static async getTeam(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const team = await teamService.findById(id);
            res.json(createResponse(true, team));
        } catch (error) {
            next(error);
        }
    }

    static async updateTeam(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const data = updateTeamSchema.parse(req.body);

            // Get existing for audit
            const existingTeam = await teamService.findById(id);

            const updatedTeam = await teamService.update(id, data);

            if (req.user?.id) {
                const changes = generateAuditDiff(existingTeam, updatedTeam);
                if (changes !== 'No changes detected') {
                    await logAudit({
                        userId: req.user.id,
                        actionType: 'UPDATE',
                        entityType: 'TEAM',
                        entityId: id,
                        details: changes,
                        req
                    });
                }
            }

            res.json(createResponse(true, updatedTeam, 'Team updated successfully'));
        } catch (error) {
            next(error);
        }
    }

    static async deleteTeam(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const teamToDelete = await teamService.findById(id); // Ensure exists and get name

            await teamService.delete(id);

            if (req.user?.id) {
                await logAudit({
                    userId: req.user.id,
                    actionType: 'DELETE',
                    entityType: 'TEAM',
                    entityId: id,
                    details: `Deleted team: ${teamToDelete.name}`,
                    req
                });
            }

            res.json(createResponse(true, null, 'Team deleted successfully'));
        } catch (error) {
            next(error);
        }
    }

    static async addMember(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const { userId, role } = addMemberSchema.parse(req.body);
            const member = await teamService.addMember(id, userId, role);
            res.status(201).json(createResponse(true, member, 'Member added successfully'));
        } catch (error) {
            next(error);
        }
    }

    static async removeMember(req: Request, res: Response, next: NextFunction) {
        try {
            const { id, userId } = req.params;
            await teamService.removeMember(id, userId);
            res.json(createResponse(true, null, 'Member removed successfully'));
        } catch (error) {
            next(error);
        }
    }
}
