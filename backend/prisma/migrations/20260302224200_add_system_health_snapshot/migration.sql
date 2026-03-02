-- CreateTable
CREATE TABLE "SystemHealthSnapshot" (
    "id" TEXT NOT NULL,
    "systemId" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "incidentCount30d" INTEGER NOT NULL DEFAULT 0,
    "avgMttrMinutes" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "slaBreachRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "resolutionRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "openIncidents" INTEGER NOT NULL DEFAULT 0,
    "computedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SystemHealthSnapshot_pkey" PRIMARY KEY ("id")
);
-- CreateIndex
CREATE INDEX "SystemHealthSnapshot_systemId_computedAt_idx" ON "SystemHealthSnapshot"("systemId", "computedAt");
-- CreateIndex
CREATE INDEX "SystemHealthSnapshot_computedAt_idx" ON "SystemHealthSnapshot"("computedAt");
-- CreateIndex
CREATE INDEX "SystemHealthSnapshot_score_idx" ON "SystemHealthSnapshot"("score");
-- AddForeignKey
ALTER TABLE "SystemHealthSnapshot"
ADD CONSTRAINT "SystemHealthSnapshot_systemId_fkey" FOREIGN KEY ("systemId") REFERENCES "System"("id") ON DELETE CASCADE ON UPDATE CASCADE;