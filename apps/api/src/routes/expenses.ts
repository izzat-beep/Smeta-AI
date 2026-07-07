import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../prisma.js';
import { ah } from '../util.js';
import { requireRole } from '../auth.js';

export const expensesRouter = Router();

// GET /api/expenses — umumiy harajatlar ro'yxati.
// Query ?projectId=<id> — shu binoning harajatlari; berilmasa tenant-umumiy (projectId=null).
expensesRouter.get(
  '/',
  ah(async (req, res) => {
    const projectId = typeof req.query.projectId === 'string' && req.query.projectId.trim() ? req.query.projectId.trim() : null;
    const rows = await prisma.generalExpenses.findMany({
      where: { tenantId: req.user!.tenantId, projectId },
      orderBy: { id: 'asc' },
    });
    const currency = rows[0]?.currency === 'USD' ? 'USD' : 'UZS';
    res.json({
      // orderId — buyurtmadan avtomatik yozilgan qator belgisi (Vazifa 5)
      items: rows.map((e) => ({ id: e.id, label: e.label, amount: e.amount, orderId: e.orderId ?? null })),
      currency,
      projectId,
    });
  }),
);

// POST /api/expenses — ro'yxatni almashtirib saqlash (replace-all, projectId doirasida).
// rows[].orderId — buyurtmadan avtomatik yozilgan qatorning bog'lanishi; saqlashda
// yo'qolmasligi kerak (aks holda buyurtma bekor qilinganda qator o'chmay qoladi).
const saveSchema = z.object({
  projectId: z.string().optional().nullable(),
  currency: z.enum(['UZS', 'USD']).optional(),
  rows: z.array(
    z.object({
      name: z.string().optional().default(''),
      amount: z.union([z.number(), z.string()]).optional().default(0),
      orderId: z.string().optional().nullable(),
    }),
  ),
});

expensesRouter.post(
  '/',
  requireRole('OWNER', 'MANAGER'),
  ah(async (req, res) => {
    const b = saveSchema.parse(req.body);
    const currency = b.currency ?? 'UZS';
    const projectId = b.projectId ?? null;

    // projectId berilgan bo'lsa — shu tenant'ga tegishli ekanini tekshiramiz.
    if (projectId) {
      const p = await prisma.project.findFirst({ where: { id: projectId, tenantId: req.user!.tenantId } });
      if (!p) return res.status(400).json({ error: 'bad_request', message: 'Loyiha (bino) topilmadi' });
    }

    // orderId'lar faqat shu tenant'ning buyurtmalariga tegishli bo'lishi mumkin
    // (begona orderId ulab yubormaslik uchun); dublikatlar tashlanadi.
    const sentOrderIds = [...new Set(b.rows.map((r) => r.orderId).filter((v): v is string => !!v))];
    const validOrderIds = new Set(
      sentOrderIds.length
        ? (
            await prisma.order.findMany({
              where: { id: { in: sentOrderIds }, tenantId: req.user!.tenantId },
              select: { id: true },
            })
          ).map((o) => o.id)
        : [],
    );
    // Boshqa scope'da (boshqa projectId) allaqachon band orderId — unique
    // to'qnashuv bermasligi uchun bu ro'yxatda oddiy qator sifatida saqlanadi.
    if (sentOrderIds.length) {
      const busyElsewhere = await prisma.generalExpenses.findMany({
        where: { orderId: { in: sentOrderIds }, NOT: { tenantId: req.user!.tenantId, projectId } },
        select: { orderId: true },
      });
      for (const row of busyElsewhere) validOrderIds.delete(row.orderId!);
    }

    // Bo'sh qatorlarni tashlaymiz; summani raqamga aylantirib 2 xona (cent) gacha yaxlitlaymiz.
    const seenOrderIds = new Set<string>();
    const data = b.rows
      .map((r) => ({ name: (r.name ?? '').trim(), amount: Number(r.amount) || 0, orderId: r.orderId ?? null }))
      .filter((r) => r.name !== '' || r.amount > 0)
      .map((r) => {
        let orderId: string | null = null;
        if (r.orderId && validOrderIds.has(r.orderId) && !seenOrderIds.has(r.orderId)) {
          orderId = r.orderId;
          seenOrderIds.add(r.orderId);
        }
        return {
          tenantId: req.user!.tenantId,
          projectId,
          label: r.name,
          amount: Math.round(r.amount * 100) / 100,
          currency,
          orderId,
        };
      });

    // Eski yozuvlarni (shu projectId doirasida) o'chirib, yangilarini yozamiz.
    await prisma.$transaction([
      prisma.generalExpenses.deleteMany({ where: { tenantId: req.user!.tenantId, projectId } }),
      ...(data.length ? [prisma.generalExpenses.createMany({ data })] : []),
    ]);

    res.json({ ok: true, count: data.length, currency, projectId });
  }),
);
