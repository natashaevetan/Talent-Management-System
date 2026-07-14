-- AlterTable
ALTER TABLE "User" ADD COLUMN "twoFactorCodeHash" TEXT,
ADD COLUMN "twoFactorCodeExpiresAt" TIMESTAMP(3),
ADD COLUMN "twoFactorAttempts" INTEGER NOT NULL DEFAULT 0;
