// Hisobotlar (Vazifa 2) — barcha raqamlar real, finance.ts yagona hisoblash
// manbaidan. Fake trend (12.5%...) va prognoz foyda (42%) olib tashlandi.
import { Router } from 'express';
import { ah } from '../util.js';
import {
  computeTenantFinance,
  monthlyExpenseSeries,
  monthOverMonthTrends,
  resourceUsage,
} from '../finance.js';

export const reportsRouter = Router();

reportsRouter.get(
  '/',
  ah(async (req, res) => {
    const tenantId = req.user!.tenantId;
    const [f, trends, usage, dynamics] = await Promise.all([
      computeTenantFinance(tenantId),
      monthOverMonthTrends(tenantId),
      resourceUsage(tenantId),
      monthlyExpenseSeries(tenantId, 6),
    ]);

    // P&L — real kategoriyalar. key'lar frontendda i18n bilan tarjima qilinadi.
    // status ma'lumotdan kelib chiqadi: xarajat ulushi >50% -> 'warn', aks holda 'ok';
    // daromad qatori musbat bo'lsa 'good'.
    const totalExp = f.totalExpense || 1;
    const share = (v: number) => v / totalExp;
    const pnl = [
      { key: 'materials', revenue: 0, expense: f.materialCost, profit: -f.materialCost, status: share(f.materialCost) > 0.5 ? 'warn' : 'ok' },
      { key: 'labor', revenue: 0, expense: f.laborCost, profit: -f.laborCost, status: share(f.laborCost) > 0.5 ? 'warn' : 'ok' },
      { key: 'equipment', revenue: 0, expense: f.equipmentCost, profit: -f.equipmentCost, status: share(f.equipmentCost) > 0.5 ? 'warn' : 'ok' },
      { key: 'general', revenue: 0, expense: f.manualExpenses, profit: -f.manualExpenses, status: share(f.manualExpenses) > 0.5 ? 'warn' : 'ok' },
      { key: 'sales', revenue: f.incoming, expense: 0, profit: f.incoming, status: f.incoming > 0 ? 'good' : 'ok' },
    ];

    res.json({
      totalExpense: f.totalExpense,
      materialCost: f.materialCost,
      laborCost: f.laborCost,
      netProfit: f.netProfit,
      incoming: f.incoming,
      trends, // real oy-ma-oy; o'tgan oy bo'sh bo'lsa null -> badge yashiriladi
      resourceUsage: usage,
      costDynamics: dynamics, // [{ ym: '2026-07', actual, planned }]
      pnl,
      currency: 'UZS',
    });
  }),
);
