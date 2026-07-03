import { Router } from 'express';
import { z } from 'zod';
import { prisma, toNum } from '../prisma.js';
import { ah } from '../util.js';
import { requireRole } from '../auth.js';
import * as s from '../serialize.js';

export const salesRouter = Router();

// Moliyaviy amallar (sotuv/to'lov yaratish-o'zgartirish) faqat OWNER/MANAGER uchun.
const canWrite = requireRole('OWNER', 'MANAGER');

// GET /api/sales — Barcha sotuvlar ro'yxati (to'lovlar tarixi + makler bilan)
// Query: ?unit=<filtr>  &  ?sort=lastPayment (oxirgi to'lov bo'yicha)
salesRouter.get(
  '/',
  ah(async (req, res) => {
    const unit = typeof req.query.unit === 'string' ? req.query.unit.trim() : '';
    const projectId = typeof req.query.projectId === 'string' ? req.query.projectId.trim() : '';
    const sort = req.query.sort === 'lastPayment' ? 'lastPayment' : 'soldAt';

    const sales = await prisma.sale.findMany({
      where: {
        tenantId: req.user!.tenantId,
        ...(unit ? { unitName: { contains: unit, mode: 'insensitive' } } : {}),
        ...(projectId ? { projectId } : {}),
      },
      orderBy: { soldAt: 'desc' },
      include: { payments: true, realtor: true, project: true },
    });

    // Valyuta bo'yicha alohida yig'indilar (UZS va USD aralashmasin)
    const totalsByCurrency: Record<string, { paid: number; remaining: number; commission: number }> = {};
    for (const x of sales) {
      const cur = x.currency;
      if (!totalsByCurrency[cur]) totalsByCurrency[cur] = { paid: 0, remaining: 0, commission: 0 };
      totalsByCurrency[cur].paid += toNum(x.paid);
      totalsByCurrency[cur].remaining += toNum(x.price) - toNum(x.paid);
      totalsByCurrency[cur].commission += toNum(x.commissionAmount);
    }

    let serialized = sales.map(s.sale);
    if (sort === 'lastPayment') {
      // Eng so'nggi to'lov sanasi bo'yicha kamayish; to'lovsizlar oxirida.
      serialized = serialized.sort((a, b) => {
        const ta = a.lastPaymentAt ? +new Date(a.lastPaymentAt) : 0;
        const tb = b.lastPaymentAt ? +new Date(b.lastPaymentAt) : 0;
        return tb - ta;
      });
    }

    res.json({ sales: serialized, totalsByCurrency, count: sales.length });
  }),
);

const upsert = z.object({
  projectId: z.string().optional().nullable(),
  unitName: z.string().min(1),
  buyerName: z.string().min(1),
  buyerPhone: z.string().optional().nullable(),
  area: z.number().nonnegative().optional(),
  price: z.number().nonnegative(),
  paid: z.number().nonnegative().optional(),
  currency: z.enum(['UZS', 'USD']).optional(),
  soldAt: z.string().optional().nullable(),
  realtorId: z.string().optional().nullable(),
  commissionAmount: z.number().nonnegative().optional(),
});

// Berilgan projectId shu tenant'ga tegishli ekanini tekshiradi.
async function assertProject(projectId: string | null | undefined, tenantId: string): Promise<boolean> {
  if (!projectId) return true;
  const p = await prisma.project.findFirst({ where: { id: projectId, tenantId } });
  return !!p;
}

// POST /api/sales — Yangi sotuv qo'shish
salesRouter.post(
  '/',
  canWrite,
  ah(async (req, res) => {
    const b = upsert.parse(req.body);
    const currency = b.currency ?? 'UZS';
    const soldAt = b.soldAt ? new Date(b.soldAt) : new Date();
    const initialPaid = b.paid ?? 0;

    // Makler tanlangan bo'lsa — shu tenant'ga tegishli ekanini tekshirish
    if (b.realtorId) {
      const r = await prisma.realtor.findFirst({ where: { id: b.realtorId, tenantId: req.user!.tenantId } });
      if (!r) return res.status(400).json({ error: 'bad_request', message: 'Makler topilmadi' });
    }
    if (!(await assertProject(b.projectId, req.user!.tenantId))) {
      return res.status(400).json({ error: 'bad_request', message: 'Loyiha (bino) topilmadi' });
    }

    const sale = await prisma.sale.create({
      data: {
        tenantId: req.user!.tenantId,
        projectId: b.projectId ?? null,
        unitName: b.unitName,
        buyerName: b.buyerName,
        buyerPhone: b.buyerPhone ?? null,
        area: b.area ?? 0,
        price: b.price,
        paid: initialPaid,
        currency,
        soldAt,
        realtorId: b.realtorId ?? null,
        commissionAmount: b.commissionAmount ?? 0,
        // Boshlang'ich to'lov bo'lsa — uni to'lovlar tarixiga ham yozamiz,
        // shunda paid va payments[] yig'indisi mos bo'ladi.
        ...(initialPaid > 0
          ? { payments: { create: { amount: initialPaid, currency, location: "Boshlang'ich", paidAt: soldAt } } }
          : {}),
      },
      include: { payments: true, realtor: true, project: true },
    });

    await prisma.activity.create({
      data: {
        tenantId: req.user!.tenantId,
        userId: req.user!.sub,
        action: 'honadon sotdi',
        projectName: b.unitName,
      },
    });

    res.status(201).json(s.sale(sale));
  }),
);

// ============ PAYMENTS (to'lovlar) ============

const paymentInput = z.object({
  amount: z.number().positive(),
  currency: z.enum(['UZS', 'USD']).optional(),
  location: z.string().optional(),
  method: z.string().optional(),
  note: z.string().optional(),
  paidAt: z.string().optional(),
});

// GET /api/sales/:saleId/payments — to'lovlar tarixi (vaqt bo'yicha o'sish tartibida)
salesRouter.get(
  '/:saleId/payments',
  ah(async (req, res) => {
    const payments = await prisma.payment.findMany({
      where: { saleId: req.params.saleId, sale: { tenantId: req.user!.tenantId } },
      orderBy: { paidAt: 'asc' },
    });
    res.json(payments.map(s.payment));
  }),
);

// POST /api/sales/:saleId/payments — yangi to'lov qo'shish
salesRouter.post(
  '/:saleId/payments',
  canWrite,
  ah(async (req, res) => {
    const b = paymentInput.parse(req.body);
    const sale = await prisma.sale.findFirst({
      where: { id: req.params.saleId, tenantId: req.user!.tenantId },
    });
    if (!sale) return res.status(404).json({ error: 'not_found', message: 'Sotuv topilmadi' });

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

    // To'lovlar yig'indisini hisoblab, Sale.paid balansini yangilash
    const total = await prisma.payment.aggregate({
      where: { saleId: req.params.saleId },
      _sum: { amount: true },
    });
    await prisma.sale.update({
      where: { id: req.params.saleId },
      data: { paid: total._sum.amount ?? 0 },
    });

    res.status(201).json(s.payment(payment));
  }),
);

// DELETE /api/sales/payments/:id — to'lovni o'chirish
salesRouter.delete(
  '/payments/:id',
  canWrite,
  ah(async (req, res) => {
    const payment = await prisma.payment.findFirst({
      where: { id: req.params.id, sale: { tenantId: req.user!.tenantId } },
    });
    if (!payment) return res.status(404).json({ error: 'not_found', message: "To'lov topilmadi" });

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
  }),
);

// PATCH /api/sales/:id — Sotuv ma'lumotlarini tahrirlash
// (paid bu yerda o'zgartirilmaydi — u to'lovlar yig'indisidan kelib chiqadi)
const patchInput = z.object({
  projectId: z.string().nullable().optional(),
  unitName: z.string().min(1).optional(),
  buyerName: z.string().min(1).optional(),
  buyerPhone: z.string().nullable().optional(),
  area: z.number().nonnegative().optional(),
  price: z.number().nonnegative().optional(),
  currency: z.enum(['UZS', 'USD']).optional(),
  realtorId: z.string().nullable().optional(),
  commissionAmount: z.number().nonnegative().optional(),
});

salesRouter.patch(
  '/:id',
  canWrite,
  ah(async (req, res) => {
    const b = patchInput.parse(req.body);
    const ex = await prisma.sale.findFirst({ where: { id: req.params.id, tenantId: req.user!.tenantId } });
    if (!ex) return res.status(404).json({ error: 'not_found', message: 'Sotuv topilmadi' });

    if (b.realtorId) {
      const r = await prisma.realtor.findFirst({ where: { id: b.realtorId, tenantId: req.user!.tenantId } });
      if (!r) return res.status(400).json({ error: 'bad_request', message: 'Makler topilmadi' });
    }
    if (b.projectId && !(await assertProject(b.projectId, req.user!.tenantId))) {
      return res.status(400).json({ error: 'bad_request', message: 'Loyiha (bino) topilmadi' });
    }

    const sale = await prisma.sale.update({
      where: { id: req.params.id },
      data: b,
      include: { payments: true, realtor: true, project: true },
    });
    res.json(s.sale(sale));
  }),
);

// DELETE /api/sales/:id — Sotuvni butunlay o'chirish (to'lovlar cascade o'chadi)
salesRouter.delete(
  '/:id',
  canWrite,
  ah(async (req, res) => {
    const ex = await prisma.sale.findFirst({ where: { id: req.params.id, tenantId: req.user!.tenantId } });
    if (!ex) return res.status(404).json({ error: 'not_found', message: 'Sotuv topilmadi' });

    await prisma.sale.delete({ where: { id: req.params.id } });
    res.status(204).end();
  }),
);
