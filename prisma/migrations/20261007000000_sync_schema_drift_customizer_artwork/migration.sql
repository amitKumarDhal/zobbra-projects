-- Repairs drift between migration history and prisma/schema.prisma.
-- These objects were previously only created at runtime by server/src/config/autoMigrate.ts.
-- Idempotent: safe on databases that already contain the columns.

-- AlterTable
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "customizerTemplateId" TEXT;

-- AlterTable
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "artworkUrl" TEXT;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "canvasStateJson" TEXT;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "previewFrontUrl" TEXT;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "previewBackUrl" TEXT;

-- AlterTable
ALTER TABLE "quotes" ADD COLUMN IF NOT EXISTS "artworkUrl" TEXT;
ALTER TABLE "quotes" ADD COLUMN IF NOT EXISTS "canvasStateJson" TEXT;
ALTER TABLE "quotes" ADD COLUMN IF NOT EXISTS "previewFrontUrl" TEXT;
ALTER TABLE "quotes" ADD COLUMN IF NOT EXISTS "previewBackUrl" TEXT;

-- AlterTable (schema uses @updatedAt, which has no DB-level default; no-op if already dropped)
ALTER TABLE "customizer_templates" ALTER COLUMN "updatedAt" DROP DEFAULT;
