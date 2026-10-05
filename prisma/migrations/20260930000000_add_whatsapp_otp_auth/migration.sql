-- Passwordless (WhatsApp OTP) customer authentication.
-- Additive only: relaxes NOT NULL on two columns and adds new objects.
-- Existing rows keep their email/passwordHash values unchanged.
-- Idempotent (IF NOT EXISTS) because server/src/config/autoMigrate.ts applies the
-- same changes at API startup and may run before `prisma migrate deploy`.

-- AlterTable
ALTER TABLE "users" ALTER COLUMN "email" DROP NOT NULL,
ALTER COLUMN "passwordHash" DROP NOT NULL,
ADD COLUMN IF NOT EXISTS "verifiedPhone" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "users_verifiedPhone_key" ON "users"("verifiedPhone");

-- CreateTable
CREATE TABLE IF NOT EXISTS "otp_challenges" (
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
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "otp_challenges_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "otp_challenges_phone_key" ON "otp_challenges"("phone");
