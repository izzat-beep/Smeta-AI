-- Vazifa 1 (1/2): OrderStatus enum'iga sotuvchi boshqaradigan yangi holatlar.
-- MUHIM: Postgres'da yangi enum qiymati qo'shilgan TRANZAKSIYA ichida ishlatilmaydi,
-- shuning uchun qiymatlar shu (alohida) migratsiyada qo'shiladi, ishlatish keyingisida.
ALTER TYPE "OrderStatus" ADD VALUE IF NOT EXISTS 'NEW';
ALTER TYPE "OrderStatus" ADD VALUE IF NOT EXISTS 'ACCEPTED';
ALTER TYPE "OrderStatus" ADD VALUE IF NOT EXISTS 'PREPARING';
ALTER TYPE "OrderStatus" ADD VALUE IF NOT EXISTS 'IN_TRANSIT';
