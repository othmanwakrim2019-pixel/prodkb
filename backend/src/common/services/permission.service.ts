
import { PrismaClient } from '@prisma/client';
import { AppError } from '../errors/app.error';

// This simple service allows checking permissions imperatively
// without relying on Express middleware.
export class PermissionService {
    constructor(private prisma: PrismaClient) { }

    /**
     * Check if a user has a specific permission code.
     * @param userId User ID
     * @param permissionCode Permission code (e.g. 'INCIDENT_VIEW')
     */
    async hasPermission(userId: string, permissionCode: string): Promise<boolean> {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            include: {
                role: {
                    include: { permissions: true }
                }
            }
        });

        if (!user || !user.role) return false;

        return user.role.permissions.some(p => p.code === permissionCode);
    }

    /**
     * Throw error if user lacks permission.
     */
    async requirePermission(userId: string, permissionCode: string): Promise<void> {
        const has = await this.hasPermission(userId, permissionCode);
        if (!has) {
            throw new AppError(`Missing permission: ${permissionCode}`, 403, 'FORBIDDEN');
        }
    }
}
