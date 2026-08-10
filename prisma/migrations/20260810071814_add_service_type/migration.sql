-- CreateEnum
CREATE TYPE "ServiceType" AS ENUM ('AIR_TICKET', 'HOTEL', 'VISA', 'TOUR_PACKAGE', 'INSURANCE', 'OTHER');

-- AlterTable
ALTER TABLE "Sale" ADD COLUMN     "serviceDetail" TEXT,
ADD COLUMN     "serviceType" "ServiceType" NOT NULL DEFAULT 'AIR_TICKET',
ALTER COLUMN "airline" DROP NOT NULL,
ALTER COLUMN "origin" DROP NOT NULL,
ALTER COLUMN "destination" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "Sale_serviceType_idx" ON "Sale"("serviceType");
