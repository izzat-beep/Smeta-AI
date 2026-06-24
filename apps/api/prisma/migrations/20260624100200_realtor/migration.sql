-- Makler/Realtor moduli (Task 4): Realtor jadvali + Sale bilan bog'lanish.

-- CreateTable
CREATE TABLE IF NOT EXISTS "Realtor" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Realtor_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Realtor_tenantId_idx" ON "Realtor"("tenantId");

-- AlterTable: Sale ga makler bog'lanishi va komissiya
ALTER TABLE "Sale" ADD COLUMN IF NOT EXISTS "realtorId" TEXT;
ALTER TABLE "Sale" ADD COLUMN IF NOT EXISTS "commissionAmount" DECIMAL(18,2) NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Sale_realtorId_idx" ON "Sale"("realtorId");

-- AddForeignKey (guarded)
DO $$ BEGIN
  ALTER TABLE "Realtor" ADD CONSTRAINT "Realtor_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "Sale" ADD CONSTRAINT "Sale_realtorId_fkey" FOREIGN KEY ("realtorId") REFERENCES "Realtor"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
