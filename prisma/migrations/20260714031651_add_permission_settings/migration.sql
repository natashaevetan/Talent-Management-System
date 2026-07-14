-- CreateTable
CREATE TABLE "PermissionSettings" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "standardCanViewFinancials" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PermissionSettings_pkey" PRIMARY KEY ("id")
);
