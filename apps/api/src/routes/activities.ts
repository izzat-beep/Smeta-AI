import { Router } from 'express';
import { prisma } from '../prisma.js';
import { ah } from '../util.js';
import * as s from '../serialize.js';

export const activitiesRouter = Router();

activitiesRouter.get(
  '/',
  ah(async (req, res) => {
    const activities = await prisma.activity.findMany({
      where: { tenantId: req.user!.tenantId },
      include: { user: true },
      orderBy: { createdAt: 'desc' },
      take: 30,
    });
    res.json(activities.map(s.activity));
  }),
);
