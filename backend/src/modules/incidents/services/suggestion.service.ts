/**
 * Incident Suggestion Service
 *
 * When creating an incident, this service suggests the most relevant
 * procedures based on historical data: which procedures were linked
 * to resolved incidents on the same system/job combination?
 *
 * Pure Prisma aggregate query — no external AI/ML required.
 *
 * @module modules/incidents/suggestion.service
 */

import { logger } from '../../../common/utils/logger';
import { incidentRepository } from '../repositories/incident.repository';

export interface ProcedureSuggestion {
    procedureId: string;
    procedureTitle: string;
    systemName: string;
    usageCount: number;        // How many resolved incidents linked this procedure
    avgMttrMinutes: number;    // Average MTTR when this procedure was used
}

class IncidentSuggestionService {
    /**
     * Given a systemId (and optional jobId, severity), return the top 3
     * most relevant procedures based on historical resolution data.
     *
     * Logic:
     * 1. Find ALL resolved incidents for this system (+ job if given)
     *    that had a linkedProcedureId
     * 2. Group by linkedProcedureId
     * 3. Count usage + compute avg MTTR
     * 4. Return top 3 sorted by usage count DESC, avg MTTR ASC
     */
    async suggestProcedures(
        systemId: string,
        jobId?: string,
        severity?: string,
    ): Promise<ProcedureSuggestion[]> {
        try {
            // Build the where clause
            const where: Record<string, unknown> = {
                systemId,
                status: 'resolved',
                linkedProcedureId: { not: null },
                timeToResolve: { not: null },
            };
            if (jobId) where.jobId = jobId;
            if (severity) where.severity = severity;

            // Get all matching incidents with their linked procedure
            const incidents = await incidentRepository.findIncidentSuggestions(where);

            if (incidents.length === 0) {
                // Fallback: if no exact match, try just systemId (no job/severity filter)
                if (jobId || severity) {
                    return this.suggestProcedures(systemId);
                }
                return [];
            }

            // Group by procedure
            const grouped = new Map<string, {
                procedureId: string;
                procedureTitle: string;
                systemName: string;
                totalMttr: number;
                count: number;
            }>();

            incidents.forEach((inc: any) => {
                const pid = inc.linkedProcedureId!;
                const existing = grouped.get(pid);
                if (existing) {
                    existing.count++;
                    existing.totalMttr += inc.timeToResolve || 0;
                } else {
                    grouped.set(pid, {
                        procedureId: pid,
                        procedureTitle: inc.linkedProcedure?.title || 'Unknown',
                        systemName: inc.system?.name || 'Unknown',
                        totalMttr: inc.timeToResolve || 0,
                        count: 1,
                    });
                }
            });

            // Sort by usage count DESC, then avg MTTR ASC
            const suggestions: ProcedureSuggestion[] = Array.from(grouped.values())
                .map(g => ({
                    procedureId: g.procedureId,
                    procedureTitle: g.procedureTitle,
                    systemName: g.systemName,
                    usageCount: g.count,
                    avgMttrMinutes: Math.round(g.totalMttr / g.count),
                }))
                .sort((a, b) => {
                    if (b.usageCount !== a.usageCount) return b.usageCount - a.usageCount;
                    return a.avgMttrMinutes - b.avgMttrMinutes;
                })
                .slice(0, 3);

            logger.debug('Procedure suggestions computed', {
                systemId,
                jobId,
                suggestionsCount: suggestions.length,
            });

            return suggestions;
        } catch (error) {
            logger.error('Failed to compute procedure suggestions', {
                error: (error as Error).message,
            });
            return [];
        }
    }
}

export const incidentSuggestionService = new IncidentSuggestionService();
