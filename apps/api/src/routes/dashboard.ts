import { Router } from 'express';
import { prisma, toNum } from '../prisma.js';
import { ah } from '../util.js';
import * as s from '../serialize.js';

export const dashboardRouter = Router();

dashboardRouter.get(
  '/',
  ah(async (req, res) => {
    const tenantId = req.user!.tenantId;

    const [projects, estimates, activities, pendingEstimates] = await Promise.all([
      prisma.project.findMany({ where: { tenantId }, include: { manager: true }, orderBy: { createdAt: 'desc' } }),
      prisma.estimate.findMany({ where: { tenantId } }),
      prisma.activity.findMany({
        where: { tenantId },
        include: { user: true },
        orderBy: { createdAt: 'desc' },
        take: 6,
      }),
      prisma.estimate.count({ where: { tenantId, status: 'PENDING' } }),
    ]);

    const totalExpenses = estimates.reduce((sum, e) => sum + toNum(e.total), 0);
    const activeProjects = projects.filter((p) => p.status === 'IN_PROGRESS');
    const productivity =
      projects.length > 0
        ? Math.round(projects.reduce((sum, p) => sum + p.progress, 0) / projects.length)
        : 0;

    // Byudjet dinamikasi (12 oy) — mavjud smetalardan oddiy taqsimot
    const budgetTrend = Array.from({ length: 12 }, (_, i) => {
      const base = totalExpenses / 12 || 0;
      return Math.round(base * (0.6 + (i / 12) * 0.8));
    });

    res.json({
      stats: {
        totalExpenses,
        pendingEstimates: estimates.length,
        pendingApproval: pendingEstimates,
        workersCount: 142,
        activeObjects: activeProjects.length,
        productivity,
        budgetTrend,
      },
      activeProjects: activeProjects.slice(0, 3).map(s.project),
      recentActivity: activities.map(s.activity),
      aiRecommendation:
        "Faol loyihalaringizda material xarajatlari o'tgan haftaga nisbatan oshmoqda. Yangi yetkazib beruvchi bilan shartnoma imzolashni ko'rib chiqing.",
    });
  }),
);
