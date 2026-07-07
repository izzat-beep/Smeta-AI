-- Vazifa 5: buyurtma -> avtomatik "Umumiy harajatlar" yozuvi.

-- Order: xarajat qaysi loyihaga (binoga) yozilishini saqlaymiz
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "projectId" TEXT;
DO $$ BEGIN
  ALTER TABLE "Order" ADD CONSTRAINT "Order_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- generalExpenses: buyurtma bog'lanishi. UNIQUE — idempotentlik
-- (bitta buyurtma uchun faqat bitta avtomatik yozuv, takror yozilmaydi).
ALTER TABLE "generalExpenses" ADD COLUMN IF NOT EXISTS "orderId" TEXT;
DO $$ BEGIN
  CREATE UNIQUE INDEX "generalExpenses_orderId_key" ON "generalExpenses"("orderId");
EXCEPTION WHEN duplicate_table THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "generalExpenses" ADD CONSTRAINT "generalExpenses_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
