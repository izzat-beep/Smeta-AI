import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../prisma.js';
import { ah } from '../util.js';
import { requireRole } from '../auth.js';
import { replaceGeneralExpenses } from '../expensesService.js';

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

    // Replace-all mantig'i ulashiladigan servisda (orderId qatorlari saqlanadi).
    const count = await prisma.$transaction((tx) =>
      replaceGeneralExpenses(tx, req.user!.tenantId, projectId, currency, b.rows),
    );

    res.json({ ok: true, count, currency, projectId });
  }),
);
