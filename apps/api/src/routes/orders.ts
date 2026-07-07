import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../prisma.js';
import { ah } from '../util.js';
import * as s from '../serialize.js';
import { notifyVendorsNewOrder } from '../notify.js';

export const ordersRouter = Router();

// GET /api/orders — tenant buyurtmalari
ordersRouter.get(
  '/',
  ah(async (req, res) => {
    const orders = await prisma.order.findMany({
      where: { tenantId: req.user!.tenantId },
      include: { items: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json(orders.map(s.order));
  }),
);

// GET /api/orders/:id — bitta buyurtma
ordersRouter.get(
  '/:id',
  ah(async (req, res) => {
    const o = await prisma.order.findFirst({
      where: { id: req.params.id, tenantId: req.user!.tenantId },
      include: { items: true },
    });
    if (!o) return res.status(404).json({ error: 'not_found', message: 'Buyurtma topilmadi' });
    res.json(s.order(o));
  }),
);

const itemSchema = z.object({
  materialId: z.string().optional().nullable(),
  name: z.string().min(1),
  unit: z.string().optional(),
  unitPrice: z.number().nonnegative(),
  qty: z.number().positive(),
});

const createSchema = z.object({
  customerName: z.string().min(2),
  customerPhone: z.string().min(3),
  address: z.string().optional().nullable(),
  note: z.string().optional().nullable(),
  currency: z.enum(['UZS', 'USD']).optional(),
  items: z.array(itemSchema).min(1),
});

// POST /api/orders — yangi buyurtma (status = NEW).
// Sotuvchi(lar)ga bildirishnoma buyurtma bilan BITTA tranzaksiya ichida yoziladi.
ordersRouter.post(
  '/',
  ah(async (req, res) => {
    const body = createSchema.parse(req.body);
    const total = body.items.reduce((sum, i) => sum + i.qty * i.unitPrice, 0);

    const o = await prisma.$transaction(async (tx) => {
      const order = await tx.order.create({
        data: {
          tenantId: req.user!.tenantId,
          userId: req.user!.sub,
          customerName: body.customerName,
          customerPhone: body.customerPhone,
          address: body.address ?? null,
          note: body.note ?? null,
          currency: body.currency ?? 'UZS',
          total,
          status: 'NEW',
          items: {
            create: body.items.map((i) => ({
              materialId: i.materialId ?? null,
              name: i.name,
              unit: i.unit ?? 'dona',
              unitPrice: i.unitPrice,
              qty: i.qty,
              lineTotal: i.qty * i.unitPrice,
            })),
          },
        },
        include: { items: true },
      });

      // Sotuvchilarga "Yangi buyurtma" bildirishnomasi (materiallari bo'yicha)
      await notifyVendorsNewOrder(
        tx,
        order,
        body.items.map((i) => i.materialId ?? '').filter(Boolean),
      );

      await tx.activity.create({
        data: { tenantId: req.user!.tenantId, userId: req.user!.sub, action: 'buyurtma berdi', projectName: `${body.items.length} ta material` },
      });

      return order;
    });

    res.status(201).json(s.order(o));
  }),
);
