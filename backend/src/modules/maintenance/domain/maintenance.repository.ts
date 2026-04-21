export interface IMaintenanceRepository {
    findMaintenanceWindows(systemId?: string): Promise<any[]>;
    findActiveMaintenanceWindows(now: Date): Promise<any[]>;
    findMaintenanceWindowById(id: string): Promise<any | null>;
    createMaintenanceWindow(data: any): Promise<any>;
    updateMaintenanceWindow(id: string, data: any): Promise<any>;
    deleteMaintenanceWindow(id: string): Promise<any>;
    completeFinishedMaintenance(now: Date): Promise<any>;
}
