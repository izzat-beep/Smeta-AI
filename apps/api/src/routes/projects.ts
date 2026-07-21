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
    const q = (req.query.q as string | undefined)?.trim().slice(0, 100);
    const status = (req.query.status as string | undefined)?.slice(0, 40);
    const where: any = { tenantId };
    if (q) where.OR = [{ title: { contains: q, mode: 'insensitive' } }, { clientName: { contains: q, mode: 'insensitive' } }];
    if (status) where.status = status;
    const projects = await prisma.project.findMany({
      where,
      include: { manager: true },
      orderBy: { createdAt: 'desc' },
      take: 500, // CWE-770 xavfsizlik cap'i (to'liq pagination — To'lqin 2b)
    });
    res.json(projects.map(s.project));
  }),
);

// GET /api/projects/summaries — ro'yxat kartalari uchun har loyihaning
// sarflangan/daromad jamlari. groupBy bilan bitta so'rovlar to'plami (N+1 yo'q).
// MUHIM: '/:id' dan OLDIN ro'yxatdan o'tishi kerak.
projectsRouter.get(
  '/summaries',
  ah(async (req, res) => {
    const tenantId = req.user!.tenantId;
    const [tenant, estimates, expenses, incomes, sales] = await Promise.all([
      prisma.tenant.findUnique({ where: { id: tenantId }, select: { usdRate: true } }),
      prisma.estimate.groupBy({
        by: ['projectId'],
        where: { tenantId, projectId: { not: null } },
        _sum: { total: true },
        _count: { _all: true },
      }),
      prisma.generalExpenses.groupBy({
        by: ['projectId', 'currency'],
        where: { tenantId, projectId: { not: null } },
        _sum: { amount: true },
      }),
      prisma.income.groupBy({
        by: ['projectId', 'currency'],
        where: { tenantId, projectId: { not: null } },
        _sum: { amount: true },
      }),
      prisma.sale.groupBy({
        by: ['projectId', 'currency'],
        where: { tenantId, projectId: { not: null } },
        _sum: { paid: true },
      }),
    ]);
    const rate = toNum(tenant?.usdRate ?? 12600) || 12600;
    const toUzs = (v: number, cur: string) => (cur === 'USD' ? v * rate : v);

    const map = new Map<string, { spent: number; income: number; estimatesCount: number }>();
    const entry = (id: string) => {
      if (!map.has(id)) map.set(id, { spent: 0, income: 0, estimatesCount: 0 });
      return map.get(id)!;
    };
    for (const g of estimates) {
      const e = entry(g.projectId!);
      e.spent += toNum(g._sum.total); // smeta bazaviy UZS
      e.estimatesCount = g._count._all;
    }
    for (const g of expenses) entry(g.projectId!).spent += toUzs(g._sum.amount ?? 0, g.currency);
    for (const g of incomes) entry(g.projectId!).income += toUzs(toNum(g._sum.amount), g.currency);
    for (const g of sales) entry(g.projectId!).income += toUzs(toNum(g._sum.paid), g.currency);

    res.json(Object.fromEntries(map));
  }),
);

// GET /api/projects/:id/summary — hisoblangan KPI'lar (Umumiy tab).
// Barchasi aggregate/groupBy bilan, UZS'ga normallashtirilgan. Statik raqam yo'q.
projectsRouter.get(
  '/:id/summary',
  ah(async (req, res) => {
    const tenantId = req.user!.tenantId;
    const project = await prisma.project.findFirst({ where: { id: req.params.id, tenantId } });
    if (!project) return res.status(404).json({ error: 'not_found', message: 'Loyiha topilmadi' });
    const projectId = project.id;

    const [tenant, est, exp, inc, sal] = await Promise.all([
      prisma.tenant.findUnique({ where: { id: tenantId }, select: { usdRate: true } }),
      prisma.estimate.aggregate({ where: { tenantId, projectId }, _sum: { total: true }, _count: { _all: true } }),
      prisma.generalExpenses.groupBy({ by: ['currency'], where: { tenantId, projectId }, _sum: { amount: true } }),
      prisma.income.groupBy({ by: ['currency'], where: { tenantId, projectId }, _sum: { amount: true } }),
      prisma.sale.groupBy({ by: ['currency'], where: { tenantId, projectId }, _sum: { paid: true } }),
    ]);
    const rate = toNum(tenant?.usdRate ?? 12600) || 12600;
    const toUzs = (v: number, cur: string) => (cur === 'USD' ? v * rate : v);

    const totalEstimates = toNum(est._sum.total);
    const totalExpenses = totalEstimates + exp.reduce((s2, g) => s2 + toUzs(g._sum.amount ?? 0, g.currency), 0);
    const totalIncome =
      inc.reduce((s2, g) => s2 + toUzs(toNum(g._sum.amount), g.currency), 0) +
      sal.reduce((s2, g) => s2 + toUzs(toNum(g._sum.paid), g.currency), 0);
    const budget = toUzs(toNum(project.value), project.currency);
    const netProfit = totalIncome - totalExpenses;
    const budgetUsedPercent = budget > 0 ? Math.round((totalExpenses / budget) * 1000) / 10 : null;

    res.json({
      projectId,
      currency: 'UZS',
      budget,
      totalEstimates,
      estimatesCount: est._count._all,
      totalExpenses,
      totalIncome,
      netProfit,
      budgetUsedPercent, // budjet 0 bo'lsa null -> frontend "—" ko'rsatadi
    });
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
  // T2 (brief v3)
  address: z.string().max(300).optional().nullable(),
  description: z.string().max(2000).optional().nullable(),
  startDate: z.string().optional().nullable(),
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
        address: body.address?.trim() || null,
        description: body.description?.trim() || null,
        startDate: body.startDate ? new Date(body.startDate) : null,
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
        startDate: body.startDate !== undefined ? (body.startDate ? new Date(body.startDate) : null) : undefined,
        address: body.address !== undefined ? body.address?.trim() || null : undefined,
        description: body.description !== undefined ? body.description?.trim() || null : undefined,
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
    // T2: smetalari bor loyihani o'chirish BLOKlanadi — avval arxivlash tavsiya qilinadi.
    const estCount = await prisma.estimate.count({ where: { projectId: req.params.id } });
    if (estCount > 0) {
      return res.status(409).json({
        error: 'conflict',
        message: "Loyihada smetalar bor — avval arxivlang yoki smetalarni ko'chiring",
        estimates: estCount,
      });
    }
    await prisma.project.delete({ where: { id: req.params.id } });
    res.status(204).end();
  }),
);
