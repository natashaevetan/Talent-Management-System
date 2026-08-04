-- AlterTable
ALTER TABLE "User" DROP COLUMN "twoFactorCodeHash",
DROP COLUMN "twoFactorCodeExpiresAt",
DROP COLUMN "twoFactorAttempts";
