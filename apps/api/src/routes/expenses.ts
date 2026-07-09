import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../prisma.js';
import { ah } from '../util.js';
import { requireRole } from '../auth.js';
import { replaceGeneralExpenses } from '../expensesService.js';
import * as s from '../serialize.js';

export const expensesRouter = Router();

// GET /api/expenses — umumiy harajatlar ro'yxati.
// Query ?projectId=<id> — shu binoning harajatlari; berilmasa tenant-umumiy (projectId=null).
expensesRouter.get(
  '/',
  ah(async (req, res) => {
    const projectId = typeof req.query.projectId === 'string' && req.query.projectId.trim() ? req.query.projectId.trim() : null;
    const rows = await prisma.generalExpenses.findMany({
      where: { tenantId: req.user!.tenantId, projectId },
      orderBy: { id: 'asc' },
    });
    const currency = rows[0]?.currency === 'USD' ? 'USD' : 'UZS';
    res.json({
      // orderId — buyurtmadan avtomatik yozilgan qator belgisi (Vazifa 5)
      items: rows.map((e) => ({ id: e.id, label: e.label, amount: e.amount, orderId: e.orderId ?? null })),
      currency,
      projectId,
    });
  }),
);

// POST /api/expenses — ro'yxatni almashtirib saqlash (replace-all, projectId doirasida).
// rows[].orderId — buyurtmadan avtomatik yozilgan qatorning bog'lanishi; saqlashda
// yo'qolmasligi kerak (aks holda buyurtma bekor qilinganda qator o'chmay qoladi).
const saveSchema = z.object({
  projectId: z.string().optional().nullable(),
  currency: z.enum(['UZS', 'USD']).optional(),
  rows: z.array(
    z.object({
      name: z.string().optional().default(''),
      amount: z.union([z.number(), z.string()]).optional().default(0),
      orderId: z.string().optional().nullable(),
    }),
  ),
});

expensesRouter.post(
  '/',
  requireRole('OWNER', 'MANAGER'),
  ah(async (req, res) => {
    const b = saveSchema.parse(req.body);
    const currency = b.currency ?? 'UZS';
    const projectId = b.projectId ?? null;

    // projectId berilgan bo'lsa — shu tenant'ga tegishli ekanini tekshiramiz.
    if (projectId) {
      const p = await prisma.project.findFirst({ where: { id: projectId, tenantId: req.user!.tenantId } });
      if (!p) return res.status(400).json({ error: 'bad_request', message: 'Loyiha (bino) topilmadi' });
    }

    // Replace-all mantig'i ulashiladigan servisda (orderId qatorlari saqlanadi).
    const count = await prisma.$transaction((tx) =>
      replaceGeneralExpenses(tx, req.user!.tenantId, projectId, currency, b.rows),
    );

    res.json({ ok: true, count, currency, projectId });
  }),
);

// ─── Yakka yozuv CRUD (Vazifa 3C: "+ Ma'lumot qo'shish" → Xarajat) ─────────

// GET /api/expenses/list?projectId=&from=&to= — davr bo'yicha yozuvlar
// (Reports sahifasidagi tahrirlash/o'chirish ro'yxati). projectId berilmasa barchasi.
expensesRouter.get(
  '/list',
  ah(async (req, res) => {
    const projectId = typeof req.query.projectId === 'string' && req.query.projectId.trim() ? req.query.projectId.trim() : undefined;
    const from = typeof req.query.from === 'string' && req.query.from ? new Date(req.query.from) : undefined;
    const to = typeof req.query.to === 'string' && req.query.to ? new Date(req.query.to) : undefined;
    // Sana: spentAt (yangi yozuvlar) yoki createdAt (eski yozuvlar) oraliqda
    const dateCond = from || to
      ? {
          OR: [
            { spentAt: { ...(from ? { gte: from } : {}), ...(to ? { lt: to } : {}) } },
            { spentAt: null, createdAt: { ...(from ? { gte: from } : {}), ...(to ? { lt: to } : {}) } },
          ],
        }
      : {};
    const rows = await prisma.generalExpenses.findMany({
      where: { tenantId: req.user!.tenantId, ...(projectId ? { projectId } : {}), ...dateCond },
      orderBy: { id: 'desc' },
      take: 200,
    });
    res.json(rows.map(s.expenseItem));
  }),
);

const itemSchema = z.object({
  label: z.string().min(1).max(200),
  amount: z.number().positive(),
  currency: z.enum(['UZS', 'USD']).optional(),
  category: z.enum(['MATERIAL', 'LABOR', 'EQUIPMENT', 'GENERAL']).optional(),
  projectId: z.string().optional().nullable(),
  spentAt: z.string().optional().nullable(),
  note: z.string().max(500).optional().nullable(),
});

// POST /api/expenses/add — bitta xarajat yozuvi qo'shish (replace-all'siz)
expensesRouter.post(
  '/add',
  ah(async (req, res) => {
    const b = itemSchema.parse(req.body);
    const projectId = b.projectId?.trim() || null;
    if (projectId) {
      const p = await prisma.project.findFirst({ where: { id: projectId, tenantId: req.user!.tenantId }, select: { id: true } });
      if (!p) return res.status(400).json({ error: 'bad_request', message: 'Loyiha topilmadi' });
    }
    const row = await prisma.generalExpenses.create({
      data: {
        tenantId: req.user!.tenantId,
        projectId,
        label: b.label.trim(),
        amount: Math.round(b.amount * 100) / 100,
        currency: b.currency ?? 'UZS',
        category: b.category ?? 'GENERAL',
        spentAt: b.spentAt ? new Date(b.spentAt) : new Date(),
        note: b.note?.trim() || null,
      },
    });
    res.status(201).json(s.expenseItem(row));
  }),
);

// PATCH /api/expenses/:id — yozuvni tahrirlash (buyurtmadan kelgan yozuvda orderId saqlanadi)
expensesRouter.patch(
  '/:id',
  ah(async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(400).json({ error: 'bad_request', message: 'Noto\'g\'ri ID' });
    const b = itemSchema.partial().parse(req.body);
    const ex = await prisma.generalExpenses.findFirst({ where: { id, tenantId: req.user!.tenantId } });
    if (!ex) return res.status(404).json({ error: 'not_found', message: 'Xarajat topilmadi' });
    const projectId = b.projectId === undefined ? undefined : b.projectId?.trim() || null;
    if (projectId) {
      const p = await prisma.project.findFirst({ where: { id: projectId, tenantId: req.user!.tenantId }, select: { id: true } });
      if (!p) return res.status(400).json({ error: 'bad_request', message: 'Loyiha topilmadi' });
    }
    const row = await prisma.generalExpenses.update({
      where: { id },
      data: {
        ...(b.label !== undefined ? { label: b.label.trim() } : {}),
        ...(b.amount !== undefined ? { amount: Math.round(b.amount * 100) / 100 } : {}),
        ...(b.currency !== undefined ? { currency: b.currency } : {}),
        ...(b.category !== undefined ? { category: b.category } : {}),
        ...(b.spentAt !== undefined ? { spentAt: b.spentAt ? new Date(b.spentAt) : null } : {}),
        ...(b.note !== undefined ? { note: b.note?.trim() || null } : {}),
        ...(projectId !== undefined ? { projectId } : {}),
      },
    });
    res.json(s.expenseItem(row));
  }),
);

// DELETE /api/expenses/:id
expensesRouter.delete(
  '/:id',
  ah(async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(400).json({ error: 'bad_request', message: 'Noto\'g\'ri ID' });
    const ex = await prisma.generalExpenses.findFirst({ where: { id, tenantId: req.user!.tenantId } });
    if (!ex) return res.status(404).json({ error: 'not_found', message: 'Xarajat topilmadi' });
    await prisma.generalExpenses.delete({ where: { id } });
    res.status(204).end();
  }),
);
