import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../prisma.js';
import { ah } from '../util.js';
import * as s from '../serialize.js';
import { estimateTotals } from '../finance.js';
import { replaceGeneralExpenses } from '../expensesService.js';

export const estimatesRouter = Router();

const itemSchema = z.object({
  materialId: z.string().optional().nullable(),
  name: z.string().min(1),
  type: z.enum(['MATERIAL', 'LABOR', 'EQUIPMENT']).optional(),
  paymentType: z.enum(['PER_M2', 'PER_M3', 'PER_METER', 'PER_UNIT', 'FIXED', 'HOURLY']).optional().nullable(),
  qty: z.number().nonnegative(),
  unit: z.string().optional(),
  unitPrice: z.number().nonnegative(),
});

const stageSchema = z.object({
  label: z.string().min(1),
  date: z.string().optional().nullable(),
  amount: z.number().nonnegative().optional(),
  currency: z.enum(['UZS', 'USD']).optional(),
});

// Umumiy harajatlar qatori (kalkulyatorning bitta "Saqlash" oqimi bilan birga keladi).
const generalExpenseRowSchema = z.object({
  name: z.string().optional().default(''),
  amount: z.union([z.number(), z.string()]).optional().default(0),
  orderId: z.string().optional().nullable(),
});

const createSchema = z.object({
  title: z.string().min(1),
  projectId: z.string().optional().nullable(),
  currency: z.enum(['UZS', 'USD']).optional(),
  taxRate: z.number().min(0).max(100).optional(),
  items: z.array(itemSchema).default([]),
  stages: z.array(stageSchema).default([]),
  // Vazifa 1A: kalkulyatorning "Umumiy Harajatlar" bo'limi shu bilan birga saqlanadi.
  // Berilmasa (undefined) — tegilmaydi; berilsa — projectId doirasida replace-all.
  generalExpenses: z.array(generalExpenseRowSchema).optional(),
  generalExpensesCurrency: z.enum(['UZS', 'USD']).optional(),
});

// Tezkor hisoblash (saqlamasdan) — kalkulyator ekrani uchun.
// Formula finance.ts'da (yagona hisoblash manbai — Vazifa 2).
estimatesRouter.post(
  '/calc',
  ah(async (req, res) => {
    const body = z.object({ items: z.array(itemSchema).default([]), taxRate: z.number().optional() }).parse(req.body);
    const items = body.items.map((i) => ({ ...i, lineTotal: i.qty * i.unitPrice }));
    const t = estimateTotals(items, body.taxRate ?? 12);
    const byType = { MATERIAL: 0, LABOR: 0, EQUIPMENT: 0 } as Record<string, number>;
    for (const i of items) byType[i.type ?? 'MATERIAL'] += i.qty * i.unitPrice;
    res.json({ items, ...t, breakdown: byType });
  }),
);

estimatesRouter.get(
  '/',
  ah(async (req, res) => {
    // ?projectId=<id> — shu loyihaning smetalari; ?projectId=none — loyihasizlar
    const projRaw = typeof req.query.projectId === 'string' ? req.query.projectId.trim() : '';
    const proj = projRaw === 'none' ? { projectId: null } : projRaw ? { projectId: projRaw } : {};
    const estimates = await prisma.estimate.findMany({
      where: { tenantId: req.user!.tenantId, ...proj },
      include: { items: true, stages: { orderBy: { order: 'asc' } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json(estimates.map(s.estimate));
  }),
);

// PATCH /api/estimates/:id — loyihaga bog'lash/uzish yoki nomini o'zgartirish (T2)
estimatesRouter.patch(
  '/:id',
  ah(async (req, res) => {
    const tenantId = req.user!.tenantId;
    const body = z
      .object({ projectId: z.string().optional().nullable(), title: z.string().min(1).optional() })
      .parse(req.body);
    const ex = await prisma.estimate.findFirst({ where: { id: req.params.id, tenantId } });
    if (!ex) return res.status(404).json({ error: 'not_found', message: 'Smeta topilmadi' });
    const projectId = body.projectId === undefined ? undefined : body.projectId?.trim() || null;
    if (projectId) {
      const p = await prisma.project.findFirst({ where: { id: projectId, tenantId }, select: { id: true } });
      if (!p) return res.status(400).json({ error: 'bad_request', message: 'Loyiha topilmadi' });
    }
    const e = await prisma.estimate.update({
      where: { id: ex.id },
      data: {
        ...(projectId !== undefined ? { projectId } : {}),
        ...(body.title !== undefined ? { title: body.title.trim() } : {}),
      },
      include: { items: true, stages: { orderBy: { order: 'asc' } } },
    });
    res.json(s.estimate(e));
  }),
);

estimatesRouter.get(
  '/:id',
  ah(async (req, res) => {
    const e = await prisma.estimate.findFirst({
      where: { id: req.params.id, tenantId: req.user!.tenantId },
      include: { items: true, stages: { orderBy: { order: 'asc' } } },
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
    const projectId = body.projectId ?? null;
    const t = estimateTotals(body.items, taxRate);

    // projectId berilsa — shu tenant loyihasi ekanini tekshiramiz (begona ID ulanmasin).
    if (projectId) {
      const p = await prisma.project.findFirst({ where: { id: projectId, tenantId } });
      if (!p) return res.status(400).json({ error: 'bad_request', message: 'Loyiha topilmadi' });
    }

    // Bitta tranzaksiya: smeta (items + stages) VA umumiy harajatlar — birga saqlanadi.
    const e = await prisma.$transaction(async (tx) => {
      const created = await tx.estimate.create({
        data: {
          tenantId,
          projectId,
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
              paymentType: i.paymentType ?? null,
              qty: i.qty,
              unit: i.unit ?? 'dona',
              unitPrice: i.unitPrice,
              lineTotal: i.qty * i.unitPrice,
            })),
          },
          stages: {
            create: body.stages.map((st, idx) => ({
              label: st.label,
              date: st.date ? new Date(st.date) : null,
              amount: st.amount ?? 0,
              currency: st.currency ?? 'UZS',
              order: idx,
            })),
          },
        },
        include: { items: true, stages: { orderBy: { order: 'asc' } } },
      });

      // Umumiy harajatlar bo'limi (agar yuborilgan bo'lsa) — shu loyiha doirasida.
      if (body.generalExpenses) {
        await replaceGeneralExpenses(
          tx,
          tenantId,
          projectId,
          body.generalExpensesCurrency ?? body.currency ?? 'UZS',
          body.generalExpenses,
        );
      }

      await tx.activity.create({
        data: { tenantId, userId: req.user!.sub, action: 'yangi smeta yaratdi', projectName: body.title },
      });
      return created;
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
