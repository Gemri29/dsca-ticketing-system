/*
  Warnings:

  - You are about to drop the column `slaEmailSent` on the `Ticket` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Ticket" DROP COLUMN "slaEmailSent",
ADD COLUMN     "lastSlaEmailAt" TIMESTAMP(3);
