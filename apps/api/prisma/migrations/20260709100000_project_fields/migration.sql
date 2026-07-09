-- T2 (brief v3): Loyihalar markazi — qo'shimcha maydonlar.
ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS "address" TEXT;
ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS "description" TEXT;
ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS "startDate" TIMESTAMP(3);
