
export interface IAstreinteRepository {
    findMany(where: Record<string, unknown>): Promise<any[]>;
    findById(id: string): Promise<any | null>;
    findCurrent(teamId: string, date?: Date): Promise<any | null>;
    findCurrentAny(date?: Date): Promise<any | null>;
    findByWeek(teamId: string, weekNumber: number, year: number): Promise<any | null>;
    create(data: any): Promise<any>;
    update(id: string, data: any): Promise<any>;
    delete(id: string): Promise<void>;
}
