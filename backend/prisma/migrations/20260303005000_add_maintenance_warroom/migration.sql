-- CreateTable
CREATE TABLE "MaintenanceWindow" (
    "id" TEXT NOT NULL,
    "systemId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'scheduled',
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "MaintenanceWindow_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "WarRoomMessage" (
    "id" TEXT NOT NULL,
    "incidentId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'message',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "WarRoomMessage_pkey" PRIMARY KEY ("id")
);
-- CreateIndex
CREATE INDEX "MaintenanceWindow_systemId_scheduledAt_idx" ON "MaintenanceWindow"("systemId", "scheduledAt");
CREATE INDEX "MaintenanceWindow_status_idx" ON "MaintenanceWindow"("status");
CREATE INDEX "MaintenanceWindow_scheduledAt_endsAt_idx" ON "MaintenanceWindow"("scheduledAt", "endsAt");
-- CreateIndex
CREATE INDEX "WarRoomMessage_incidentId_createdAt_idx" ON "WarRoomMessage"("incidentId", "createdAt");
-- AddForeignKey
ALTER TABLE "MaintenanceWindow"
ADD CONSTRAINT "MaintenanceWindow_systemId_fkey" FOREIGN KEY ("systemId") REFERENCES "System"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MaintenanceWindow"
ADD CONSTRAINT "MaintenanceWindow_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "WarRoomMessage"
ADD CONSTRAINT "WarRoomMessage_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "Incident"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WarRoomMessage"
ADD CONSTRAINT "WarRoomMessage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;