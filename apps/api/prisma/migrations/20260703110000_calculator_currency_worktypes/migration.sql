-- Vazifa 2: valyuta kursi, til, usta ish haqi turlari, smeta muddatlari.

-- Enum: PaymentType (guarded)
DO $$ BEGIN
  CREATE TYPE "PaymentType" AS ENUM ('PER_M2', 'PER_M3', 'PER_METER', 'PER_UNIT', 'FIXED', 'HOURLY');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- User: interfeys tili
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "language" TEXT DEFAULT 'uz';

-- Tenant: qo'lda kiritiladigan USD kursi
ALTER TABLE "Tenant" ADD COLUMN IF NOT EXISTS "usdRate" DECIMAL(18,2) NOT NULL DEFAULT 12600;

-- EstimateItem: ish haqi to'lash asosi
ALTER TABLE "EstimateItem" ADD COLUMN IF NOT EXISTS "paymentType" "PaymentType";

-- EstimateStage: smeta muddatlari / bosqichlari
CREATE TABLE IF NOT EXISTS "EstimateStage" (
    "id" TEXT NOT NULL,
    "estimateId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "date" TIMESTAMP(3),
    "amount" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "currency" "Currency" NOT NULL DEFAULT 'UZS',
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "EstimateStage_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "EstimateStage_estimateId_idx" ON "EstimateStage"("estimateId");

DO $$ BEGIN
  ALTER TABLE "EstimateStage" ADD CONSTRAINT "EstimateStage_estimateId_fkey" FOREIGN KEY ("estimateId") REFERENCES "Estimate"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
