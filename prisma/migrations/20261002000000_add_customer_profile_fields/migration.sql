-- AlterTable
ALTER TABLE "companies" ADD COLUMN     "addressType" TEXT;

-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "deliveryAddress" JSONB;
