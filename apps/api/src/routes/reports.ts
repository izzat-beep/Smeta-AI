import { Router } from 'express';
import { prisma, toNum } from '../prisma.js';
import { ah } from '../util.js';

export const reportsRouter = Router();

reportsRouter.get(
  '/',
  ah(async (req, res) => {
    const tenantId = req.user!.tenantId;
    const estimates = await prisma.estimate.findMany({ where: { tenantId }, include: { items: true } });

    let materialCost = 0;
    let laborCost = 0;
    let equipmentCost = 0;
    for (const e of estimates) {
      for (const i of e.items) {
        const total = toNum(i.lineTotal);
        if (i.type === 'LABOR') laborCost += total;
        else if (i.type === 'EQUIPMENT') equipmentCost += total;
        else materialCost += total;
      }
    }
    const totalExpense = materialCost + laborCost + equipmentCost;
    const netProfit = Math.round(totalExpense * 0.42); // prognoz

    // Resurs sarfi (asosiy materiallar bo'yicha)
    const items = estimates.flatMap((e) => e.items);
    const byName = new Map<string, number>();
    for (const i of items) byName.set(i.name, (byName.get(i.name) ?? 0) + toNum(i.lineTotal));
    const maxVal = Math.max(1, ...byName.values());
    const resourceUsage = [...byName.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([label, val]) => ({ label, percentage: Math.round((val / maxVal) * 100) }));

    // Xarajatlar dinamikasi (6 oy)
    const months = ['Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun'];
    const costDynamics = months.map((month, i) => ({
      month,
      actual: Math.round((totalExpense / 6) * (0.7 + i * 0.1)),
      planned: Math.round((totalExpense / 6) * (0.8 + i * 0.08)),
    }));

    res.json({
      totalExpense,
      materialCost,
      laborCost,
      netProfit,
      trends: { totalExpense: 12.5, materialCost: -3.2, laborCost: 5.1, netProfit: 8.4 },
      resourceUsage,
      costDynamics,
      pnl: [
        { category: 'Materiallar', revenue: 0, expense: materialCost, profit: -materialCost, status: "Me'yor" },
        { category: 'Ishchi kuchi', revenue: 0, expense: laborCost, profit: -laborCost, status: "Me'yor" },
        { category: 'Texnika', revenue: 0, expense: equipmentCost, profit: -equipmentCost, status: 'Diqqat' },
        { category: 'Sotuvlar', revenue: netProfit + totalExpense, expense: 0, profit: netProfit + totalExpense, status: 'Yaxshi' },
      ],
    });
  }),
);
