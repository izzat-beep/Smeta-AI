-- Vazifa 1 (2/2): bildirishnomalar tizimi + Order.no/userId + status default.

-- Bildirishnoma turi
DO $$ BEGIN
  CREATE TYPE "NotificationType" AS ENUM ('NEW_ORDER', 'ORDER_STATUS', 'MESSAGE');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Order: inson o'qiydigan raqam (#123) va buyurtma bergan foydalanuvchi
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "no" SERIAL;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "userId" TEXT;
DO $$ BEGIN
  CREATE UNIQUE INDEX "Order_no_key" ON "Order"("no");
EXCEPTION WHEN duplicate_table THEN NULL; END $$;

-- To'lov hali ulanmagan: eski PENDING_PAYMENT buyurtmalar yangi oqim boshiga o'tadi.
UPDATE "Order" SET "status" = 'NEW' WHERE "status" = 'PENDING_PAYMENT';
ALTER TABLE "Order" ALTER COLUMN "status" SET DEFAULT 'NEW';

-- Notification jadvali
CREATE TABLE IF NOT EXISTS "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "vendorId" TEXT,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "data" JSONB,
    "orderId" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "Notification_userId_isRead_idx" ON "Notification"("userId", "isRead");
CREATE INDEX IF NOT EXISTS "Notification_vendorId_isRead_idx" ON "Notification"("vendorId", "isRead");
CREATE INDEX IF NOT EXISTS "Notification_createdAt_idx" ON "Notification"("createdAt");

DO $$ BEGIN
  ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "Notification" ADD CONSTRAINT "Notification_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "Notification" ADD CONSTRAINT "Notification_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
