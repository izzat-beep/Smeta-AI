-- Payment jadvali. Oldingi `sales` migratsiyasida Payment yaratilmagan edi
-- (schema.prisma da model bor, lekin migratsiyada yo'q) — bu drift sababli prod'da
-- `prisma.payment` so'rovlari ishlamasdi. Idempotent: mavjud bo'lsa ham xato bermaydi.

-- CreateTable
CREATE TABLE IF NOT EXISTS "Payment" (
    "id" TEXT NOT NULL,
    "saleId" TEXT NOT NULL,
    "amount" DECIMAL(18,2) NOT NULL,
    "currency" "Currency" NOT NULL DEFAULT 'UZS',
    "location" TEXT,
    "method" TEXT,
    "note" TEXT,
    "paidAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Payment_saleId_idx" ON "Payment"("saleId");

-- AddForeignKey (guarded — qayta qo'shilsa xato bermaydi)
DO $$ BEGIN
  ALTER TABLE "Payment" ADD CONSTRAINT "Payment_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "Sale"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
