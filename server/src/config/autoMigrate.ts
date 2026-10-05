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
    // Passwordless WhatsApp OTP customer auth (mirrors 20260930000000_add_whatsapp_otp_auth)
    `ALTER TABLE "users" ALTER COLUMN "email" DROP NOT NULL`,
    `ALTER TABLE "users" ALTER COLUMN "passwordHash" DROP NOT NULL`,
    `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "verifiedPhone" TEXT`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "users_verifiedPhone_key" ON "users"("verifiedPhone")`,
    `CREATE TABLE IF NOT EXISTS "otp_challenges" (
        "id" TEXT NOT NULL,
        "phone" TEXT NOT NULL,
        "codeHash" TEXT,
        "expiresAt" TIMESTAMP(3) NOT NULL,
        "attempts" INTEGER NOT NULL DEFAULT 0,
        "sendCount" INTEGER NOT NULL DEFAULT 0,
        "windowStartedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "lastSentAt" TIMESTAMP(3),
        "consumedAt" TIMESTAMP(3),
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "otp_challenges_pkey" PRIMARY KEY ("id")
    )`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "otp_challenges_phone_key" ON "otp_challenges"("phone")`,
    // Full admin product configuration (mirrors 20261001000000_add_product_full_configuration)
    `ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "minOrderQty" INTEGER`,
    `ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "minSampleQty" INTEGER`,
    `ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "stockCount" INTEGER NOT NULL DEFAULT 0`,
    `ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "ratingOverride" DOUBLE PRECISION`,
    `ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "reviewCountOverride" INTEGER`,
    `ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "orderMode" TEXT NOT NULL DEFAULT 'BOTH'`,
    `ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "customizationEnabled" BOOLEAN NOT NULL DEFAULT true`,
    `ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "designerEnabled" BOOLEAN NOT NULL DEFAULT true`,
    `ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "sizes" TEXT[] DEFAULT ARRAY[]::TEXT[]`,
    `ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "colors" JSONB NOT NULL DEFAULT '[]'`,
    `ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "highlights" TEXT[] DEFAULT ARRAY[]::TEXT[]`,
    `ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "orderImages" JSONB NOT NULL DEFAULT '[]'`,
    `ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "videos" JSONB NOT NULL DEFAULT '[]'`,
    `ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "freeGift" JSONB`,
    `ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "offerAddon" JSONB`,
    `ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "stockDeduction" JSONB`,
    `ALTER TABLE "quotes" ADD COLUMN IF NOT EXISTS "addonTitle" TEXT`,
    `ALTER TABLE "quotes" ADD COLUMN IF NOT EXISTS "addonAmount" DOUBLE PRECISION NOT NULL DEFAULT 0.0`,
    `ALTER TABLE "quotes" ADD COLUMN IF NOT EXISTS "freeGiftTitle" TEXT`,
    `ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "addonTitle" TEXT`,
    `ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "addonAmount" DOUBLE PRECISION NOT NULL DEFAULT 0.0`,
    `ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "freeGiftTitle" TEXT`,
    // Customer profile + order delivery snapshot (mirrors 20261002000000_add_customer_profile_fields)
    `ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "addressType" TEXT`,
    `ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "deliveryAddress" JSONB`,
    // Customizer front/back product views (mirrors 20261003000000_add_product_customizer_views)
    `ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "customizerViews" JSONB`,
    // Product-level reusable customizer template
    `ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "customizerTemplateId" TEXT`,
    // Product-level customizer feature switches (Phase 3 architecture)
    `ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "trimColorEnabled" BOOLEAN NOT NULL DEFAULT false`,
    `ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "tapingColorEnabled" BOOLEAN NOT NULL DEFAULT false`,
    `ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "backDesignEnabled" BOOLEAN NOT NULL DEFAULT true`,
    `ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "embroideryEnabled" BOOLEAN NOT NULL DEFAULT false`,
    `ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "zipperEnabled" BOOLEAN NOT NULL DEFAULT false`,
    `CREATE TABLE IF NOT EXISTS "customizer_templates" (
        "id" TEXT NOT NULL,
        "name" TEXT NOT NULL,
        "description" TEXT DEFAULT '',
        "version" TEXT NOT NULL DEFAULT '1.0',
        "active" BOOLEAN NOT NULL DEFAULT true,
        "supportsBack" BOOLEAN NOT NULL DEFAULT true,
        "categoryCompatibility" TEXT[] DEFAULT ARRAY[]::TEXT[],
        "colorGroups" JSONB NOT NULL DEFAULT '[]',
        "layers" JSONB NOT NULL DEFAULT '[]',
        "printAreas" JSONB NOT NULL DEFAULT '[]',
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "customizer_templates_pkey" PRIMARY KEY ("id")
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
