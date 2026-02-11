/**
 * Team Service - Business logic for team management
 * @module services/TeamService
 */

import { prisma } from '../utils/prisma';
import { logger } from '../utils/logger';
import { ConflictError, NotFoundError, ValidationError } from '../errors/AppError';
import type { ITeam } from '../types';

/**
 * Create team DTO
 */
interface CreateTeamDTO {
    name: string;
    description?: string;
    emailDistribution: string;
    sendEmail?: boolean;
}

/**
 * Update team DTO
 */
interface UpdateTeamDTO {
    name?: string;
    description?: string;
    emailDistribution?: string;
    sendEmail?: boolean;
}

/**
 * Service class for team-related business logic
 */
export class TeamService {
    /**
     * Get all teams
     */
    async findAll(): Promise<ITeam[]> {
        const teams = await prisma.team.findMany({
            include: {
                jobs: true,
                _count: { select: { incidents: true } },
            },
            orderBy: { name: 'asc' },
        });

        logger.debug('Fetched teams', { count: teams.length });

        return teams as unknown as ITeam[];
    }

    /**
     * Get a team by ID
     * @param id - Team ID
     */
    async findById(id: string): Promise<ITeam> {
        const team = await prisma.team.findUnique({
            where: { id },
            include: {
                jobs: true,
                members: {
                    include: {
                        user: { select: { id: true, name: true, email: true } },
                    },
                },
            },
        });

        if (!team) {
            throw new NotFoundError('Team');
        }

        return team as unknown as ITeam;
    }

    /**
     * Create a new team
     * @param data - Team creation data
     */
    async create(data: CreateTeamDTO): Promise<ITeam> {
        // Check for duplicate name
        const existing = await prisma.team.findUnique({ where: { name: data.name } });
        if (existing) {
            throw new ConflictError(`Team "${data.name}" already exists`);
        }

        // Validate email format
        if (data.emailDistribution && !this.isValidEmail(data.emailDistribution)) {
            throw new ValidationError('Invalid email distribution format');
        }

        const team = await prisma.team.create({
            data: {
                name: data.name,
                description: data.description || null,
                emailDistribution: data.emailDistribution,
                sendEmail: data.sendEmail ?? true,
            },
        });

        logger.info('Team created', { teamId: team.id, name: data.name });

        return team as unknown as ITeam;
    }

    /**
     * Update a team
     * @param id - Team ID
     * @param data - Update data
     */
    async update(id: string, data: UpdateTeamDTO): Promise<ITeam> {
        await this.findById(id); // Throws if not found

        // Check for name conflict
        if (data.name) {
            const existing = await prisma.team.findFirst({
                where: { name: data.name, id: { not: id } },
            });
            if (existing) {
                throw new ConflictError(`Team "${data.name}" already exists`);
            }
        }

        const team = await prisma.team.update({
            where: { id },
            data,
        });

        logger.info('Team updated', { teamId: id, changes: Object.keys(data) });

        return team as unknown as ITeam;
    }

    /**
     * Delete a team
     * @param id - Team ID
     */
    async delete(id: string): Promise<void> {
        await this.findById(id); // Throws if not found

        await prisma.team.delete({ where: { id } });

        logger.info('Team deleted', { teamId: id });
    }

    /**
     * Validate email format
     */
    private isValidEmail(email: string): boolean {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }
}

// Export singleton instance
export const teamService = new TeamService();
