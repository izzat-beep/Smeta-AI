// Boshqaruv paneli (Vazifa 2) — BARCHA raqamlar real, finance.ts yagona
// hisoblash manbaidan (kalkulyator formulasi). Fake/hardcoded qiymatlar yo'q.
import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../prisma.js';
import { ah } from '../util.js';
import * as s from '../serialize.js';
import {
  computeTenantFinance,
  monthlyExpenseSeries,
  monthOverMonthTrends,
  resourceUsage,
} from '../finance.js';

export const dashboardRouter = Router();

// GET /api/dashboard — sahifa uchun jamlangan javob (statlar + loyihalar + faollik)
dashboardRouter.get(
  '/',
  ah(async (req, res) => {
    const tenantId = req.user!.tenantId;

    const [finance, projects, activities, teamCount, trend12] = await Promise.all([
      computeTenantFinance(tenantId),
      prisma.project.findMany({ where: { tenantId }, include: { manager: true }, orderBy: { createdAt: 'desc' } }),
      prisma.activity.findMany({
        where: { tenantId },
        include: { user: true },
        orderBy: { createdAt: 'desc' },
        take: 6,
      }),
      prisma.user.count({ where: { tenantId } }),
      monthlyExpenseSeries(tenantId, 12),
    ]);

    const activeProjects = projects.filter((p) => p.status === 'IN_PROGRESS');
    const productivity =
      projects.length > 0
        ? Math.round(projects.reduce((sum, p) => sum + p.progress, 0) / projects.length)
        : 0;

    // AI tavsiyasi — real ma'lumotga qarab tanlanadi (fake statistika emas)
    let aiRecommendation = '';
    if (finance.totalExpense === 0) {
      aiRecommendation =
        "Hali xarajat ma'lumotlari yo'q. Kalkulyatorda birinchi smetani yarating — men tahlil qilib beraman.";
    } else if (finance.orderExpenses > 0 && finance.orderExpenses > finance.manualExpenses) {
      aiRecommendation =
        "Xarajatlaringizning katta qismi material buyurtmalaridan. Katalogdagi sotuvchilar narxlarini solishtirib, yirik xaridlarda chegirma so'rashni tavsiya qilaman.";
    } else if (finance.laborCost > finance.materialCost) {
      aiRecommendation =
        "Ishchi kuchi xarajatlari material xarajatlaridan yuqori. Ish unumdorligini oshirish yoki narxlarni qayta ko'rib chiqish foydali bo'lishi mumkin.";
    } else {
      aiRecommendation =
        "Xarajatlar tarkibida materiallar ustunlik qilmoqda. Yetkazib beruvchilar bilan optoviy shartnoma tuzishni ko'rib chiqing.";
    }

    res.json({
      stats: {
        totalExpenses: finance.totalExpense,
        pendingEstimates: finance.estimatesCount,
        pendingApproval: finance.pendingEstimates,
        teamCount,
        activeObjects: activeProjects.length,
        productivity,
        budgetTrend: trend12.map((p) => p.actual),
      },
      activeProjects: activeProjects.slice(0, 3).map(s.project),
      recentActivity: activities.map(s.activity),
      aiRecommendation,
    });
  }),
);

// GET /api/dashboard/stats — moliyaviy agregatlar + real oylik trendlar.
// umumiyXarajat=totalExpense, materialXarajati=materialCost, ishchiKuchi=laborCost,
// sofFoyda=netProfit, kutilayotganSmetalar=pendingEstimates, unumdorlik alohida.
dashboardRouter.get(
  '/stats',
  ah(async (req, res) => {
    const tenantId = req.user!.tenantId;
    const [finance, trends] = await Promise.all([
      computeTenantFinance(tenantId),
      monthOverMonthTrends(tenantId),
    ]);
    res.json({ ...finance, trends, currency: 'UZS' });
  }),
);

// GET /api/dashboard/expense-dynamics?months=6 — oylik haqiqiy vs rejalashtirilgan
dashboardRouter.get(
  '/expense-dynamics',
  ah(async (req, res) => {
    const months = z.coerce.number().int().min(1).max(24).default(6).parse(req.query.months ?? 6);
    const series = await monthlyExpenseSeries(req.user!.tenantId, months);
    res.json({ months: series, currency: 'UZS' });
  }),
);

// GET /api/dashboard/resource-usage — resurs sarfi foizlari (smeta pozitsiyalaridan)
dashboardRouter.get(
  '/resource-usage',
  ah(async (req, res) => {
    res.json(await resourceUsage(req.user!.tenantId));
  }),
);
