-- Umumiy harajatlar (kalkulyator) — tenant profiliga serverda saqlash.
-- Idempotent: mavjud bo'lsa ham xato bermaydi (drift'ga chidamli).

-- CreateTable
CREATE TABLE IF NOT EXISTS "generalExpenses" (
    "id" SERIAL NOT NULL,
    "tenantId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'UZS',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "generalExpenses_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "generalExpenses_tenantId_idx" ON "generalExpenses"("tenantId");

-- AddForeignKey (guarded)
DO $$ BEGIN
  ALTER TABLE "generalExpenses" ADD CONSTRAINT "generalExpenses_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
