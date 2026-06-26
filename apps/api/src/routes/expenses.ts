import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../prisma.js';
import { ah } from '../util.js';

export const expensesRouter = Router();

// GET /api/expenses — tenant uchun umumiy harajatlar ro'yxati
expensesRouter.get(
  '/',
  ah(async (req, res) => {
    const rows = await prisma.generalExpenses.findMany({
      where: { tenantId: req.user!.tenantId },
      orderBy: { id: 'asc' },
    });
    const currency = rows[0]?.currency === 'USD' ? 'USD' : 'UZS';
    res.json({
      items: rows.map((e) => ({ id: e.id, label: e.label, amount: e.amount })),
      currency,
    });
  }),
);

// POST /api/expenses — butun ro'yxatni almashtirib saqlash (replace-all)
const saveSchema = z.object({
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
  ah(async (req, res) => {
    const b = saveSchema.parse(req.body);
    const currency = b.currency ?? 'UZS';

    // Bo'sh qatorlarni tashlaymiz; summani raqamga aylantirib 2 xona (cent) gacha yaxlitlaymiz.
    const data = b.rows
      .map((r) => ({ name: (r.name ?? '').trim(), amount: Number(r.amount) || 0 }))
      .filter((r) => r.name !== '' || r.amount > 0)
      .map((r) => ({
        tenantId: req.user!.tenantId,
        label: r.name,
        amount: Math.round(r.amount * 100) / 100,
        currency,
      }));

    // Eski yozuvlarni o'chirib, yangilarini bitta tranzaksiyada yozamiz.
    await prisma.$transaction([
      prisma.generalExpenses.deleteMany({ where: { tenantId: req.user!.tenantId } }),
      ...(data.length ? [prisma.generalExpenses.createMany({ data })] : []),
    ]);

    res.json({ ok: true, count: data.length, currency });
  }),
);
