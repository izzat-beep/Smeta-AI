import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../prisma.js';
import { ah } from '../util.js';
import * as s from '../serialize.js';

export const estimatesRouter = Router();

const itemSchema = z.object({
  materialId: z.string().optional().nullable(),
  name: z.string().min(1),
  type: z.enum(['MATERIAL', 'LABOR', 'EQUIPMENT']).optional(),
  qty: z.number().nonnegative(),
  unit: z.string().optional(),
  unitPrice: z.number().nonnegative(),
});

const createSchema = z.object({
  title: z.string().min(1),
  projectId: z.string().optional().nullable(),
  currency: z.enum(['UZS', 'USD']).optional(),
  taxRate: z.number().min(0).max(100).optional(),
  items: z.array(itemSchema).default([]),
});

function totals(items: { qty: number; unitPrice: number }[], taxRate: number) {
  const subtotal = items.reduce((sum, i) => sum + i.qty * i.unitPrice, 0);
  const taxAmount = (subtotal * taxRate) / 100;
  return { subtotal, taxAmount, total: subtotal + taxAmount };
}

// Tezkor hisoblash (saqlamasdan) — kalkulyator ekrani uchun
estimatesRouter.post(
  '/calc',
  ah(async (req, res) => {
    const body = z.object({ items: z.array(itemSchema).default([]), taxRate: z.number().optional() }).parse(req.body);
    const items = body.items.map((i) => ({ ...i, lineTotal: i.qty * i.unitPrice }));
    const t = totals(items, body.taxRate ?? 12);
    const byType = { MATERIAL: 0, LABOR: 0, EQUIPMENT: 0 } as Record<string, number>;
    for (const i of items) byType[i.type ?? 'MATERIAL'] += i.qty * i.unitPrice;
    res.json({ items, ...t, breakdown: byType });
  }),
);

estimatesRouter.get(
  '/',
  ah(async (req, res) => {
    const estimates = await prisma.estimate.findMany({
      where: { tenantId: req.user!.tenantId },
      include: { items: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json(estimates.map(s.estimate));
  }),
);

estimatesRouter.get(
  '/:id',
  ah(async (req, res) => {
    const e = await prisma.estimate.findFirst({
      where: { id: req.params.id, tenantId: req.user!.tenantId },
      include: { items: true },
    });
    if (!e) return res.status(404).json({ error: 'not_found', message: 'Smeta topilmadi' });
    res.json(s.estimate(e));
  }),
);

estimatesRouter.post(
  '/',
  ah(async (req, res) => {
    const tenantId = req.user!.tenantId;
    const body = createSchema.parse(req.body);
    const taxRate = body.taxRate ?? 12;
    const t = totals(body.items, taxRate);
    const e = await prisma.estimate.create({
      data: {
        tenantId,
        projectId: body.projectId ?? null,
        title: body.title,
        currency: body.currency ?? 'UZS',
        taxRate,
        subtotal: t.subtotal,
        taxAmount: t.taxAmount,
        total: t.total,
        status: 'DRAFT',
        items: {
          create: body.items.map((i) => ({
            materialId: i.materialId ?? null,
            name: i.name,
            type: i.type ?? 'MATERIAL',
            qty: i.qty,
            unit: i.unit ?? 'dona',
            unitPrice: i.unitPrice,
            lineTotal: i.qty * i.unitPrice,
          })),
        },
      },
      include: { items: true },
    });
    await prisma.activity.create({
      data: { tenantId, userId: req.user!.sub, action: 'yangi smeta yaratdi', projectName: body.title },
    });
    res.status(201).json(s.estimate(e));
  }),
);

estimatesRouter.delete(
  '/:id',
  ah(async (req, res) => {
    const existing = await prisma.estimate.findFirst({ where: { id: req.params.id, tenantId: req.user!.tenantId } });
    if (!existing) return res.status(404).json({ error: 'not_found', message: 'Smeta topilmadi' });
    await prisma.estimate.delete({ where: { id: req.params.id } });
    res.status(204).end();
  }),
);
