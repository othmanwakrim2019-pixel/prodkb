export interface IEscalationRepository {
    findRules(): Promise<any[]>;
    createRule(data: any): Promise<any>;
    findRuleById(id: string): Promise<any | null>;
    updateRule(id: string, data: any): Promise<any>;
    deleteRule(id: string): Promise<any>;
    findIncidentForEscalation(incidentId: string): Promise<any | null>;
    findNextEscalationRule(systemId: string, severity: string, level: number): Promise<any | null>;
    escalateIncident(incidentId: string, teamId: string, level: number): Promise<any>;
    createIncidentLog(incidentId: string, rawLog: string): Promise<any>;
}
