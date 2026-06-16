import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma, toNum } from '../prisma.js';
import { ah } from '../util.js';
import { signAdminTokens, requireAdmin, verifyRefresh } from '../auth.js';
import * as s from '../serialize.js';
import { PLAN_PRICES } from '@smeta/shared';

export const adminRouter = Router();

// ─── Auth (ochiq) ────────────────────────────────────────────────────────
adminRouter.post(
  '/auth/login',
  ah(async (req, res) => {
    const body = z.object({ email: z.string().email(), password: z.string() }).parse(req.body);
    const admin = await prisma.adminUser.findUnique({ where: { email: body.email } });
    if (!admin) return res.status(401).json({ error: 'unauthorized', message: 'Email yoki parol noto\'g\'ri' });
    const ok = await bcrypt.compare(body.password, admin.passwordHash);
    if (!ok) return res.status(401).json({ error: 'unauthorized', message: 'Email yoki parol noto\'g\'ri' });
    const tokens = signAdminTokens({ sub: admin.id, role: admin.role });
    res.json({ admin: s.adminUser(admin), tokens });
  }),
);

adminRouter.post(
  '/auth/refresh',
  ah(async (req, res) => {
    const token = req.body?.refreshToken as string | undefined;
    if (!token) return res.status(400).json({ error: 'bad_request', message: 'refreshToken kerak' });
    try {
      const payload = verifyRefresh(token);
      if (payload.kind !== 'admin') throw new Error('wrong');
      const tokens = signAdminTokens({ sub: payload.sub, role: payload.role });
      res.json({ tokens });
    } catch {
      res.status(401).json({ error: 'unauthorized', message: 'Refresh token yaroqsiz' });
    }
  }),
);

// ─── Quyidagilar uchun admin token kerak ──────────────────────────────────
adminRouter.use(requireAdmin);

adminRouter.get(
  '/me',
  ah(async (req, res) => {
    const admin = await prisma.adminUser.findUnique({ where: { id: req.admin!.sub } });
    if (!admin) return res.status(404).json({ error: 'not_found', message: 'Topilmadi' });
    res.json({ admin: s.adminUser(admin) });
  }),
);

adminRouter.get(
  '/stats',
  ah(async (_req, res) => {
    const [tenants, totalUsers, totalProjects] = await Promise.all([
      prisma.tenant.findMany({ orderBy: { createdAt: 'desc' } }),
      prisma.user.count(),
      prisma.project.count(),
    ]);

    const byStatus = (st: string) => tenants.filter((t) => t.status === st).length;
    const plans = ['BOSHLANGICH', 'PROFESSIONAL', 'KORPORATIV'] as const;
    const planBreakdown = plans.map((plan) => ({ plan, count: tenants.filter((t) => t.plan === plan).length }));

    // MRR — faqat faol obunalar
    const mrr = tenants
      .filter((t) => t.status === 'ACTIVE')
      .reduce((sum, t) => sum + (PLAN_PRICES[t.plan as keyof typeof PLAN_PRICES] ?? 0), 0);

    // So'nggi 6 oy ro'yxatdan o'tishlari
    const now = new Date();
    const monthNames = ['Yan', 'Fev', 'Mar', 'Apr', 'May', 'Iyun', 'Iyul', 'Avg', 'Sen', 'Okt', 'Noy', 'Dek'];
    const signupsTrend = Array.from({ length: 6 }, (_, idx) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - idx), 1);
      const next = new Date(now.getFullYear(), now.getMonth() - (5 - idx) + 1, 1);
      const count = tenants.filter((t) => t.createdAt >= d && t.createdAt < next).length;
      return { month: monthNames[d.getMonth()], count };
    });

    res.json({
      totalTenants: tenants.length,
      activeTenants: byStatus('ACTIVE'),
      trialTenants: byStatus('TRIAL'),
      suspendedTenants: byStatus('SUSPENDED'),
      totalUsers,
      totalProjects,
      mrr,
      planBreakdown,
      signupsTrend,
      recentTenants: tenants.slice(0, 5).map(s.tenant),
    });
  }),
);

adminRouter.get(
  '/tenants',
  ah(async (req, res) => {
    const q = (req.query.q as string | undefined)?.trim();
    const status = req.query.status as string | undefined;
    const where: any = {};
    if (q) where.name = { contains: q, mode: 'insensitive' };
    if (status && status !== 'ALL') where.status = status;
    const tenants = await prisma.tenant.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { users: true, projects: true } } },
    });
    res.json(
      tenants.map((t) => ({ ...s.tenant(t), userCount: t._count.users, projectCount: t._count.projects })),
    );
  }),
);

adminRouter.get(
  '/tenants/:id',
  ah(async (req, res) => {
    const t = await prisma.tenant.findUnique({
      where: { id: req.params.id },
      include: {
        users: true,
        projects: { take: 10, orderBy: { createdAt: 'desc' } },
        invoices: { orderBy: { issuedAt: 'desc' } },
        _count: { select: { users: true, projects: true, estimates: true } },
      },
    });
    if (!t) return res.status(404).json({ error: 'not_found', message: 'Mijoz topilmadi' });
    res.json({
      ...s.tenant(t),
      counts: t._count,
      users: t.users.map(s.user),
      projects: t.projects.map(s.project),
      invoices: t.invoices.map(s.invoice),
    });
  }),
);

adminRouter.patch(
  '/tenants/:id',
  ah(async (req, res) => {
    const body = z
      .object({
        plan: z.enum(['BOSHLANGICH', 'PROFESSIONAL', 'KORPORATIV']).optional(),
        status: z.enum(['TRIAL', 'ACTIVE', 'SUSPENDED', 'CANCELLED']).optional(),
      })
      .parse(req.body);
    const existing = await prisma.tenant.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ error: 'not_found', message: 'Mijoz topilmadi' });
    const t = await prisma.tenant.update({ where: { id: req.params.id }, data: body });
    res.json(s.tenant(t));
  }),
);

adminRouter.get(
  '/invoices',
  ah(async (_req, res) => {
    const invoices = await prisma.invoice.findMany({
      include: { tenant: true },
      orderBy: { issuedAt: 'desc' },
    });
    const total = invoices.filter((i) => i.status === 'PAID').reduce((sum, i) => sum + toNum(i.amount), 0);
    res.json({ invoices: invoices.map(s.invoice), totalPaid: total });
  }),
);

adminRouter.get(
  '/users',
  ah(async (_req, res) => {
    const users = await prisma.user.findMany({
      include: { tenant: true },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    res.json(users.map((u) => ({ ...s.user(u), tenantName: u.tenant.name })));
  }),
);

// Yangi foydalanuvchi qo'shish (super admin)
adminRouter.post(
  '/users',
  ah(async (req, res) => {
    const body = z
      .object({
        tenantId: z.string().min(1),
        fullName: z.string().min(2),
        email: z.string().email(),
        password: z.string().min(6),
        role: z.enum(['OWNER', 'MANAGER', 'ENGINEER']).optional(),
        position: z.string().optional(),
      })
      .parse(req.body);
    const exists = await prisma.user.findUnique({ where: { email: body.email } });
    if (exists) return res.status(409).json({ error: 'conflict', message: 'Bu email allaqachon band' });
    const tenant = await prisma.tenant.findUnique({ where: { id: body.tenantId } });
    if (!tenant) return res.status(404).json({ error: 'not_found', message: 'Mijoz topilmadi' });
    const u = await prisma.user.create({
      data: {
        tenantId: body.tenantId,
        fullName: body.fullName,
        email: body.email,
        passwordHash: await bcrypt.hash(body.password, 10),
        role: body.role ?? 'ENGINEER',
        position: body.position ?? null,
      },
      include: { tenant: true },
    });
    res.status(201).json({ ...s.user(u), tenantName: u.tenant.name });
  }),
);

// Rol yoki ismni o'zgartirish
adminRouter.patch(
  '/users/:id',
  ah(async (req, res) => {
    const body = z
      .object({
        role: z.enum(['OWNER', 'MANAGER', 'ENGINEER']).optional(),
        fullName: z.string().min(2).optional(),
      })
      .parse(req.body);
    const ex = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!ex) return res.status(404).json({ error: 'not_found', message: 'Foydalanuvchi topilmadi' });
    const u = await prisma.user.update({ where: { id: req.params.id }, data: body, include: { tenant: true } });
    res.json({ ...s.user(u), tenantName: u.tenant.name });
  }),
);

// Foydalanuvchini o'chirish
adminRouter.delete(
  '/users/:id',
  ah(async (req, res) => {
    const ex = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!ex) return res.status(404).json({ error: 'not_found', message: 'Foydalanuvchi topilmadi' });
    await prisma.user.delete({ where: { id: req.params.id } });
    res.status(204).end();
  }),
);
