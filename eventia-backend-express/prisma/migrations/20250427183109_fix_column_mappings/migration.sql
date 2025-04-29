/*
  Warnings:

  - You are about to drop the column `lockedBy` on the `seats` table. All the data in the column will be lost.
  - You are about to drop the column `maxAttempts` on the `ticket_generation_queue` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "seats" DROP COLUMN "lockedBy",
ADD COLUMN     "locked_by" TEXT;

-- AlterTable
ALTER TABLE "ticket_generation_queue" DROP COLUMN "maxAttempts",
ADD COLUMN     "max_attempts" INTEGER NOT NULL DEFAULT 3;
