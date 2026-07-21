// Bildirishnoma servisi (Vazifa 1). Barcha yozuvlar buyurtma bilan BITTA
// tranzaksiya ichida bajarilishi uchun funksiyalar tx (TransactionClient) oladi.
// title/body — uz fallback; data JSON (orderNo, status, ...) — clientda UZ/RU render uchun.
import type { Prisma, PrismaClient } from '@prisma/client';
import { pushToUser } from './push.js';

type Db = Prisma.TransactionClient | PrismaClient;

// Sotuvchi boshqaradigan status oqimi (oldinga qadam-baqadam).
export const ORDER_STATUS_FLOW = ['NEW', 'ACCEPTED', 'PREPARING', 'IN_TRANSIT', 'DELIVERED'] as const;
export type FlowStatus = (typeof ORDER_STATUS_FLOW)[number];

// Statusdan keyin ruxsat etilgan o'tishlar: keyingi bosqich yoki bekor qilish.
// DELIVERED va CANCELLED — yakuniy holatlar, ulardan o'tish yo'q.
export function allowedNextStatuses(current: string): string[] {
  const idx = ORDER_STATUS_FLOW.indexOf(current as FlowStatus);
  if (idx === -1 || idx === ORDER_STATUS_FLOW.length - 1) return [];
  return [ORDER_STATUS_FLOW[idx + 1], 'CANCELLED'];
}

// uz fallback matnlar (bildirishnoma body uchun)
const STATUS_UZ: Record<string, string> = {
  NEW: 'qabul qilindi (yangi)',
  ACCEPTED: 'qabul qilindi',
  PREPARING: 'tayyorlanmoqda',
  IN_TRANSIT: "yo'lga chiqdi",
  DELIVERED: 'yetkazib berildi',
  CANCELLED: 'bekor qilindi',
};

interface OrderLike {
  id: string;
  no: number;
  tenantId: string;
  userId?: string | null;
  customerName?: string;
  total?: unknown;
}

// Buyurtma bergan foydalanuvchi; bo'lmasa tenant'ning birinchi OWNER'i.
async function resolveCustomerUserId(db: Db, order: OrderLike): Promise<string | null> {
  if (order.userId) return order.userId;
  const owner = await db.user.findFirst({
    where: { tenantId: order.tenantId, role: 'OWNER' },
    select: { id: true },
    orderBy: { createdAt: 'asc' },
  });
  return owner?.id ?? null;
}

// Yangi buyurtma: tegishli sotuvchi(lar)ga bildirishnoma.
// items ichidagi materialId'lardan distinct vendorId'lar topiladi.
export async function notifyVendorsNewOrder(
  db: Db,
  order: OrderLike,
  materialIds: string[],
): Promise<void> {
  const ids = materialIds.filter(Boolean);
  if (!ids.length) return;
  const materials = await db.material.findMany({
    where: { id: { in: ids }, vendorId: { not: null } },
    select: { vendorId: true },
  });
  const vendorIds = [...new Set(materials.map((m) => m.vendorId!))];
  if (!vendorIds.length) return;
  await db.notification.createMany({
    data: vendorIds.map((vendorId) => ({
      vendorId,
      type: 'NEW_ORDER' as const,
      title: `Yangi buyurtma #${order.no}`,
      body: `Sizning mahsulotingizga yangi buyurtma keldi (#${order.no}).`,
      data: { orderNo: order.no },
      orderId: order.id,
    })),
  });
}

// Status o'zgardi: mijozga avtomatik bildirishnoma.
export async function notifyOrderStatus(db: Db, order: OrderLike, status: string): Promise<void> {
  const userId = await resolveCustomerUserId(db, order);
  if (!userId) return;
  const title = `Buyurtma #${order.no}`;
  const body = `Buyurtmangiz #${order.no} ${STATUS_UZ[status] ?? status}.`;
  await db.notification.create({
    data: { userId, type: 'ORDER_STATUS', title, body, data: { orderNo: order.no, status }, orderId: order.id },
  });
  // Push — fire-and-forget (global prisma; tx'ga bog'liq emas, best-effort).
  void pushToUser(userId, { title, body, data: { orderNo: order.no, status, orderId: order.id } });
}

// Sotuvchidan mijozga ixtiyoriy matnli xabar.
export async function notifyCustomerMessage(
  db: Db,
  order: OrderLike,
  text: string,
  fromName: string,
): Promise<void> {
  const userId = await resolveCustomerUserId(db, order);
  if (!userId) return;
  const title = `Buyurtma #${order.no} — xabar`;
  await db.notification.create({
    data: { userId, type: 'MESSAGE', title, body: text, data: { orderNo: order.no, from: fromName }, orderId: order.id },
  });
  void pushToUser(userId, { title, body: text, data: { orderNo: order.no, orderId: order.id } });
}
