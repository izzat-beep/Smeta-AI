// Hisobotlar (Vazifa 2/3) — barcha raqamlar real, finance.ts yagona hisoblash
// manbaidan. Reja vs Fakt jadvali BudgetPlan + kategoriya faktidan quriladi.
import { Router } from 'express';
import { z } from 'zod';
import { prisma, toNum } from '../prisma.js';
import { ah } from '../util.js';
import {
  computeTenantFinance,
  monthlyExpenseSeries,
  resourceUsage,
  pctChange,
  tenantRate,
  type ExpenseCategory,
} from '../finance.js';

export const reportsRouter = Router();

const CATEGORIES: ExpenseCategory[] = ['MATERIAL', 'LABOR', 'EQUIPMENT', 'GENERAL'];

function ymKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

// GET /api/reports/summary?projectId=&from=&to= — cards + Reja/Fakt + trendlar.
async function summaryHandler(req: any, res: any) {
  const tenantId = req.user!.tenantId;
  const q = z
    .object({
      projectId: z.string().optional(),
      from: z.string().optional(),
      to: z.string().optional(),
      // 'YYYY-MM' — reja (BudgetPlan) qidiruvi uchun ANIQ davr. MUHIM: from
      // ISO'dan ymKey olish UTC serverda bir oy surilib ketadi (timezone),
      // shuning uchun frontend davri shu parametr bilan yuboriladi.
      period: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/).optional(),
    })
    .parse(req.query);

  // Sana oralig'i — standart joriy oy.
  const now = new Date();
  const from = q.from ? new Date(q.from) : new Date(now.getFullYear(), now.getMonth(), 1);
  const to = q.to ? new Date(q.to) : new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const projectId = q.projectId && q.projectId.trim() ? q.projectId.trim() : undefined;
  const period = q.period ?? ymKey(from);
  const range = { from, to, projectId };

  // Oldingi teng uzunlikdagi davr (foiz o'zgarish uchun).
  const spanMs = to.getTime() - from.getTime();
  const prevRange = { from: new Date(from.getTime() - spanMs), to: from, projectId };

  const [cur, prev, dynamics, usage, plans, rate] = await Promise.all([
    computeTenantFinance(tenantId, range),
    computeTenantFinance(tenantId, prevRange),
    monthlyExpenseSeries(tenantId, 6, projectId ?? undefined),
    resourceUsage(tenantId, projectId ?? undefined),
    prisma.budgetPlan.findMany({
      where: { tenantId, projectId: projectId ?? null, period },
    }),
    tenantRate(tenantId),
  ]);
  const planToUzs = (amount: number, currency: string) => (currency === 'USD' ? amount * rate : amount);

  const planMap = new Map<string, { amount: number; id: string }>();
  for (const p of plans) planMap.set(p.category, { amount: planToUzs(toNum(p.plannedAmount), p.currency), id: p.id });

  // Reja vs Fakt: kategoriya bo'yicha reja, fakt, farq (fakt - reja).
  // planId — rejani o'chirish/tahrirlash uchun (boshqaruv imkoniyati).
  const planFakt = CATEGORIES.map((category) => {
    const plan = planMap.get(category);
    const planned = plan?.amount ?? 0;
    const fakt = cur.faktByCategory[category];
    return { category, planned, fakt, diff: fakt - planned, planId: plan?.id ?? null };
  });

  res.json({
    currency: 'UZS',
    from: from.toISOString(),
    to: to.toISOString(),
    period,
    projectId: projectId ?? null,
    // Kartalar
    totalExpense: cur.totalExpense,
    materialCost: cur.materialCost,
    laborCost: cur.laborCost,
    generalCost: cur.generalCost,
    incoming: cur.incoming,
    netProfit: cur.netProfit,
    // Real foiz o'zgarish (o'tgan davr bo'sh bo'lsa null → badge yashirin)
    trends: {
      totalExpense: pctChange(cur.totalExpense, prev.totalExpense),
      materialCost: pctChange(cur.materialCost, prev.materialCost),
      laborCost: pctChange(cur.laborCost, prev.laborCost),
      netProfit: pctChange(cur.netProfit, prev.netProfit),
      incoming: pctChange(cur.incoming, prev.incoming),
    },
    planFakt,
    resourceUsage: usage,
    costDynamics: dynamics,
  });
}

reportsRouter.get('/summary', ah(summaryHandler));
reportsRouter.get('/', ah(summaryHandler)); // orqaga moslik (Reports sahifasi)
