import { Prisma } from '@prisma/client';

export interface IUserRepository {
    findAllUsers(): Promise<any[]>;
    findAllUsersDetailed(): Promise<any[]>;
    findUserById(id: string): Promise<any | null>;
    findRoleByName(name: string): Promise<any | null>;
    updateUser(id: string, data: Prisma.UserUncheckedUpdateInput): Promise<any>;
    findUserWithUsage(id: string): Promise<any | null>;
    deleteUser(id: string): Promise<any>;
    findUserCredentials(id: string): Promise<any | null>;
    updateUserPassword(id: string, password: string): Promise<any>;
    findUserWithPermissions(id: string): Promise<any | null>;
}
