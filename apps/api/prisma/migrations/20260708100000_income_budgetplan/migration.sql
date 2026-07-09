-- Vazifa 3: Daromad (Income), Byudjet rejasi (BudgetPlan) + xarajat kategoriyasi.

-- Xarajat/reja kategoriyasi enum
DO $$ BEGIN
  CREATE TYPE "ExpenseCategory" AS ENUM ('MATERIAL', 'LABOR', 'EQUIPMENT', 'GENERAL');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- generalExpenses: kategoriya + sana + izoh
ALTER TABLE "generalExpenses" ADD COLUMN IF NOT EXISTS "category" "ExpenseCategory" NOT NULL DEFAULT 'GENERAL';
ALTER TABLE "generalExpenses" ADD COLUMN IF NOT EXISTS "spentAt" TIMESTAMP(3);
ALTER TABLE "generalExpenses" ADD COLUMN IF NOT EXISTS "note" TEXT;
-- Buyurtmadan avtomatik yozilgan xarajatlar = material xaridlari
UPDATE "generalExpenses" SET "category" = 'MATERIAL' WHERE "orderId" IS NOT NULL AND "category" = 'GENERAL';

-- Income jadvali
CREATE TABLE IF NOT EXISTS "Income" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "projectId" TEXT,
    "amount" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "currency" "Currency" NOT NULL DEFAULT 'UZS',
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Income_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "Income_tenantId_idx" ON "Income"("tenantId");
CREATE INDEX IF NOT EXISTS "Income_projectId_idx" ON "Income"("projectId");
DO $$ BEGIN
  ALTER TABLE "Income" ADD CONSTRAINT "Income_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "Income" ADD CONSTRAINT "Income_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- BudgetPlan jadvali
CREATE TABLE IF NOT EXISTS "BudgetPlan" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "projectId" TEXT,
    "category" "ExpenseCategory" NOT NULL,
    "plannedAmount" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "currency" "Currency" NOT NULL DEFAULT 'UZS',
    "period" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "BudgetPlan_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "BudgetPlan_tenantId_idx" ON "BudgetPlan"("tenantId");
-- Eslatma: projectId NULL bo'lganda Postgres NULL'larni farqlaydi, shuning uchun
-- "loyihasiz" reja uchun takrorlanmaslik ilova kodida (findFirst-upsert) ta'minlanadi.
CREATE UNIQUE INDEX IF NOT EXISTS "BudgetPlan_tenantId_projectId_category_period_key"
  ON "BudgetPlan"("tenantId", "projectId", "category", "period");
DO $$ BEGIN
  ALTER TABLE "BudgetPlan" ADD CONSTRAINT "BudgetPlan_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "BudgetPlan" ADD CONSTRAINT "BudgetPlan_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
