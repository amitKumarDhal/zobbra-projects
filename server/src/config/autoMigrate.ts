import { prisma } from './index.js';

export async function ensureDatabaseSchema() {
  const statements = [
    `ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN NOT NULL DEFAULT true`,
    `ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "requiresColor" BOOLEAN NOT NULL DEFAULT true`,
    `ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "requiresSize" BOOLEAN NOT NULL DEFAULT true`,
    `ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "supportsVariantMatrix" BOOLEAN NOT NULL DEFAULT true`,
    `ALTER TABLE "quotes" ADD COLUMN IF NOT EXISTS "gstRate" DOUBLE PRECISION`,
    `ALTER TABLE "quotes" ADD COLUMN IF NOT EXISTS "isGstApplied" BOOLEAN NOT NULL DEFAULT true`,
    `ALTER TABLE "quotes" ADD COLUMN IF NOT EXISTS "artworkUrl" TEXT`,
    `ALTER TABLE "quotes" ADD COLUMN IF NOT EXISTS "previewFrontUrl" TEXT`,
    `ALTER TABLE "quotes" ADD COLUMN IF NOT EXISTS "previewBackUrl" TEXT`,
    `ALTER TABLE "quotes" ADD COLUMN IF NOT EXISTS "canvasStateJson" TEXT`,
    `ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "artworkUrl" TEXT`,
    `ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "previewFrontUrl" TEXT`,
    `ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "previewBackUrl" TEXT`,
    `ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "canvasStateJson" TEXT`,
    `CREATE TABLE IF NOT EXISTS "quote_item_variants" (
        "id" TEXT NOT NULL,
        "quoteItemId" TEXT NOT NULL,
        "color" TEXT,
        "size" TEXT,
        "quantity" INTEGER NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "quote_item_variants_pkey" PRIMARY KEY ("id")
    )`,
    `CREATE TABLE IF NOT EXISTS "order_item_variants" (
        "id" TEXT NOT NULL,
        "orderItemId" TEXT NOT NULL,
        "color" TEXT,
        "size" TEXT,
        "quantity" INTEGER NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "order_item_variants_pkey" PRIMARY KEY ("id")
    )`,
    `CREATE TABLE IF NOT EXISTS "inquiry_variants" (
        "id" TEXT NOT NULL,
        "inquiryId" TEXT NOT NULL,
        "color" TEXT,
        "size" TEXT,
        "quantity" INTEGER NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "inquiry_variants_pkey" PRIMARY KEY ("id")
    )`,
    `DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'quote_item_variants_quoteItemId_fkey') THEN
        ALTER TABLE "quote_item_variants" ADD CONSTRAINT "quote_item_variants_quoteItemId_fkey" FOREIGN KEY ("quoteItemId") REFERENCES "quote_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;
      END IF;
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'order_item_variants_orderItemId_fkey') THEN
        ALTER TABLE "order_item_variants" ADD CONSTRAINT "order_item_variants_orderItemId_fkey" FOREIGN KEY ("orderItemId") REFERENCES "order_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;
      END IF;
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'inquiry_variants_inquiryId_fkey') THEN
        ALTER TABLE "inquiry_variants" ADD CONSTRAINT "inquiry_variants_inquiryId_fkey" FOREIGN KEY ("inquiryId") REFERENCES "inquiries"("id") ON DELETE CASCADE ON UPDATE CASCADE;
      END IF;
    END $$;`
  ];

  for (const sql of statements) {
    try {
      await prisma.$executeRawUnsafe(sql);
    } catch (statementError: any) {
      console.warn(`⚠️ Notice executing schema sync statement (${sql.slice(0, 50)}...):`, statementError.message);
    }
  }
  console.log('✅ Database schema auto-verified and synced');
}
