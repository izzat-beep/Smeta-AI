import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../prisma.js';
import { ah } from '../util.js';
import * as s from '../serialize.js';

export const projectsRouter = Router();

projectsRouter.get(
  '/',
  ah(async (req, res) => {
    const tenantId = req.user!.tenantId;
    const q = (req.query.q as string | undefined)?.trim();
    const status = req.query.status as string | undefined;
    const where: any = { tenantId };
    if (q) where.OR = [{ title: { contains: q, mode: 'insensitive' } }, { clientName: { contains: q, mode: 'insensitive' } }];
    if (status) where.status = status;
    const projects = await prisma.project.findMany({
      where,
      include: { manager: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json(projects.map(s.project));
  }),
);

projectsRouter.get(
  '/:id',
  ah(async (req, res) => {
    const p = await prisma.project.findFirst({
      where: { id: req.params.id, tenantId: req.user!.tenantId },
      include: { manager: true, estimates: { include: { items: true } } },
    });
    if (!p) return res.status(404).json({ error: 'not_found', message: 'Loyiha topilmadi' });
    res.json({ ...s.project(p), estimates: p.estimates.map(s.estimate) });
  }),
);

const upsertSchema = z.object({
  title: z.string().min(2),
  clientName: z.string().min(1),
  category: z.string().optional(),
  value: z.number().nonnegative().optional(),
  currency: z.enum(['UZS', 'USD']).optional(),
  deadline: z.string().optional().nullable(),
  progress: z.number().min(0).max(100).optional(),
  status: z.enum(['PLANNED', 'IN_PROGRESS', 'COMPLETED', 'ARCHIVED']).optional(),
  managerId: z.string().optional().nullable(),
});

projectsRouter.post(
  '/',
  ah(async (req, res) => {
    const tenantId = req.user!.tenantId;
    const body = upsertSchema.parse(req.body);
    const count = await prisma.project.count({ where: { tenantId } });
    const code = `PRJ-${String(count + 1).padStart(3, '0')}`;
    const p = await prisma.project.create({
      data: {
        tenantId,
        code,
        title: body.title,
        clientName: body.clientName,
        category: body.category ?? 'Umumiy',
        value: body.value ?? 0,
        currency: body.currency ?? 'UZS',
        deadline: body.deadline ? new Date(body.deadline) : null,
        progress: body.progress ?? 0,
        status: body.status ?? 'PLANNED',
        managerId: body.managerId ?? null,
      },
      include: { manager: true },
    });
    await prisma.activity.create({
      data: { tenantId, userId: req.user!.sub, action: 'yangi loyiha yaratdi', projectName: p.title },
    });
    res.status(201).json(s.project(p));
  }),
);

projectsRouter.patch(
  '/:id',
  ah(async (req, res) => {
    const tenantId = req.user!.tenantId;
    const existing = await prisma.project.findFirst({ where: { id: req.params.id, tenantId } });
    if (!existing) return res.status(404).json({ error: 'not_found', message: 'Loyiha topilmadi' });
    const body = upsertSchema.partial().parse(req.body);
    const p = await prisma.project.update({
      where: { id: req.params.id },
      data: {
        ...body,
        deadline: body.deadline !== undefined ? (body.deadline ? new Date(body.deadline) : null) : undefined,
      },
      include: { manager: true },
    });
    res.json(s.project(p));
  }),
);

projectsRouter.delete(
  '/:id',
  ah(async (req, res) => {
    const tenantId = req.user!.tenantId;
    const existing = await prisma.project.findFirst({ where: { id: req.params.id, tenantId } });
    if (!existing) return res.status(404).json({ error: 'not_found', message: 'Loyiha topilmadi' });
    await prisma.project.delete({ where: { id: req.params.id } });
    res.status(204).end();
  }),
);
