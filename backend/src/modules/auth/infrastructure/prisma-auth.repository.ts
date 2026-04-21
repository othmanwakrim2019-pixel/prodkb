import { prisma } from '../../../common/utils/prisma';
import { IAuthRepository, IRoleRepository } from '../domain/auth.repository';
import { User, Role, Team, RefreshToken } from '@prisma/client';

const authUserInclude = {
    role: {
        include: {
            permissions: { select: { code: true } },
        },
    },
} as const;

export class PrismaAuthRepository implements IAuthRepository, IRoleRepository {
    async findUserByEmail(email: string): Promise<User | null> {
        return prisma.user.findUnique({ where: { email } });
    }

    async findRoleByName(name: string): Promise<Role | null> {
        return prisma.role.findUnique({ where: { name } });
    }

    async findTeamById(id: string): Promise<Team | null> {
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

export const authRepository = new PrismaAuthRepository();
// Since IRoleRepository is also implemented here, we can export it as roleRepository if needed,
// but for now let's stick to what's requested.
export const roleRepository = authRepository;
