-- CreateTable
CREATE TABLE "DrivingCandidateCertificate" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DrivingCandidateCertificate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DrivingCandidateCertificate_schoolId_studentId_idx" ON "DrivingCandidateCertificate"("schoolId", "studentId");

-- CreateIndex
CREATE INDEX "DrivingCandidateCertificate_schoolId_expiresAt_idx" ON "DrivingCandidateCertificate"("schoolId", "expiresAt");

-- AddForeignKey
ALTER TABLE "DrivingCandidateCertificate" ADD CONSTRAINT "DrivingCandidateCertificate_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DrivingCandidateCertificate" ADD CONSTRAINT "DrivingCandidateCertificate_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;
