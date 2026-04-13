import { prisma } from '../../../common/utils/prisma';

const authUserInclude = {
    role: {
        include: {
            permissions: { select: { code: true } },
        },
    },
} as const;

export class AuthRepository {
    async findUserByEmail(email: string) {
        return prisma.user.findUnique({ where: { email } });
    }

    async findRoleByName(name: string) {
        return prisma.role.findUnique({ where: { name } });
    }

    async findTeamById(id: string) {
        return prisma.team.findUnique({ where: { id } });
    }

    async createUserWithOptionalTeam(data: {
        name: string;
        email: string;
        password: string;
        roleId: string | null;
        isActive: boolean;
        teamId?: string;
        teamRole?: string;
    }) {
        return prisma.$transaction(async (tx) => {
            const user = await tx.user.create({
                data: {
                    name: data.name,
                    email: data.email,
                    password: data.password,
                    roleId: data.roleId,
                    isActive: data.isActive,
                },
                include: {
                    role: { select: { id: true, name: true } },
                },
            });

            if (data.teamId) {
                await tx.teamMember.create({
                    data: {
                        userId: user.id,
                        teamId: data.teamId,
                        role: data.teamRole || 'MEMBER',
                    },
                });
            }

            return user;
        });
    }

    async findUserForLogin(email: string) {
        return prisma.user.findUnique({
            where: { email },
            include: authUserInclude,
        });
    }

    async createRefreshToken(token: string, userId: string, expiresAt: Date) {
        return prisma.refreshToken.create({
            data: { token, userId, expiresAt },
        });
    }

    async findRefreshToken(token: string) {
        return prisma.refreshToken.findUnique({
            where: { token },
            include: {
                user: {
                    include: authUserInclude,
                },
            },
        });
    }

    async revokeRefreshTokenById(id: string) {
        return prisma.refreshToken.update({
            where: { id },
            data: { revokedAt: new Date() },
        });
    }

    async revokeRefreshTokenValue(token: string) {
        return prisma.refreshToken.updateMany({
            where: { token, revokedAt: null },
            data: { revokedAt: new Date() },
        });
    }

    async revokeAllRefreshTokensForUser(userId: string) {
        return prisma.refreshToken.updateMany({
            where: { userId, revokedAt: null },
            data: { revokedAt: new Date() },
        });
    }

    async deleteExpiredOrRevokedRefreshTokens() {
        return prisma.refreshToken.deleteMany({
            where: {
                OR: [
                    { expiresAt: { lt: new Date() } },
                    { revokedAt: { not: null } },
                ],
            },
        });
    }
}

export const authRepository = new AuthRepository();
