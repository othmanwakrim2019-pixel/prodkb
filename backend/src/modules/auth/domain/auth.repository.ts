import { User, Role, Team, RefreshToken } from '@prisma/client';

export interface IAuthRepository {
    findUserByEmail(email: string): Promise<User | null>;
    findTeamById(id: string): Promise<Team | null>;
    createUserWithOptionalTeam(data: {
        name: string;
        email: string;
        password: string;
        roleId: string | null;
        isActive: boolean;
        teamId?: string;
        teamRole?: string;
    }): Promise<User & { role: { id: string; name: string } | null }>;
    findUserForLogin(email: string): Promise<any>; // Using any for now due to complex include
    createRefreshToken(token: string, userId: string, expiresAt: Date): Promise<RefreshToken>;
    findRefreshToken(token: string): Promise<any>; // Using any for now due to complex include
    revokeRefreshTokenById(id: string): Promise<RefreshToken>;
    revokeRefreshTokenValue(token: string): Promise<{ count: number }>;
    revokeAllRefreshTokensForUser(userId: string): Promise<{ count: number }>;
    deleteExpiredOrRevokedRefreshTokens(): Promise<{ count: number }>;
}

export interface IRoleRepository {
    findRoleByName(name: string): Promise<Role | null>;
}
