-- CreateTable
CREATE TABLE "DocumentTypeRule" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "validityMonths" INTEGER,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DocumentTypeRule_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DocumentTypeRule_schoolId_isActive_idx" ON "DocumentTypeRule"("schoolId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "DocumentTypeRule_schoolId_key_key" ON "DocumentTypeRule"("schoolId", "key");

-- AddForeignKey
ALTER TABLE "DocumentTypeRule" ADD CONSTRAINT "DocumentTypeRule_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;
