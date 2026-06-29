-- AlterTable
ALTER TABLE "Incident" ADD COLUMN     "astreinteId" TEXT;

-- AddForeignKey
ALTER TABLE "Incident" ADD CONSTRAINT "Incident_astreinteId_fkey" FOREIGN KEY ("astreinteId") REFERENCES "Astreinte"("id") ON DELETE SET NULL ON UPDATE CASCADE;
