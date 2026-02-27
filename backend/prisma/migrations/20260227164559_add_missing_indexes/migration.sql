-- CreateIndex
CREATE INDEX "AuditLog_entityId_idx" ON "AuditLog"("entityId");

-- CreateIndex
CREATE INDEX "IncidentLog_createdById_idx" ON "IncidentLog"("createdById");

-- CreateIndex
CREATE INDEX "PlanningJob_jobId_idx" ON "PlanningJob"("jobId");

-- CreateIndex
CREATE INDEX "Procedure_jobId_idx" ON "Procedure"("jobId");
