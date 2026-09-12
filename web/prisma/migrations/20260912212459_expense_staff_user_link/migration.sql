-- AlterTable
ALTER TABLE "Expense" ADD COLUMN     "staffUserId" TEXT;

-- CreateIndex
CREATE INDEX "Expense_schoolId_staffUserId_idx" ON "Expense"("schoolId", "staffUserId");

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_staffUserId_fkey" FOREIGN KEY ("staffUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
