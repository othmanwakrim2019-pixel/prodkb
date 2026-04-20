-- CreateEnum
CREATE TYPE "OperationalTaskType" AS ENUM ('MEP', 'SUPERVISION', 'TABLEAU_BORD', 'REPRISE_INCIDENT', 'CONTROLE_CHAINE', 'RAPPORT', 'CUSTOM');

-- CreateEnum
CREATE TYPE "OperationalTaskStatus" AS ENUM ('TODO', 'IN_PROGRESS', 'DONE', 'BLOCKED');

-- CreateEnum
CREATE TYPE "OperationalTaskPriority" AS ENUM ('LOW', 'NORMAL', 'HIGH', 'CRITICAL');

-- CreateTable
CREATE TABLE "Astreinte" (
    "id" TEXT NOT NULL,
    "weekNumber" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "phone" TEXT,
    "notes" TEXT,
    "teamId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Astreinte_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailyPlan" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "label" TEXT,
    "isWeekend" BOOLEAN NOT NULL DEFAULT false,
    "teamId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DailyPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OperationalTask" (
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "taskType" "OperationalTaskType" NOT NULL DEFAULT 'CUSTOM',
    "priority" "OperationalTaskPriority" NOT NULL DEFAULT 'NORMAL',
    "status" "OperationalTaskStatus" NOT NULL DEFAULT 'TODO',
    "startTime" TIMESTAMP(3),
    "endTime" TIMESTAMP(3),
    "systemId" TEXT,
    "chainLabel" TEXT,
    "assignedToId" TEXT NOT NULL,
    "note" TEXT,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OperationalTask_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Astreinte_teamId_idx" ON "Astreinte"("teamId");

-- CreateIndex
CREATE INDEX "Astreinte_userId_idx" ON "Astreinte"("userId");

-- CreateIndex
CREATE INDEX "Astreinte_startDate_endDate_idx" ON "Astreinte"("startDate", "endDate");

-- CreateIndex
CREATE INDEX "Astreinte_createdById_idx" ON "Astreinte"("createdById");

-- CreateIndex
CREATE UNIQUE INDEX "Astreinte_teamId_weekNumber_year_key" ON "Astreinte"("teamId", "weekNumber", "year");

-- CreateIndex
CREATE INDEX "DailyPlan_teamId_idx" ON "DailyPlan"("teamId");

-- CreateIndex
CREATE INDEX "DailyPlan_date_idx" ON "DailyPlan"("date");

-- CreateIndex
CREATE INDEX "DailyPlan_createdById_idx" ON "DailyPlan"("createdById");

-- CreateIndex
CREATE UNIQUE INDEX "DailyPlan_teamId_date_key" ON "DailyPlan"("teamId", "date");

-- CreateIndex
CREATE INDEX "OperationalTask_planId_idx" ON "OperationalTask"("planId");

-- CreateIndex
CREATE INDEX "OperationalTask_assignedToId_idx" ON "OperationalTask"("assignedToId");

-- CreateIndex
CREATE INDEX "OperationalTask_systemId_idx" ON "OperationalTask"("systemId");

-- CreateIndex
CREATE INDEX "OperationalTask_status_idx" ON "OperationalTask"("status");

-- CreateIndex
CREATE INDEX "OperationalTask_taskType_idx" ON "OperationalTask"("taskType");

-- CreateIndex
CREATE INDEX "OperationalTask_priority_idx" ON "OperationalTask"("priority");

-- CreateIndex
CREATE INDEX "OperationalTask_createdById_idx" ON "OperationalTask"("createdById");

-- AddForeignKey
ALTER TABLE "Astreinte" ADD CONSTRAINT "Astreinte_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Astreinte" ADD CONSTRAINT "Astreinte_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Astreinte" ADD CONSTRAINT "Astreinte_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyPlan" ADD CONSTRAINT "DailyPlan_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyPlan" ADD CONSTRAINT "DailyPlan_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OperationalTask" ADD CONSTRAINT "OperationalTask_planId_fkey" FOREIGN KEY ("planId") REFERENCES "DailyPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OperationalTask" ADD CONSTRAINT "OperationalTask_systemId_fkey" FOREIGN KEY ("systemId") REFERENCES "System"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OperationalTask" ADD CONSTRAINT "OperationalTask_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OperationalTask" ADD CONSTRAINT "OperationalTask_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
