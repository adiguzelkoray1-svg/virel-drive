-- AlterTable
ALTER TABLE "Expense" ADD COLUMN     "instructorId" TEXT,
ADD COLUMN     "subcategory" TEXT;

-- CreateIndex
CREATE INDEX "Expense_schoolId_instructorId_idx" ON "Expense"("schoolId", "instructorId");

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_instructorId_fkey" FOREIGN KEY ("instructorId") REFERENCES "Instructor"("id") ON DELETE SET NULL ON UPDATE CASCADE;
