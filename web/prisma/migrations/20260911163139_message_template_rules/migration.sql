-- CreateTable
CREATE TABLE "MessageTemplateRule" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MessageTemplateRule_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MessageTemplateRule_schoolId_isActive_idx" ON "MessageTemplateRule"("schoolId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "MessageTemplateRule_schoolId_key_key" ON "MessageTemplateRule"("schoolId", "key");

-- AddForeignKey
ALTER TABLE "MessageTemplateRule" ADD CONSTRAINT "MessageTemplateRule_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;
