// Byudjet rejasi (Me'yor) — Reja vs Fakt jadvali uchun (Vazifa 3D).
// PUT upsert: bitta tenant+loyiha+kategoriya+davr uchun bitta reja.
// Eslatma: projectId=null bo'lganda Postgres unique NULL'larni farqlaydi,
// shu sabab upsert findFirst+update/create bilan qilinadi.
import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../prisma.js';
import { ah } from '../util.js';
import * as s from '../serialize.js';

export const budgetRouter = Router();

const PERIOD_RE = /^\d{4}-(0[1-9]|1[0-2])$/;

// GET /api/budget-plans?period=YYYY-MM&projectId=
budgetRouter.get(
  '/',
  ah(async (req, res) => {
    const period = typeof req.query.period === 'string' && PERIOD_RE.test(req.query.period)
      ? req.query.period
      : `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
    const projectId = typeof req.query.projectId === 'string' && req.query.projectId.trim() ? req.query.projectId.trim() : null;
    const rows = await prisma.budgetPlan.findMany({
      where: { tenantId: req.user!.tenantId, projectId, period },
    });
    res.json(rows.map(s.budgetPlan));
  }),
);

const upsertSchema = z.object({
  projectId: z.string().optional().nullable(),
  category: z.enum(['MATERIAL', 'LABOR', 'EQUIPMENT', 'GENERAL']),
  plannedAmount: z.number().nonnegative(),
  currency: z.enum(['UZS', 'USD']).optional(),
  period: z.string().regex(PERIOD_RE),
});

// PUT /api/budget-plans — reja kiritish/yangilash (upsert)
budgetRouter.put(
  '/',
  ah(async (req, res) => {
    const b = upsertSchema.parse(req.body);
    const tenantId = req.user!.tenantId;
    const projectId = b.projectId?.trim() || null;
    if (projectId) {
      const p = await prisma.project.findFirst({ where: { id: projectId, tenantId }, select: { id: true } });
      if (!p) return res.status(400).json({ error: 'bad_request', message: 'Loyiha topilmadi' });
    }

    const existing = await prisma.budgetPlan.findFirst({
      where: { tenantId, projectId, category: b.category, period: b.period },
    });
    const row = existing
      ? await prisma.budgetPlan.update({
          where: { id: existing.id },
          data: { plannedAmount: b.plannedAmount, currency: b.currency ?? 'UZS' },
        })
      : await prisma.budgetPlan.create({
          data: {
            tenantId,
            projectId,
            category: b.category,
            plannedAmount: b.plannedAmount,
            currency: b.currency ?? 'UZS',
            period: b.period,
          },
        });
    res.json(s.budgetPlan(row));
  }),
);

// DELETE /api/budget-plans/:id
budgetRouter.delete(
  '/:id',
  ah(async (req, res) => {
    const ex = await prisma.budgetPlan.findFirst({ where: { id: req.params.id, tenantId: req.user!.tenantId } });
    if (!ex) return res.status(404).json({ error: 'not_found', message: 'Reja topilmadi' });
    await prisma.budgetPlan.delete({ where: { id: ex.id } });
    res.status(204).end();
  }),
);
