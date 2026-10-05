-- CreateTable
CREATE TABLE IF NOT EXISTS "customizer_templates" (
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
);
