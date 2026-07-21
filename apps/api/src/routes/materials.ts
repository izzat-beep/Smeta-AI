import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../prisma.js';
import { ah, optionalHttpUrl } from '../util.js';
import { requireRole } from '../auth.js';
import * as s from '../serialize.js';

export const materialsRouter = Router();

// Global katalog (tenantId=null) + tenant'ning shaxsiy materiallari
materialsRouter.get(
  '/',
  ah(async (req, res) => {
    const tenantId = req.user!.tenantId;
    // Qidiruv kirishini cheklaymiz (CWE-400: unbounded input DB'ga tushmasin).
    const q = (req.query.q as string | undefined)?.trim().slice(0, 100);
    const category = (req.query.category as string | undefined)?.slice(0, 60);
    const where: any = { OR: [{ tenantId: null }, { tenantId }] };
    const and: any[] = [];
    if (q) and.push({ OR: [{ name: { contains: q, mode: 'insensitive' } }, { provider: { contains: q, mode: 'insensitive' } }] });
    if (category && category !== 'Barchasi') and.push({ category });
    // Vendor mahsulotlari faqat faol va sotuvchi bloklanmagan bo'lsa ko'rinadi;
    // oddiy (vendorsiz) global materiallar doim ko'rinadi.
    and.push({ OR: [{ vendorId: null }, { AND: [{ isActive: true }, { vendor: { status: 'ACTIVE' } }] }] });
    where.AND = and;
    const materials = await prisma.material.findMany({ where, orderBy: { name: 'asc' }, include: { vendor: true } });
    res.json(materials.map(s.material));
  }),
);

materialsRouter.get(
  '/categories',
  ah(async (req, res) => {
    const tenantId = req.user!.tenantId;
    const rows = await prisma.material.findMany({
      where: { OR: [{ tenantId: null }, { tenantId }] },
      select: { category: true },
      distinct: ['category'],
    });
    res.json(rows.map((r) => r.category));
  }),
);

// Bitta material tafsiloti (global katalog yoki tenant materiali).
materialsRouter.get(
  '/:id',
  ah(async (req, res) => {
    const tenantId = req.user!.tenantId;
    const m = await prisma.material.findFirst({
      where: { id: req.params.id, OR: [{ tenantId: null }, { tenantId }] },
      include: { vendor: true },
    });
    if (!m) return res.status(404).json({ error: 'not_found', message: 'Material topilmadi' });
    res.json(s.material(m));
  }),
);

const upsertSchema = z.object({
  name: z.string().min(1),
  category: z.string().optional(),
  provider: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  unit: z.string().optional(),
  priceUzs: z.number().nonnegative().optional(),
  priceUsd: z.number().nonnegative().optional(),
  stock: z.number().nonnegative().optional(),
  rating: z.number().min(0).max(5).optional(),
  imageUrl: optionalHttpUrl,
});

materialsRouter.post(
  '/',
  ah(async (req, res) => {
    const tenantId = req.user!.tenantId;
    const body = upsertSchema.parse(req.body);
    const m = await prisma.material.create({
      data: {
        tenantId,
        name: body.name,
        category: body.category ?? 'Umumiy',
        provider: body.provider ?? null,
        description: body.description ?? null,
        unit: body.unit ?? 'dona',
        priceUzs: body.priceUzs ?? 0,
        priceUsd: body.priceUsd ?? 0,
        stock: body.stock ?? 0,
        rating: body.rating ?? 0,
        imageUrl: body.imageUrl ?? null,
      },
    });
    res.status(201).json(s.material(m));
  }),
);

materialsRouter.patch(
  '/:id',
  ah(async (req, res) => {
    const tenantId = req.user!.tenantId;
    const existing = await prisma.material.findFirst({ where: { id: req.params.id, tenantId } });
    if (!existing) return res.status(404).json({ error: 'not_found', message: 'Material topilmadi (yoki global katalogga tegishli)' });
    const body = upsertSchema.partial().parse(req.body);
    const m = await prisma.material.update({ where: { id: req.params.id }, data: body });
    res.json(s.material(m));
  }),
);

materialsRouter.delete(
  '/:id',
  requireRole('OWNER', 'MANAGER'),
  ah(async (req, res) => {
    const tenantId = req.user!.tenantId;
    const existing = await prisma.material.findFirst({ where: { id: req.params.id, tenantId } });
    if (!existing) return res.status(404).json({ error: 'not_found', message: 'Material topilmadi' });
    await prisma.material.delete({ where: { id: req.params.id } });
    res.status(204).end();
  }),
);
