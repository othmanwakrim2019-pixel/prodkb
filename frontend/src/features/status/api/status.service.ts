export interface MaintenanceEntry {
    id: string;
    systemName: string;
    title: string;
    scheduledAt: string;
    endsAt: string;
}

export interface StatusData {
    upcomingMaintenances: MaintenanceEntry[];
    lastUpdated: string;
}

export const statusService = {
    getStatus: async (): Promise<StatusData> => {
        const response = await fetch('/api/status-data');
        return response.json();
    },
};
