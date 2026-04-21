export interface IRoleRepository {
    findRoles(): Promise<any[]>;
    findPermissions(): Promise<any[]>;
    createRole(data: { name: string; description?: string; permissionIds: string[]; incidentScope?: string }): Promise<any>;
    findRoleById(id: string): Promise<any | null>;
    findRoleWithUsage(id: string): Promise<any | null>;
    updateRole(id: string, data: { name?: string; description?: string | null; permissionIds: string[]; incidentScope?: string }): Promise<any>;
    replaceRolePermissions(id: string, permissionIds: string[]): Promise<any>;
    deleteRole(id: string): Promise<any>;
}
