-- Xavfsizlik (2026-07-19 audit): account lockout.
-- Ketma-ket muvaffaqiyatsiz login urinishlaridan so'ng hisobni vaqtinchalik
-- bloklash uchun har bir auth-subyekt jadvaliga ikkita ustun qo'shiladi.
-- Idempotent (IF NOT EXISTS) — qayta deploy'da xavfsiz.

ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "failedLoginAttempts" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "lockedUntil" TIMESTAMP(3);

ALTER TABLE "AdminUser" ADD COLUMN IF NOT EXISTS "failedLoginAttempts" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "AdminUser" ADD COLUMN IF NOT EXISTS "lockedUntil" TIMESTAMP(3);

ALTER TABLE "Vendor" ADD COLUMN IF NOT EXISTS "failedLoginAttempts" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Vendor" ADD COLUMN IF NOT EXISTS "lockedUntil" TIMESTAMP(3);
