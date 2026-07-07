// Bildirishnoma endpointlari (Vazifa 1). Bir xil to'rtta endpoint ikki auditoriya
// uchun kerak (mijoz useri va sotuvchi), shuning uchun factory: scope'ni request'dan
// oladigan router quriladi. RBAC: har kim FAQAT o'z bildirishnomalarini ko'radi.
import { Router } from 'express';
import type { Request } from 'express';
import { prisma } from '../prisma.js';
import { ah } from '../util.js';
import * as s from '../serialize.js';

type OwnerWhere = { userId: string } | { vendorId: string };

export function buildNotificationsRouter(ownerWhere: (req: Request) => OwnerWhere): Router {
  const r = Router();

  // GET /?page=1&pageSize=20 — ro'yxat (yangisi birinchi)
  r.get(
    '/',
    ah(async (req, res) => {
      const page = Math.max(1, parseInt(String(req.query.page ?? '1'), 10) || 1);
      const pageSize = Math.min(50, Math.max(1, parseInt(String(req.query.pageSize ?? '20'), 10) || 20));
      const where = ownerWhere(req);
      const [rows, total] = await Promise.all([
        prisma.notification.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip: (page - 1) * pageSize,
          take: pageSize,
        }),
        prisma.notification.count({ where }),
      ]);
      res.json({ items: rows.map(s.notification), total, page, pageSize });
    }),
  );

  // GET /unread-count — o'qilmaganlar soni (30 soniyalik polling uchun yengil)
  r.get(
    '/unread-count',
    ah(async (req, res) => {
      const count = await prisma.notification.count({ where: { ...ownerWhere(req), isRead: false } });
      res.json({ count });
    }),
  );

  // PATCH /read-all — hammasini o'qilgan qilish
  r.patch(
    '/read-all',
    ah(async (req, res) => {
      await prisma.notification.updateMany({
        where: { ...ownerWhere(req), isRead: false },
        data: { isRead: true },
      });
      res.json({ ok: true });
    }),
  );

  // PATCH /:id/read — bittasini o'qilgan qilish (faqat o'ziniki)
  r.patch(
    '/:id/read',
    ah(async (req, res) => {
      const { count } = await prisma.notification.updateMany({
        where: { id: req.params.id, ...ownerWhere(req) },
        data: { isRead: true },
      });
      if (!count) return res.status(404).json({ error: 'not_found', message: 'Bildirishnoma topilmadi' });
      res.json({ ok: true });
    }),
  );

  return r;
}

// Mijoz (tenant useri) uchun: /api/notifications
export const notificationsRouter = buildNotificationsRouter((req) => ({ userId: req.user!.sub }));
