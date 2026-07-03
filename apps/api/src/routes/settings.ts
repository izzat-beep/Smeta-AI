import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../prisma.js';
import { ah } from '../util.js';
import * as s from '../serialize.js';

export const settingsRouter = Router();

settingsRouter.get(
  '/',
  ah(async (req, res) => {
    const u = await prisma.user.findUnique({ where: { id: req.user!.sub }, include: { tenant: true } });
    if (!u) return res.status(404).json({ error: 'not_found', message: 'Topilmadi' });
    res.json({ user: s.user(u), tenant: s.tenant(u.tenant) });
  }),
);

const updateSchema = z.object({
  fullName: z.string().min(2).optional(),
  phone: z.string().optional().nullable(),
  position: z.string().optional().nullable(),
  avatarUrl: z.string().optional().nullable(),
  company: z
    .object({
      name: z.string().min(2).optional(),
      inn: z.string().optional().nullable(),
      phone: z.string().optional().nullable(),
    })
    .optional(),
});

settingsRouter.patch(
  '/',
  ah(async (req, res) => {
    const body = updateSchema.parse(req.body);
    const u = await prisma.user.update({
      where: { id: req.user!.sub },
      data: {
        fullName: body.fullName,
        phone: body.phone,
        position: body.position,
        avatarUrl: body.avatarUrl,
      },
      include: { tenant: true },
    });
    if (body.company) {
      // Kompaniya ma'lumotlarini faqat OWNER o'zgartira oladi.
      if (req.user!.role !== 'OWNER') {
        return res.status(403).json({ error: 'forbidden', message: 'Kompaniya ma\'lumotlarini faqat rahbar (OWNER) o\'zgartira oladi' });
      }
      await prisma.tenant.update({
        where: { id: req.user!.tenantId },
        data: { name: body.company.name, inn: body.company.inn, phone: body.company.phone },
      });
    }
    const fresh = await prisma.user.findUnique({ where: { id: u.id }, include: { tenant: true } });
    res.json({ user: s.user(fresh), tenant: s.tenant(fresh!.tenant) });
  }),
);
