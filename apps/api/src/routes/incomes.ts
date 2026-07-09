// Daromad yozuvlari CRUD (Vazifa 3C) — "+ Ma'lumot qo'shish" → Daromad.
// Tenant-scoped: har kim faqat o'z yozuvlarini ko'radi/o'zgartiradi.
import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../prisma.js';
import { ah } from '../util.js';
import * as s from '../serialize.js';

export const incomesRouter = Router();

const upsertSchema = z.object({
  projectId: z.string().optional().nullable(),
  amount: z.number().positive(),
  currency: z.enum(['UZS', 'USD']).optional(),
  date: z.string().optional().nullable(),
  description: z.string().max(500).optional().nullable(),
});

// Loyiha shu tenantnikimi (begona ID ulanmasin)
async function checkProject(tenantId: string, projectId: string | null | undefined): Promise<boolean> {
  if (!projectId) return true;
  const p = await prisma.project.findFirst({ where: { id: projectId, tenantId }, select: { id: true } });
  return !!p;
}

// GET /api/incomes?projectId=&from=&to=
incomesRouter.get(
  '/',
  ah(async (req, res) => {
    const projectId = typeof req.query.projectId === 'string' && req.query.projectId.trim() ? req.query.projectId.trim() : undefined;
    const from = typeof req.query.from === 'string' && req.query.from ? new Date(req.query.from) : undefined;
    const to = typeof req.query.to === 'string' && req.query.to ? new Date(req.query.to) : undefined;
    const rows = await prisma.income.findMany({
      where: {
        tenantId: req.user!.tenantId,
        ...(projectId ? { projectId } : {}),
        ...(from || to ? { date: { ...(from ? { gte: from } : {}), ...(to ? { lt: to } : {}) } } : {}),
      },
      orderBy: { date: 'desc' },
      take: 200,
    });
    res.json(rows.map(s.income));
  }),
);

// POST /api/incomes
incomesRouter.post(
  '/',
  ah(async (req, res) => {
    const b = upsertSchema.parse(req.body);
    const projectId = b.projectId?.trim() || null;
    if (!(await checkProject(req.user!.tenantId, projectId))) {
      return res.status(400).json({ error: 'bad_request', message: 'Loyiha topilmadi' });
    }
    const row = await prisma.income.create({
      data: {
        tenantId: req.user!.tenantId,
        projectId,
        amount: b.amount,
        currency: b.currency ?? 'UZS',
        date: b.date ? new Date(b.date) : new Date(),
        description: b.description?.trim() || null,
      },
    });
    res.status(201).json(s.income(row));
  }),
);

// PATCH /api/incomes/:id
incomesRouter.patch(
  '/:id',
  ah(async (req, res) => {
    const b = upsertSchema.partial().parse(req.body);
    const ex = await prisma.income.findFirst({ where: { id: req.params.id, tenantId: req.user!.tenantId } });
    if (!ex) return res.status(404).json({ error: 'not_found', message: 'Daromad yozuvi topilmadi' });
    const projectId = b.projectId === undefined ? undefined : b.projectId?.trim() || null;
    if (projectId !== undefined && !(await checkProject(req.user!.tenantId, projectId))) {
      return res.status(400).json({ error: 'bad_request', message: 'Loyiha topilmadi' });
    }
    const row = await prisma.income.update({
      where: { id: ex.id },
      data: {
        ...(b.amount !== undefined ? { amount: b.amount } : {}),
        ...(b.currency !== undefined ? { currency: b.currency } : {}),
        ...(b.date !== undefined ? { date: b.date ? new Date(b.date) : new Date() } : {}),
        ...(b.description !== undefined ? { description: b.description?.trim() || null } : {}),
        ...(projectId !== undefined ? { projectId } : {}),
      },
    });
    res.json(s.income(row));
  }),
);

// DELETE /api/incomes/:id
incomesRouter.delete(
  '/:id',
  ah(async (req, res) => {
    const ex = await prisma.income.findFirst({ where: { id: req.params.id, tenantId: req.user!.tenantId } });
    if (!ex) return res.status(404).json({ error: 'not_found', message: 'Daromad yozuvi topilmadi' });
    await prisma.income.delete({ where: { id: ex.id } });
    res.status(204).end();
  }),
);
