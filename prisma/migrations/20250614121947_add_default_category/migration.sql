-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN     "defaultCategoryId" TEXT;

-- CreateTable
CREATE TABLE "DefaultCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "TransactionType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DefaultCategory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DefaultCategory_name_type_key" ON "DefaultCategory"("name", "type");

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_defaultCategoryId_fkey" FOREIGN KEY ("defaultCategoryId") REFERENCES "DefaultCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;
