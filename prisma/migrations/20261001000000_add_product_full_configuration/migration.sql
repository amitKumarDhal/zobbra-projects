-- Full admin product configuration (pricing/stock, social proof, order mode, sizes/colors,
-- media, free gift, offer addon, highlights, internal stock deduction).
-- Additive only: every existing row keeps working with the defaults below.
-- Idempotent (IF NOT EXISTS) because server/src/config/autoMigrate.ts applies the
-- same changes at API startup and may run before `prisma migrate deploy`.

-- AlterTable
ALTER TABLE "products"
ADD COLUMN IF NOT EXISTS "minOrderQty" INTEGER,
ADD COLUMN IF NOT EXISTS "minSampleQty" INTEGER,
ADD COLUMN IF NOT EXISTS "stockCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS "ratingOverride" DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS "reviewCountOverride" INTEGER,
ADD COLUMN IF NOT EXISTS "orderMode" TEXT NOT NULL DEFAULT 'BOTH',
ADD COLUMN IF NOT EXISTS "customizationEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS "designerEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS "sizes" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN IF NOT EXISTS "colors" JSONB NOT NULL DEFAULT '[]',
ADD COLUMN IF NOT EXISTS "highlights" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN IF NOT EXISTS "orderImages" JSONB NOT NULL DEFAULT '[]',
ADD COLUMN IF NOT EXISTS "videos" JSONB NOT NULL DEFAULT '[]',
ADD COLUMN IF NOT EXISTS "freeGift" JSONB,
ADD COLUMN IF NOT EXISTS "offerAddon" JSONB,
ADD COLUMN IF NOT EXISTS "stockDeduction" JSONB;

-- AlterTable
ALTER TABLE "quotes"
ADD COLUMN IF NOT EXISTS "addonTitle" TEXT,
ADD COLUMN IF NOT EXISTS "addonAmount" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
ADD COLUMN IF NOT EXISTS "freeGiftTitle" TEXT;

-- AlterTable
ALTER TABLE "orders"
ADD COLUMN IF NOT EXISTS "addonTitle" TEXT,
ADD COLUMN IF NOT EXISTS "addonAmount" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
ADD COLUMN IF NOT EXISTS "freeGiftTitle" TEXT;
