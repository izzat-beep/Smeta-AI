import { Router } from 'express';
import { z } from 'zod';
import { prisma, toNum } from '../prisma.js';
import { ah } from '../util.js';
import { requireRole } from '../auth.js';
import * as s from '../serialize.js';

export const projectsRouter = Router();

projectsRouter.get(
  '/',
  ah(async (req, res) => {
    const tenantId = req.user!.tenantId;
    const q = (req.query.q as string | undefined)?.trim();
    const status = req.query.status as string | undefined;
    const where: any = { tenantId };
    if (q) where.OR = [{ title: { contains: q, mode: 'insensitive' } }, { clientName: { contains: q, mode: 'insensitive' } }];
    if (status) where.status = status;
    const projects = await prisma.project.findMany({
      where,
      include: { manager: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json(projects.map(s.project));
  }),
);

projectsRouter.get(
  '/:id',
  ah(async (req, res) => {
    const p = await prisma.project.findFirst({
      where: { id: req.params.id, tenantId: req.user!.tenantId },
      include: { manager: true, estimates: { include: { items: true } } },
    });
    if (!p) return res.status(404).json({ error: 'not_found', message: 'Loyiha topilmadi' });
    res.json({ ...s.project(p), estimates: p.estimates.map(s.estimate) });
  }),
);

// GET /api/projects/:id/finance — bino moliyasi (kelgan pul, harajat, foyda).
// Barcha summalar tenant kursida UZS'ga normallashtirilib hisoblanadi.
projectsRouter.get(
  '/:id/finance',
  ah(async (req, res) => {
    const tenantId = req.user!.tenantId;
    const [project, tenant] = await Promise.all([
      prisma.project.findFirst({
        where: { id: req.params.id, tenantId },
        include: { sales: { select: { price: true, paid: true, currency: true } } },
      }),
      prisma.tenant.findUnique({ where: { id: tenantId }, select: { usdRate: true } }),
    ]);
    if (!project) return res.status(404).json({ error: 'not_found', message: 'Loyiha topilmadi' });

    const expenses = await prisma.generalExpenses.findMany({
      where: { tenantId, projectId: req.params.id },
      select: { amount: true, currency: true },
    });

    const rate = toNum(tenant?.usdRate ?? 12600) || 12600;
    const toUzs = (amount: number, currency: string) => (currency === 'USD' ? amount * rate : amount);

    let incoming = 0;
    let salesTotal = 0;
    for (const sale of project.sales) {
      salesTotal += toUzs(toNum(sale.price), sale.currency);
      incoming += toUzs(toNum(sale.paid), sale.currency);
    }
    const expensesTotal = expenses.reduce((sum, e) => sum + toUzs(e.amount, e.currency), 0);
    const purchasePrice = toNum(project.purchasePrice);
    const remaining = salesTotal - incoming;
    const profit = incoming - purchasePrice - expensesTotal;

    res.json({
      projectId: project.id,
      title: project.title,
      currency: 'UZS', // normallashtirilgan
      rate,
      totalUnits: project.totalUnits,
      soldUnits: project.sales.length,
      purchasePrice,
      salesTotal,
      incoming,
      remaining,
      expenses: expensesTotal,
      profit,
    });
  }),
);

const upsertSchema = z.object({
  title: z.string().min(2),
  clientName: z.string().min(1),
  category: z.string().optional(),
  value: z.number().nonnegative().optional(),
  currency: z.enum(['UZS', 'USD']).optional(),
  deadline: z.string().optional().nullable(),
  progress: z.number().min(0).max(100).optional(),
  status: z.enum(['PLANNED', 'IN_PROGRESS', 'COMPLETED', 'ARCHIVED']).optional(),
  managerId: z.string().optional().nullable(),
  totalUnits: z.number().int().nonnegative().optional(),
  purchasePrice: z.number().nonnegative().optional(),
});

projectsRouter.post(
  '/',
  ah(async (req, res) => {
    const tenantId = req.user!.tenantId;
    const body = upsertSchema.parse(req.body);
    const count = await prisma.project.count({ where: { tenantId } });
    const code = `PRJ-${String(count + 1).padStart(3, '0')}`;
    const p = await prisma.project.create({
      data: {
        tenantId,
        code,
        title: body.title,
        clientName: body.clientName,
        category: body.category ?? 'Umumiy',
        value: body.value ?? 0,
        currency: body.currency ?? 'UZS',
        deadline: body.deadline ? new Date(body.deadline) : null,
        progress: body.progress ?? 0,
        status: body.status ?? 'PLANNED',
        managerId: body.managerId ?? null,
        totalUnits: body.totalUnits ?? 0,
        purchasePrice: body.purchasePrice ?? 0,
      },
      include: { manager: true },
    });
    await prisma.activity.create({
      data: { tenantId, userId: req.user!.sub, action: 'yangi loyiha yaratdi', projectName: p.title },
    });
    res.status(201).json(s.project(p));
  }),
);

projectsRouter.patch(
  '/:id',
  ah(async (req, res) => {
    const tenantId = req.user!.tenantId;
    const existing = await prisma.project.findFirst({ where: { id: req.params.id, tenantId } });
    if (!existing) return res.status(404).json({ error: 'not_found', message: 'Loyiha topilmadi' });
    const body = upsertSchema.partial().parse(req.body);
    const p = await prisma.project.update({
      where: { id: req.params.id },
      data: {
        ...body,
        deadline: body.deadline !== undefined ? (body.deadline ? new Date(body.deadline) : null) : undefined,
      },
      include: { manager: true },
    });
    res.json(s.project(p));
  }),
);

projectsRouter.delete(
  '/:id',
  requireRole('OWNER', 'MANAGER'),
  ah(async (req, res) => {
    const tenantId = req.user!.tenantId;
    const existing = await prisma.project.findFirst({ where: { id: req.params.id, tenantId } });
    if (!existing) return res.status(404).json({ error: 'not_found', message: 'Loyiha topilmadi' });
    await prisma.project.delete({ where: { id: req.params.id } });
    res.status(204).end();
  }),
);
