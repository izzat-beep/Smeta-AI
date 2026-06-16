import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
});

// Decimal -> number, Date -> ISO string serializatsiyasi uchun yordamchi
export function toNum(d: unknown): number {
  if (d === null || d === undefined) return 0;
  // Prisma Decimal .toString() beradi
  return typeof d === 'object' && 'toNumber' in (d as any)
    ? (d as any).toNumber()
    : Number(d);
}
