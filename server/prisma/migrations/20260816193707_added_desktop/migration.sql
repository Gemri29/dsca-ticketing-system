/*
  Warnings:

  - Added the required column `siteName` to the `Ticket` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Ticket" ADD COLUMN     "desktopNumber" TEXT,
ADD COLUMN     "siteName" TEXT NOT NULL,
ADD COLUMN     "slaEmailSent" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "laptopNumber" DROP NOT NULL;

-- CreateTable
CREATE TABLE "Desktop" (
    "id" TEXT NOT NULL,
    "assetCode" TEXT NOT NULL,
    "assignedTo" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Desktop_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Desktop_assetCode_key" ON "Desktop"("assetCode");
