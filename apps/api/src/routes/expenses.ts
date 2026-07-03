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
      items: rows.map((e) => ({ id: e.id, label: e.label, amount: e.amount })),
      currency,
      projectId,
    });
  }),
);

// POST /api/expenses — ro'yxatni almashtirib saqlash (replace-all, projectId doirasida)
const saveSchema = z.object({
  projectId: z.string().optional().nullable(),
  currency: z.enum(['UZS', 'USD']).optional(),
  rows: z.array(
    z.object({
      name: z.string().optional().default(''),
      amount: z.union([z.number(), z.string()]).optional().default(0),
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

    // Bo'sh qatorlarni tashlaymiz; summani raqamga aylantirib 2 xona (cent) gacha yaxlitlaymiz.
    const data = b.rows
      .map((r) => ({ name: (r.name ?? '').trim(), amount: Number(r.amount) || 0 }))
      .filter((r) => r.name !== '' || r.amount > 0)
      .map((r) => ({
        tenantId: req.user!.tenantId,
        projectId,
        label: r.name,
        amount: Math.round(r.amount * 100) / 100,
        currency,
      }));

    // Eski yozuvlarni (shu projectId doirasida) o'chirib, yangilarini yozamiz.
    await prisma.$transaction([
      prisma.generalExpenses.deleteMany({ where: { tenantId: req.user!.tenantId, projectId } }),
      ...(data.length ? [prisma.generalExpenses.createMany({ data })] : []),
    ]);

    res.json({ ok: true, count: data.length, currency, projectId });
  }),
);
