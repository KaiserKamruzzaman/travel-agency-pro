/*
  Warnings:

  - You are about to drop the column `serviceDetail` on the `Sale` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Sale" DROP COLUMN "serviceDetail",
ADD COLUMN     "serviceAttributes" JSONB;
