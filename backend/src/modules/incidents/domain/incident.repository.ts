import { Prisma } from '@prisma/client';
import type { PaginationParams } from '../../../types';

export interface IncidentTrendRow {
    day: Date;
    count: bigint;
}

export interface IIncidentRepository {
    findIncidents(where: Record<string, unknown>, pagination: PaginationParams): Promise<any>;
    findIncidentById(id: string): Promise<any | null>;
    findSystemById(id: string): Promise<any | null>;
    findJobById(id: string): Promise<any | null>;
    createIncident(data: Prisma.IncidentCreateArgs['data']): Promise<any>;
    updateIncident(id: string, data: Prisma.IncidentUpdateArgs['data']): Promise<any>;
    updateIncidentWithVersion(id: string, version: number, data: Prisma.IncidentUpdateArgs['data']): Promise<any>;
    deleteIncident(id: string): Promise<any>;
    findProcedureById(id: string): Promise<any | null>;
    createIncidentLog(data: Prisma.IncidentLogCreateArgs['data']): Promise<any>;
    findFileLog(incidentId: string, fileName: string): Promise<any | null>;
    deleteIncidentLog(id: string): Promise<any>;
    findActivityLogs(incidentId: string): Promise<any[]>;
    countIncidents(where: Record<string, unknown>): Promise<number>;
    aggregateIncidentResolution(where: Record<string, unknown>): Promise<any>;
    groupIncidentsByStatus(where: Record<string, unknown>): Promise<any[]>;
    queryCreatedTrend(start: Date, end: Date): Promise<IncidentTrendRow[]>;
    queryResolvedTrend(start: Date, end: Date): Promise<IncidentTrendRow[]>;
    groupIncidentsBySystem(where: Record<string, unknown>): Promise<any[]>;
    findSystemsByIds(systemIds: string[]): Promise<any[]>;
    findIncidentSuggestions(where: Record<string, unknown>): Promise<any[]>;
}
