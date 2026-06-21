import { Router } from 'express';
import { z } from 'zod';
import { prisma, toNum } from '../prisma.js';
import { ah } from '../util.js';
import * as s from '../serialize.js';

export const salesRouter = Router();

salesRouter.get(
  '/',
  ah(async (req, res) => {
    const sales = await prisma.sale.findMany({
      where: { tenantId: req.user!.tenantId },
      orderBy: { soldAt: 'desc' },
    });
    const totalPrice = sales.reduce((a, x) => a + toNum(x.price), 0);
    const totalPaid = sales.reduce((a, x) => a + toNum(x.paid), 0);
    res.json({
      sales: sales.map(s.sale),
      totalPrice,
      totalPaid,
      remaining: totalPrice - totalPaid,
      count: sales.length,
    });
  }),
);

const upsert = z.object({
  unitName: z.string().min(1),
  buyerName: z.string().min(1),
  area: z.number().nonnegative().optional(),
  price: z.number().nonnegative(),
  paid: z.number().nonnegative().optional(),
  currency: z.enum(['UZS', 'USD']).optional(),
  soldAt: z.string().optional().nullable(),
});

salesRouter.post(
  '/',
  ah(async (req, res) => {
    const b = upsert.parse(req.body);
    const sale = await prisma.sale.create({
      data: {
        tenantId: req.user!.tenantId,
        unitName: b.unitName,
        buyerName: b.buyerName,
        area: b.area ?? 0,
        price: b.price,
        paid: b.paid ?? 0,
        currency: b.currency ?? 'UZS',
        soldAt: b.soldAt ? new Date(b.soldAt) : new Date(),
      },
    });
    await prisma.activity.create({
      data: { tenantId: req.user!.tenantId, userId: req.user!.sub, action: 'honadon sotdi', projectName: b.unitName },
    });
    res.status(201).json(s.sale(sale));
  }),
);

salesRouter.patch(
  '/:id',
  ah(async (req, res) => {
    const b = z.object({ paid: z.number().nonnegative().optional(), price: z.number().nonnegative().optional() }).parse(req.body);
    const ex = await prisma.sale.findFirst({ where: { id: req.params.id, tenantId: req.user!.tenantId } });
    if (!ex) return res.status(404).json({ error: 'not_found', message: 'Sotuv topilmadi' });
    const sale = await prisma.sale.update({ where: { id: req.params.id }, data: b });
    res.json(s.sale(sale));
  }),
);

salesRouter.delete(
  '/:id',
  ah(async (req, res) => {
    const ex = await prisma.sale.findFirst({ where: { id: req.params.id, tenantId: req.user!.tenantId } });
    if (!ex) return res.status(404).json({ error: 'not_found', message: 'Sotuv topilmadi' });
    await prisma.sale.delete({ where: { id: req.params.id } });
    res.status(204).end();
  }),
);
