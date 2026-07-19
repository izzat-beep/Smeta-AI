-- Xavfsizlik (2026-07-19 audit): admin panel uchun 2FA (TOTP).
-- Sir AES-256-GCM bilan shifrlab saqlanadi (ilova darajasida). Idempotent.

ALTER TABLE "AdminUser" ADD COLUMN IF NOT EXISTS "totpSecret" TEXT;
ALTER TABLE "AdminUser" ADD COLUMN IF NOT EXISTS "totpEnabled" BOOLEAN NOT NULL DEFAULT false;
