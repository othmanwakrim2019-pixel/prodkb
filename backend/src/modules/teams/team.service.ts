
import { prisma } from '../../common/utils/prisma';
import { logger } from '../../common/utils/logger';
import { NotFoundError, ValidationError } from '../../common/errors/app.error';

export interface TeamPaginationParams {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}

export class TeamService {
    async create(data: { name: string; description?: string; emailDistribution: string; sendEmail?: boolean }) {
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
        return team;
    }

    async findAll(pagination: TeamPaginationParams = {}) {
        const { page = 1, limit = 100, sortBy = 'name', sortOrder = 'asc' } = pagination;
        const skip = (page - 1) * limit;

        const [data, total] = await Promise.all([
            prisma.team.findMany({
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
                skip,
                take: limit,
                orderBy: {
                    [sortBy]: sortOrder,
                },
            }),
            prisma.team.count(),
        ]);

        return {
            data,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }

    async findById(id: string) {
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

        if (!team) throw new NotFoundError('Team not found');
        return team;
    }

    async update(id: string, data: { name?: string; description?: string | null; emailDistribution?: string; isActive?: boolean; sendEmail?: boolean }) {
        await this.findById(id); // Ensure exists

        return prisma.team.update({
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
    }

    async delete(id: string) {
        await this.findById(id); // Ensure exists
        await prisma.team.delete({ where: { id } });
    }

    async addMember(teamId: string, userId: string, role: string) {
        await this.findById(teamId); // Ensure team exists

        // Check if user exists (optional but good)
        // Check if already member (Prisma unique constraint usually handles this but validation is nice)

        return prisma.teamMember.create({
            data: {
                teamId,
                userId,
                role,
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
    }

    async removeMember(teamId: string, userId: string) {
        // Only checking team existence might be enough, or let prisma throw record not found
        try {
            await prisma.teamMember.delete({
                where: {
                    teamId_userId: {
                        teamId,
                        userId,
                    },
                },
            });
        } catch (error) {
            // Check P2025 (Record to delete does not exist) if strict, else ignore or throw Not Found
            throw new NotFoundError('Team member not found');
        }
    }
}

export const teamService = new TeamService();
