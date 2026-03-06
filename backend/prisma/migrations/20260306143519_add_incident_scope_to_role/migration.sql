-- CreateEnum
CREATE TYPE "IncidentScope" AS ENUM ('ALL', 'TEAM_ONLY');

-- AlterTable
ALTER TABLE "Role" ADD COLUMN     "incidentScope" "IncidentScope" NOT NULL DEFAULT 'ALL';

-- CreateTable
CREATE TABLE "PostMortem" (
    "id" TEXT NOT NULL,
    "incidentId" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "rootCause" TEXT NOT NULL,
    "timeline" TEXT NOT NULL,
    "impact" TEXT NOT NULL,
    "lessonsLearned" TEXT NOT NULL,
    "preventiveActions" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PostMortem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PostMortem_incidentId_key" ON "PostMortem"("incidentId");

-- CreateIndex
CREATE INDEX "PostMortem_incidentId_idx" ON "PostMortem"("incidentId");

-- CreateIndex
CREATE INDEX "PostMortem_status_idx" ON "PostMortem"("status");

-- CreateIndex
CREATE INDEX "PostMortem_createdById_idx" ON "PostMortem"("createdById");

-- CreateIndex
CREATE INDEX "AutoAssignmentRule_teamId_idx" ON "AutoAssignmentRule"("teamId");

-- CreateIndex
CREATE INDEX "EscalationRule_teamId_idx" ON "EscalationRule"("teamId");

-- CreateIndex
CREATE INDEX "Incident_jobId_idx" ON "Incident"("jobId");

-- CreateIndex
CREATE INDEX "Incident_createdById_idx" ON "Incident"("createdById");

-- CreateIndex
CREATE INDEX "Incident_resolvedById_idx" ON "Incident"("resolvedById");

-- CreateIndex
CREATE INDEX "Incident_updatedById_idx" ON "Incident"("updatedById");

-- CreateIndex
CREATE INDEX "Incident_linkedProcedureId_idx" ON "Incident"("linkedProcedureId");

-- CreateIndex
CREATE INDEX "Job_updatedById_idx" ON "Job"("updatedById");

-- CreateIndex
CREATE INDEX "MaintenanceWindow_createdById_idx" ON "MaintenanceWindow"("createdById");

-- CreateIndex
CREATE INDEX "Notification_incidentId_idx" ON "Notification"("incidentId");

-- CreateIndex
CREATE INDEX "PlanningJob_launchedById_idx" ON "PlanningJob"("launchedById");

-- CreateIndex
CREATE INDEX "PlanningJob_completedById_idx" ON "PlanningJob"("completedById");

-- CreateIndex
CREATE INDEX "Procedure_createdById_idx" ON "Procedure"("createdById");

-- CreateIndex
CREATE INDEX "Procedure_updatedById_idx" ON "Procedure"("updatedById");

-- CreateIndex
CREATE INDEX "Role_updatedById_idx" ON "Role"("updatedById");

-- CreateIndex
CREATE INDEX "SLA_updatedById_idx" ON "SLA"("updatedById");

-- CreateIndex
CREATE INDEX "System_updatedById_idx" ON "System"("updatedById");

-- CreateIndex
CREATE INDEX "Team_updatedById_idx" ON "Team"("updatedById");

-- CreateIndex
CREATE INDEX "WarRoomMessage_userId_idx" ON "WarRoomMessage"("userId");

-- CreateIndex
CREATE INDEX "WebhookDelivery_createdAt_idx" ON "WebhookDelivery"("createdAt");

-- AddForeignKey
ALTER TABLE "PostMortem" ADD CONSTRAINT "PostMortem_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "Incident"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PostMortem" ADD CONSTRAINT "PostMortem_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
