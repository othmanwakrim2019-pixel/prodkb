-- AlterEnum: Add 'failed' and 'blocked' to PlanningStatus
ALTER TYPE "PlanningStatus"
ADD VALUE IF NOT EXISTS 'failed';
ALTER TYPE "PlanningStatus"
ADD VALUE IF NOT EXISTS 'blocked';
-- CreateEnum: TaskType
DO $$ BEGIN CREATE TYPE "TaskType" AS ENUM ('BATCH', 'MANUAL_ACTION');
EXCEPTION
WHEN duplicate_object THEN null;
END $$;
-- AlterTable PlanningJob: allow systemId and jobId to be nullable and add new columns
-- First make systemId and jobId nullable (they were NOT NULL in the init migration)
ALTER TABLE "PlanningJob"
ALTER COLUMN "systemId" DROP NOT NULL;
ALTER TABLE "PlanningJob"
ALTER COLUMN "jobId" DROP NOT NULL;
-- Drop the old unique constraint on (instanceId, jobId) since jobId is now optional
DROP INDEX IF EXISTS "PlanningJob_instanceId_jobId_key";
-- Add missing columns
ALTER TABLE "PlanningJob"
ADD COLUMN IF NOT EXISTS "taskType" "TaskType" NOT NULL DEFAULT 'BATCH';
ALTER TABLE "PlanningJob"
ADD COLUMN IF NOT EXISTS "customTaskName" TEXT;
ALTER TABLE "PlanningJob"
ADD COLUMN IF NOT EXISTS "supportContact" TEXT;
ALTER TABLE "PlanningJob"
ADD COLUMN IF NOT EXISTS "notes" TEXT;
ALTER TABLE "PlanningJob"
ADD COLUMN IF NOT EXISTS "launchedAt" TIMESTAMP(3);
ALTER TABLE "PlanningJob"
ADD COLUMN IF NOT EXISTS "launchedById" TEXT;
-- Add index for new column
CREATE INDEX IF NOT EXISTS "PlanningJob_taskType_idx" ON "PlanningJob"("taskType");
CREATE INDEX IF NOT EXISTS "PlanningJob_jobId_idx" ON "PlanningJob"("jobId");
CREATE INDEX IF NOT EXISTS "IncidentLog_createdById_idx" ON "IncidentLog"("createdById");
CREATE INDEX IF NOT EXISTS "AuditLog_entityId_idx" ON "AuditLog"("entityId");
CREATE INDEX IF NOT EXISTS "Procedure_jobId_idx" ON "Procedure"("jobId");
-- AddForeignKey for launchedById
ALTER TABLE "PlanningJob"
ADD CONSTRAINT "PlanningJob_launchedById_fkey" FOREIGN KEY ("launchedById") REFERENCES "User"("id") ON DELETE
SET NULL ON UPDATE CASCADE;
-- Fix systemId FK to allow SET NULL (was RESTRICT in init)
ALTER TABLE "PlanningJob" DROP CONSTRAINT IF EXISTS "PlanningJob_systemId_fkey";
ALTER TABLE "PlanningJob"
ADD CONSTRAINT "PlanningJob_systemId_fkey" FOREIGN KEY ("systemId") REFERENCES "System"("id") ON DELETE
SET NULL ON UPDATE CASCADE;
-- Fix jobId FK to allow SET NULL (was RESTRICT in init)
ALTER TABLE "PlanningJob" DROP CONSTRAINT IF EXISTS "PlanningJob_jobId_fkey";
ALTER TABLE "PlanningJob"
ADD CONSTRAINT "PlanningJob_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE
SET NULL ON UPDATE CASCADE;