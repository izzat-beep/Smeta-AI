-- Vazifa 3: "Kelgan pullar" loyiha=bino modeliga o'tadi.
-- Project = bino (honadonlar soni, sotib olish narxi); Sale va harajatlar binoga bog'lanadi.

-- Project: honadonlar soni + sotib olish narxi
ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS "totalUnits" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS "purchasePrice" DECIMAL(18,2) NOT NULL DEFAULT 0;

-- Sale: binoga bog'lanish
ALTER TABLE "Sale" ADD COLUMN IF NOT EXISTS "projectId" TEXT;
CREATE INDEX IF NOT EXISTS "Sale_projectId_idx" ON "Sale"("projectId");
DO $$ BEGIN
  ALTER TABLE "Sale" ADD CONSTRAINT "Sale_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- generalExpenses: binoga bog'lanish (null = umumiy)
ALTER TABLE "generalExpenses" ADD COLUMN IF NOT EXISTS "projectId" TEXT;
CREATE INDEX IF NOT EXISTS "generalExpenses_projectId_idx" ON "generalExpenses"("projectId");
DO $$ BEGIN
  ALTER TABLE "generalExpenses" ADD CONSTRAINT "generalExpenses_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
