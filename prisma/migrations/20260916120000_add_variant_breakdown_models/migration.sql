-- AlterTable
ALTER TABLE "products" ADD COLUMN "requiresColor" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "requiresSize" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "supportsVariantMatrix" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "quotes" ADD COLUMN "gstRate" DOUBLE PRECISION,
ADD COLUMN "isGstApplied" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "quote_item_variants" (
    "id" TEXT NOT NULL,
    "quoteItemId" TEXT NOT NULL,
    "color" TEXT,
    "size" TEXT,
    "quantity" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "quote_item_variants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_item_variants" (
    "id" TEXT NOT NULL,
    "orderItemId" TEXT NOT NULL,
    "color" TEXT,
    "size" TEXT,
    "quantity" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "order_item_variants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inquiry_variants" (
    "id" TEXT NOT NULL,
    "inquiryId" TEXT NOT NULL,
    "color" TEXT,
    "size" TEXT,
    "quantity" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inquiry_variants_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "quote_item_variants" ADD CONSTRAINT "quote_item_variants_quoteItemId_fkey" FOREIGN KEY ("quoteItemId") REFERENCES "quote_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_item_variants" ADD CONSTRAINT "order_item_variants_orderItemId_fkey" FOREIGN KEY ("orderItemId") REFERENCES "order_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inquiry_variants" ADD CONSTRAINT "inquiry_variants_inquiryId_fkey" FOREIGN KEY ("inquiryId") REFERENCES "inquiries"("id") ON DELETE CASCADE ON UPDATE CASCADE;
