import { prisma } from '../../../common/utils/prisma';
import { ITeamRepository, TeamPaginationParams } from '../domain/team.repository';

const teamMemberInclude = {
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
} as const;

export class PrismaTeamRepository implements ITeamRepository {
    async createTeam(data: { name: string; description?: string; emailDistribution: string; sendEmail?: boolean }) {
        return prisma.team.create({
            data,
            include: teamMemberInclude,
        });
    }

    async findTeams(pagination: TeamPaginationParams = {}) {
        const { page = 1, limit = 100, sortBy = 'name', sortOrder = 'asc' } = pagination;
        const skip = (page - 1) * limit;

        const [data, total] = await Promise.all([
            prisma.team.findMany({
                include: {
                    ...teamMemberInclude,
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

    async findTeamById(id: string) {
        return prisma.team.findUnique({
            where: { id },
            include: {
                ...teamMemberInclude,
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
    }

    async updateTeam(
        id: string,
        data: { name?: string; description?: string | null; emailDistribution?: string; isActive?: boolean; sendEmail?: boolean }
    ) {
        return prisma.team.update({
            where: { id },
            data,
            include: teamMemberInclude,
        });
    }

    async findTeamWithUsage(id: string) {
        return prisma.team.findUnique({
            where: { id },
            include: {
                _count: {
                    select: { members: true, incidents: true, jobs: true },
                },
            },
        });
    }

    async deleteTeam(id: string) {
        return prisma.team.delete({ where: { id } });
    }

    async createTeamMember(teamId: string, userId: string, role: string) {
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

    async deleteTeamMember(teamId: string, userId: string) {
        return prisma.teamMember.delete({
            where: {
                teamId_userId: {
                    teamId,
                    userId,
                },
            },
        });
    }
}

export const teamRepository = new PrismaTeamRepository();
