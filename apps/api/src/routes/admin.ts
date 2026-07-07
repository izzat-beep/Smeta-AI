import { Router } from 'express';
import bcrypt from 'bcryptjs';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { prisma, toNum } from '../prisma.js';
import { ah } from '../util.js';
import {
  signAdminAccess,
  issueRefreshToken,
  rotateRefreshToken,
  revokeRefreshToken,
  setRefreshCookie,
  clearRefreshCookie,
  REFRESH_COOKIE,
  requireAdmin,
  requireAdminRole,
} from '../auth.js';
import * as s from '../serialize.js';
import { PLAN_PRICES } from '@smeta/shared';
import { allowedNextStatuses, notifyOrderStatus, notifyCustomerMessage } from '../notify.js';
import { buildNotificationsRouter } from './notifications.js';

export const adminRouter = Router();

// Admin login rate-limit: IP bo'yicha 15 daqiqada 5 urinish.
const adminLoginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: { error: 'too_many_requests', message: 'Juda ko\'p urinish. 15 daqiqadan so\'ng qayta urinib ko\'ring.' },
});

// ─── Auth (ochiq) — birlashtirilgan: super admin YOKI vendor ───────────────
adminRouter.post(
  '/auth/login',
  adminLoginLimiter,
  ah(async (req, res) => {
    const body = z.object({ email: z.string().optional(), login: z.string().optional(), password: z.string() }).parse(req.body);
    const identifier = (body.email ?? body.login ?? '').trim();
    const fail = (reason: string) => {
      // eslint-disable-next-line no-console
      console.warn(`[admin-auth] Muvaffaqiyatsiz login — id=${identifier} ip=${req.ip} reason=${reason} time=${new Date().toISOString()}`);
      return res.status(401).json({ error: 'unauthorized', message: 'Login yoki parol noto\'g\'ri' });
    };
    if (!identifier) return fail('empty');

    // 1) Platforma admini (AdminUser)
    const admin = await prisma.adminUser.findUnique({ where: { email: identifier } });
    if (admin) {
      const ok = await bcrypt.compare(body.password, admin.passwordHash);
      if (!ok) return fail('bad_password');
      const accessToken = signAdminAccess({ sub: admin.id, role: admin.role });
      const refresh = await issueRefreshToken({ kind: 'admin', subjectId: admin.id, role: admin.role });
      setRefreshCookie(res, 'admin', refresh);
      return res.json({ role: admin.role, admin: s.adminUser(admin), tokens: { accessToken } });
    }

    // 2) Vendor (material sotuvchi)
    const v = await prisma.vendor.findUnique({ where: { login: identifier } });
    if (v) {
      const ok = await bcrypt.compare(body.password, v.passwordHash);
      if (!ok) return fail('bad_password');
      if (v.status === 'BLOCKED') return res.status(403).json({ error: 'forbidden', message: 'Hisobingiz bloklangan. Administrator bilan bog\'laning.' });
      const accessToken = signAdminAccess({ sub: v.id, role: 'VENDOR' });
      const refresh = await issueRefreshToken({ kind: 'admin', subjectId: v.id, role: 'VENDOR' });
      setRefreshCookie(res, 'admin', refresh);
      return res.json({ role: 'VENDOR', vendor: s.vendor(v), mustChangePassword: v.mustChangePassword, tokens: { accessToken } });
    }

    return fail('not_found');
  }),
);

adminRouter.post(
  '/auth/refresh',
  ah(async (req, res) => {
    const raw = req.cookies?.[REFRESH_COOKIE.admin] as string | undefined;
    const result = await rotateRefreshToken(raw ?? '');
    if (result.status !== 'ok' || result.record?.kind !== 'admin') {
      clearRefreshCookie(res, 'admin');
      const msg =
        result.status === 'reuse'
          ? 'Sessiya bekor qilindi (xavfsizlik). Qaytadan kiring.'
          : 'Refresh token yaroqsiz';
      return res.status(401).json({ error: 'unauthorized', message: msg });
    }
    setRefreshCookie(res, 'admin', result.token!);
    const accessToken = signAdminAccess({ sub: result.record.subjectId, role: result.record.role });
    res.json({ tokens: { accessToken } });
  }),
);

adminRouter.post(
  '/auth/logout',
  ah(async (req, res) => {
    const raw = req.cookies?.[REFRESH_COOKIE.admin] as string | undefined;
    await revokeRefreshToken(raw);
    clearRefreshCookie(res, 'admin');
    res.json({ ok: true });
  }),
);

// ─── Bundan keyingi BARCHA route'lar admin tokenini talab qiladi ───────────
adminRouter.use(requireAdmin);

// Rol guardlari
const requireSuperadmin = requireAdminRole('SUPERADMIN');
const requireStaff = requireAdminRole('SUPERADMIN', 'SUPPORT'); // platforma bo'limlari (vendorlar kira olmaydi)
const requireVendor = requireAdminRole('VENDOR');

adminRouter.get(
  '/admin-users',
  requireSuperadmin,
  ah(async (_req, res) => {
    const admins = await prisma.adminUser.findMany({
      orderBy: { createdAt: 'desc' },
    });
    res.json(admins.map((a) => s.adminUser(a)));
  })
);

adminRouter.post(
  '/admin-users',
  requireSuperadmin,
  ah(async (req, res) => {
    const body = z
      .object({
        email: z.string().email(),
        fullName: z.string().min(2),
        password: z.string().min(6),
        role: z.enum(['SUPERADMIN', 'SUPPORT']).default('SUPPORT'),
      })
      .parse(req.body);

    const existing = await prisma.adminUser.findUnique({ where: { email: body.email } });
    if (existing) {
      return res.status(409).json({ error: 'conflict', message: 'Bu email allaqachon mavjud' });
    }

    const passwordHash = await bcrypt.hash(body.password, 10);
    const admin = await prisma.adminUser.create({
      data: {
        email: body.email,
        fullName: body.fullName,
        passwordHash,
        role: body.role,
      },
    });

    res.status(201).json(s.adminUser(admin));
  })
);

adminRouter.delete(
  '/admin-users/:id',
  requireSuperadmin,
  ah(async (req, res) => {
    if (req.admin!.sub === req.params.id) {
      return res.status(400).json({ error: 'bad_request', message: "O'zingizni o'chira olmaysiz" });
    }
    await prisma.adminUser.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  })
);

adminRouter.get(
  '/me',
  ah(async (req, res) => {
    if (req.admin!.role === 'VENDOR') {
      const v = await prisma.vendor.findUnique({ where: { id: req.admin!.sub } });
      if (!v) return res.status(404).json({ error: 'not_found', message: 'Topilmadi' });
      return res.json({ role: 'VENDOR', vendor: s.vendor(v), mustChangePassword: v.mustChangePassword });
    }
    const admin = await prisma.adminUser.findUnique({ where: { id: req.admin!.sub } });
    if (!admin) return res.status(404).json({ error: 'not_found', message: 'Topilmadi' });
    res.json({ role: admin.role, admin: s.adminUser(admin) });
  }),
);

adminRouter.get(
  '/stats',
  requireStaff,
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
  requireStaff,
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
  requireStaff,
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
  requireStaff,
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
  requireStaff,
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
  requireStaff,
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
  requireStaff,
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
  requireStaff,
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
  requireStaff,
  ah(async (req, res) => {
    const ex = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!ex) return res.status(404).json({ error: 'not_found', message: 'Foydalanuvchi topilmadi' });
    await prisma.user.delete({ where: { id: req.params.id } });
    res.status(204).end();
  }),
);

// ═══════════════════════════════════════════════════════════════════════
//  VENDORLAR — Super admin boshqaruvi (Vazifa 5.2)
// ═══════════════════════════════════════════════════════════════════════

adminRouter.get(
  '/vendors',
  requireSuperadmin,
  ah(async (_req, res) => {
    const vendors = await prisma.vendor.findMany({
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { materials: true } } },
    });
    res.json(vendors.map(s.vendor));
  }),
);

adminRouter.post(
  '/vendors',
  requireSuperadmin,
  ah(async (req, res) => {
    const body = z
      .object({
        name: z.string().min(2),
        phone: z.string().optional().nullable(),
        login: z.string().min(3),
        password: z.string().min(6),
        shopName: z.string().optional().nullable(),
        logoUrl: z.string().optional().nullable(),
      })
      .parse(req.body);
    const existing = await prisma.vendor.findUnique({ where: { login: body.login } });
    if (existing) return res.status(409).json({ error: 'conflict', message: 'Bu login allaqachon band' });
    const v = await prisma.vendor.create({
      data: {
        name: body.name,
        phone: body.phone ?? null,
        login: body.login,
        passwordHash: await bcrypt.hash(body.password, 12),
        shopName: body.shopName ?? null,
        logoUrl: body.logoUrl ?? null,
        mustChangePassword: true,
      },
    });
    res.status(201).json(s.vendor(v));
  }),
);

adminRouter.patch(
  '/vendors/:id',
  requireSuperadmin,
  ah(async (req, res) => {
    const body = z
      .object({
        name: z.string().min(2).optional(),
        phone: z.string().optional().nullable(),
        shopName: z.string().optional().nullable(),
        logoUrl: z.string().optional().nullable(),
        status: z.enum(['ACTIVE', 'BLOCKED']).optional(),
        password: z.string().min(6).optional(), // parolni tiklash
      })
      .parse(req.body);
    const ex = await prisma.vendor.findUnique({ where: { id: req.params.id } });
    if (!ex) return res.status(404).json({ error: 'not_found', message: 'Sotuvchi topilmadi' });
    const data: any = { name: body.name, phone: body.phone, shopName: body.shopName, logoUrl: body.logoUrl, status: body.status };
    if (body.password) {
      data.passwordHash = await bcrypt.hash(body.password, 12);
      data.mustChangePassword = true;
    }
    // Sotuvchi bloklansa — barcha eski sessiyalarini bekor qilamiz.
    if (body.status === 'BLOCKED') {
      await prisma.refreshToken.updateMany({ where: { adminId: req.params.id, revokedAt: null }, data: { revokedAt: new Date() } });
    }
    const v = await prisma.vendor.update({ where: { id: req.params.id }, data });
    res.json(s.vendor(v));
  }),
);

adminRouter.delete(
  '/vendors/:id',
  requireSuperadmin,
  ah(async (req, res) => {
    const ex = await prisma.vendor.findUnique({ where: { id: req.params.id } });
    if (!ex) return res.status(404).json({ error: 'not_found', message: 'Sotuvchi topilmadi' });
    await prisma.vendor.delete({ where: { id: req.params.id } }); // materiallari cascade o'chadi
    res.status(204).end();
  }),
);

// Super admin: bitta sotuvchining mahsulotlari
adminRouter.get(
  '/vendors/:id/products',
  requireSuperadmin,
  ah(async (req, res) => {
    const materials = await prisma.material.findMany({ where: { vendorId: req.params.id }, orderBy: { createdAt: 'desc' } });
    res.json(materials.map(s.material));
  }),
);

// ═══════════════════════════════════════════════════════════════════════
//  VENDOR KABINETI (Vazifa 5.3) — faqat o'z ma'lumotlari
// ═══════════════════════════════════════════════════════════════════════

// Parolni o'zgartirish (birinchi kirishda majburiy)
adminRouter.post(
  '/vendor/change-password',
  requireVendor,
  ah(async (req, res) => {
    const body = z.object({ newPassword: z.string().min(6) }).parse(req.body);
    await prisma.vendor.update({
      where: { id: req.admin!.sub },
      data: { passwordHash: await bcrypt.hash(body.newPassword, 12), mustChangePassword: false },
    });
    res.json({ ok: true });
  }),
);

const vendorProductSchema = z.object({
  name: z.string().min(1),
  category: z.string().optional(),
  description: z.string().optional().nullable(),
  unit: z.string().optional(),
  priceUzs: z.number().nonnegative().optional(),
  priceUsd: z.number().nonnegative().optional(),
  stock: z.number().nonnegative().optional(),
  imageUrl: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
});

// O'z mahsulotlari
adminRouter.get(
  '/vendor/products',
  requireVendor,
  ah(async (req, res) => {
    const materials = await prisma.material.findMany({ where: { vendorId: req.admin!.sub }, orderBy: { createdAt: 'desc' } });
    res.json(materials.map(s.material));
  }),
);

adminRouter.post(
  '/vendor/products',
  requireVendor,
  ah(async (req, res) => {
    const b = vendorProductSchema.parse(req.body);
    const m = await prisma.material.create({
      data: {
        vendorId: req.admin!.sub,
        tenantId: null, // katalogda global ko'rinadi
        name: b.name,
        category: b.category ?? 'Umumiy',
        description: b.description ?? null,
        unit: b.unit ?? 'dona',
        priceUzs: b.priceUzs ?? 0,
        priceUsd: b.priceUsd ?? 0,
        stock: b.stock ?? 0,
        imageUrl: b.imageUrl ?? null,
        isActive: b.isActive ?? true,
      },
    });
    res.status(201).json(s.material(m));
  }),
);

// O'z mahsulotini yangilash — vendorId serverda tekshiriladi (frontend'ga ishonmaymiz)
adminRouter.patch(
  '/vendor/products/:id',
  requireVendor,
  ah(async (req, res) => {
    const ex = await prisma.material.findFirst({ where: { id: req.params.id, vendorId: req.admin!.sub } });
    if (!ex) return res.status(404).json({ error: 'not_found', message: 'Mahsulot topilmadi' });
    const b = vendorProductSchema.partial().parse(req.body);
    const m = await prisma.material.update({ where: { id: req.params.id }, data: b });
    res.json(s.material(m));
  }),
);

adminRouter.delete(
  '/vendor/products/:id',
  requireVendor,
  ah(async (req, res) => {
    const ex = await prisma.material.findFirst({ where: { id: req.params.id, vendorId: req.admin!.sub } });
    if (!ex) return res.status(404).json({ error: 'not_found', message: 'Mahsulot topilmadi' });
    await prisma.material.delete({ where: { id: req.params.id } });
    res.status(204).end();
  }),
);

// O'z mahsulotlariga kelgan buyurtmalar
adminRouter.get(
  '/vendor/orders',
  requireVendor,
  ah(async (req, res) => {
    const myMaterials = await prisma.material.findMany({ where: { vendorId: req.admin!.sub }, select: { id: true } });
    const ids = myMaterials.map((m) => m.id);
    if (ids.length === 0) return res.json([]);
    const orders = await prisma.order.findMany({
      where: { items: { some: { materialId: { in: ids } } } },
      include: { items: true },
      orderBy: { createdAt: 'desc' },
    });
    // Faqat shu vendorning pozitsiyalarini qoldiramiz.
    const out = orders.map((o) => {
      const items = o.items.filter((it) => it.materialId && ids.includes(it.materialId));
      const total = items.reduce((sum, it) => sum + toNum(it.lineTotal), 0);
      return { ...s.order({ ...o, items }), total };
    });
    res.json(out);
  }),
);

// Buyurtma shu vendorga tegishlimi (kamida bitta pozitsiyasi uning mahsuloti).
// RBAC: sotuvchi faqat o'z buyurtmalari bilan ishlaydi.
// Eslatma: OrderItem.materialId oddiy ustun (FK relation emas), shuning uchun
// avval vendorning material id'lari olinadi.
async function findVendorOrder(vendorId: string, orderId: string) {
  const myMaterials = await prisma.material.findMany({ where: { vendorId }, select: { id: true } });
  const ids = myMaterials.map((m) => m.id);
  if (!ids.length) return null;
  return prisma.order.findFirst({
    where: { id: orderId, items: { some: { materialId: { in: ids } } } },
    include: { items: true },
  });
}

// PATCH /vendor/orders/:id/status — statusni bosqichma-bosqich o'zgartirish.
// Mijozga avtomatik bildirishnoma BITTA tranzaksiya ichida yoziladi.
adminRouter.patch(
  '/vendor/orders/:id/status',
  requireVendor,
  ah(async (req, res) => {
    const body = z
      .object({ status: z.enum(['ACCEPTED', 'PREPARING', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED']) })
      .parse(req.body);
    const order = await findVendorOrder(req.admin!.sub, req.params.id);
    if (!order) return res.status(404).json({ error: 'not_found', message: 'Buyurtma topilmadi' });

    const allowed = allowedNextStatuses(order.status);
    if (!allowed.includes(body.status)) {
      return res.status(400).json({
        error: 'bad_request',
        message: `"${order.status}" holatidan "${body.status}" holatiga o'tib bo'lmaydi`,
        allowed,
      });
    }

    const updated = await prisma.$transaction(async (tx) => {
      const u = await tx.order.update({ where: { id: order.id }, data: { status: body.status }, include: { items: true } });
      // Vazifa 5: buyurtma bekor qilinsa — avtomatik "Umumiy harajatlar"
      // yozuvi o'chadi (summalar qayta hisoblanadi).
      if (body.status === 'CANCELLED') {
        await tx.generalExpenses.deleteMany({ where: { orderId: order.id } });
      }
      await notifyOrderStatus(tx, u, body.status);
      return u;
    });

    res.json(s.order(updated));
  }),
);

// POST /vendor/orders/:id/message — sotuvchidan mijozga ixtiyoriy matnli xabar.
adminRouter.post(
  '/vendor/orders/:id/message',
  requireVendor,
  ah(async (req, res) => {
    const body = z.object({ text: z.string().trim().min(1).max(1000) }).parse(req.body);
    const order = await findVendorOrder(req.admin!.sub, req.params.id);
    if (!order) return res.status(404).json({ error: 'not_found', message: 'Buyurtma topilmadi' });
    const v = await prisma.vendor.findUnique({ where: { id: req.admin!.sub } });
    await notifyCustomerMessage(prisma, order, body.text, v?.shopName || v?.name || 'Sotuvchi');
    res.status(201).json({ ok: true });
  }),
);

// Vendor bildirishnomalari: GET /vendor/notifications, /unread-count, PATCH :id/read, read-all
adminRouter.use(
  '/vendor/notifications',
  requireVendor,
  buildNotificationsRouter((req) => ({ vendorId: req.admin!.sub })),
);
