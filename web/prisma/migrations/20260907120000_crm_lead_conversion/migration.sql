-- AlterTable
ALTER TABLE "Lead" ADD COLUMN     "studentId" TEXT,
ADD COLUMN     "wonAt" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "Lead_studentId_key" ON "Lead"("studentId");

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE SET NULL ON UPDATE CASCADE;

