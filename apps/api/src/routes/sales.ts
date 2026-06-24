import { Router } from 'express';
import { z } from 'zod';
import { prisma, toNum } from '../prisma.js';
import { ah } from '../util.js';
import * as s from '../serialize.js';

export const salesRouter = Router();

// GET /api/sales — Barcha sotuvlar ro'yxati
salesRouter.get(
  '/',
  ah(async (req, res) => {
    const sales = await prisma.sale.findMany({
      where: { tenantId: req.user!.tenantId },
      orderBy: { soldAt: 'desc' },
    });
    
    const totalsByCurrency: Record<string, { paid: number; remaining: number }> = {};
    for (const x of sales) {
      const cur = x.currency;
      if (!totalsByCurrency[cur]) totalsByCurrency[cur] = { paid: 0, remaining: 0 };
      totalsByCurrency[cur].paid += toNum(x.paid);
      totalsByCurrency[cur].remaining += toNum(x.price) - toNum(x.paid);
    }
    
    res.json({
      sales: sales.map(s.sale),
      totalsByCurrency,
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

// POST /api/sales — Yangi sotuv qo'shish
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
      data: { 
        tenantId: req.user!.tenantId, 
        userId: req.user!.sub, 
        action: 'honadon sotdi', 
        projectName: b.unitName 
      },
    });
    
    res.status(201).json(s.sale(sale));
  }),
);

// ============ PAYMENTS (to'lovlar) ============

const paymentInput = z.object({
  amount: z.number().positive(),
  currency: z.enum(["UZS", "USD"]).optional(),
  location: z.string().optional(),
  method: z.string().optional(),
  note: z.string().optional(),
  paidAt: z.string().optional(),
});

// GET /api/sales/:saleId/payments — to'lovlar tarixi
salesRouter.get(
  "/:saleId/payments",
  ah(async (req, res) => {
    // Prisma model nomi kichik harfda chaqiriladi: prisma.payment
    const payments = await prisma.payment.findMany({
      where: {
        saleId: req.params.saleId,
        sale: { tenantId: req.user!.tenantId },
      },
      orderBy: { paidAt: "desc" },
    });
    res.json(payments.map((p) => ({ ...p, amount: toNum(p.amount) })));
  })
);

// POST /api/sales/:saleId/payments — yangi to'lov qo'shish
salesRouter.post(
  "/:saleId/payments",
  ah(async (req, res) => {
    const b = paymentInput.parse(req.body);
    const sale = await prisma.sale.findFirst({
      where: { id: req.params.saleId, tenantId: req.user!.tenantId },
    });
    if (!sale) return res.status(404).json({ error: "not_found", message: "Sotuv topilmadi" });

    const payment = await prisma.payment.create({
      data: {
        saleId: req.params.saleId,
        amount: b.amount,
        currency: b.currency ?? sale.currency,
        location: b.location,
        method: b.method,
        note: b.note,
        paidAt: b.paidAt ? new Date(b.paidAt) : new Date(),
      },
    });

    // To'lovlar yig'indisini hisoblash
    const total = await prisma.payment.aggregate({
      where: { saleId: req.params.saleId },
      _sum: { amount: true },
    });

    // Sotuv (Sale) balansini yangilash
    await prisma.sale.update({
      where: { id: req.params.saleId },
      data: { paid: total._sum.amount ?? 0 },
    });

    res.status(201).json({ ...payment, amount: toNum(payment.amount) });
  })
);

// DELETE /api/sales/payments/:id — to'lovni o'chirish
salesRouter.delete(
  "/payments/:id",
  ah(async (req, res) => {
    const payment = await prisma.payment.findFirst({where: { id: req.params.id, sale: { tenantId: req.user!.tenantId } },
    });
    if (!payment) return res.status(404).json({ error: "not_found", message: "To'lov topilmadi" });

    await prisma.payment.delete({ where: { id: req.params.id } });

    // O'chirilgandan keyin qayta hisoblash
    const total = await prisma.payment.aggregate({
      where: { saleId: payment.saleId },
      _sum: { amount: true },
    });

    await prisma.sale.update({
      where: { id: payment.saleId },
      data: { paid: total._sum.amount ?? 0 },
    });

    res.status(204).end();
  })
);

// PATCH /api/sales/:id — Sotuv ma'lumotlarini tahrirlash
salesRouter.patch(
  '/:id',
  ah(async (req, res) => {
    const b = z.object({ 
      paid: z.number().nonnegative().optional(), 
      price: z.number().nonnegative().optional() 
    }).parse(req.body);
    
    const ex = await prisma.sale.findFirst({ where: { id: req.params.id, tenantId: req.user!.tenantId } });
    if (!ex) return res.status(404).json({ error: 'not_found', message: 'Sotuv topilmadi' });
    
    const sale = await prisma.sale.update({ where: { id: req.params.id }, data: b });
    res.json(s.sale(sale));
  }),
);

// DELETE /api/sales/:id — Sotuvni butunlay o'chirish
salesRouter.delete(
  '/:id',
  ah(async (req, res) => {
    const ex = await prisma.sale.findFirst({ where: { id: req.params.id, tenantId: req.user!.tenantId } });
    if (!ex) return res.status(404).json({ error: 'not_found', message: 'Sotuv topilmadi' });
    
    await prisma.sale.delete({ where: { id: req.params.id } });
    res.status(204).end();
  }),
);