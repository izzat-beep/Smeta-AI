import { Router } from 'express';
import { z } from 'zod';
import { prisma, toNum } from '../prisma.js';
import { ah } from '../util.js';
import { requireRole } from '../auth.js';
import * as s from '../serialize.js';

export const realtorsRouter = Router();

const canWrite = requireRole('OWNER', 'MANAGER');

// GET /api/realtors — maklerlar ro'yxati + har biri bo'yicha sotuv/komissiya statistikasi
realtorsRouter.get(
  '/',
  ah(async (req, res) => {
    const realtors = await prisma.realtor.findMany({
      where: { tenantId: req.user!.tenantId },
      orderBy: { createdAt: 'desc' },
      take: 500, // CWE-770 xavfsizlik cap'i
      include: {
        _count: { select: { sales: true } },
        sales: { select: { currency: true, commissionAmount: true } },
      },
    });

    const data = realtors.map((r) => {
      // Komissiya yig'indisi valyuta bo'yicha alohida
      const totalsByCurrency: Record<string, { commission: number; sales: number }> = {};
      for (const sale of r.sales) {
        const cur = sale.currency;
        if (!totalsByCurrency[cur]) totalsByCurrency[cur] = { commission: 0, sales: 0 };
        totalsByCurrency[cur].commission += toNum(sale.commissionAmount);
        totalsByCurrency[cur].sales += 1;
      }
      return {
        id: r.id,
        name: r.name,
        phone: r.phone ?? null,
        salesCount: r._count.sales,
        totalsByCurrency,
        createdAt: r.createdAt.toISOString(),
      };
    });

    res.json({ realtors: data, count: data.length });
  }),
);

const input = z.object({
  name: z.string().min(1),
  phone: z.string().optional().nullable(),
});

// POST /api/realtors — yangi makler
realtorsRouter.post(
  '/',
  canWrite,
  ah(async (req, res) => {
    const b = input.parse(req.body);
    const r = await prisma.realtor.create({
      data: { tenantId: req.user!.tenantId, name: b.name, phone: b.phone ?? null },
    });
    res.status(201).json(s.realtor(r));
  }),
);

// PATCH /api/realtors/:id — tahrirlash
realtorsRouter.patch(
  '/:id',
  canWrite,
  ah(async (req, res) => {
    const b = input.partial().parse(req.body);
    const ex = await prisma.realtor.findFirst({ where: { id: req.params.id, tenantId: req.user!.tenantId } });
    if (!ex) return res.status(404).json({ error: 'not_found', message: 'Makler topilmadi' });
    const r = await prisma.realtor.update({ where: { id: req.params.id }, data: b });
    res.json(s.realtor(r));
  }),
);

// DELETE /api/realtors/:id — o'chirish (bog'liq sotuvlarda realtorId null bo'ladi)
realtorsRouter.delete(
  '/:id',
  canWrite,
  ah(async (req, res) => {
    const ex = await prisma.realtor.findFirst({ where: { id: req.params.id, tenantId: req.user!.tenantId } });
    if (!ex) return res.status(404).json({ error: 'not_found', message: 'Makler topilmadi' });
    await prisma.realtor.delete({ where: { id: req.params.id } });
    res.status(204).end();
  }),
);
