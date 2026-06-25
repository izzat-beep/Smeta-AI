import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '../prisma.js';
import { ah } from '../util.js';
import { signTenantTokens, verifyRefresh, requireAuth } from '../auth.js';
import * as s from '../serialize.js';

export const authRouter = Router();

const registerSchema = z.object({
  fullName: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  companyName: z.string().min(2),
  phone: z.string().optional(),
});

authRouter.post(
  '/register',
  ah(async (req, res) => {
    const body = registerSchema.parse(req.body);
    const existing = await prisma.user.findUnique({ where: { email: body.email } });
    if (existing) return res.status(409).json({ error: 'conflict', message: 'Bu email allaqachon ro\'yxatdan o\'tgan' });

    const passwordHash = await bcrypt.hash(body.password, 10);
    const trialEndsAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);

    const tenant = await prisma.tenant.create({
      data: {
        name: body.companyName,
        phone: body.phone,
        status: 'TRIAL',
        plan: 'BOSHLANGICH',
        trialEndsAt,
        users: {
          create: {
            fullName: body.fullName,
            email: body.email,
            phone: body.phone,
            passwordHash,
            role: 'OWNER',
            position: 'Rahbar',
          },
        },
      },
      include: { users: true },
    });

    const u = tenant.users[0];
    const tokens = signTenantTokens({ sub: u.id, tenantId: tenant.id, role: u.role });
    res.status(201).json({ user: s.user(u), tenant: s.tenant(tenant), tokens });
  }),
);

const loginSchema = z.object({ email: z.string().email(), password: z.string() });

authRouter.post(
  '/login',
  ah(async (req, res) => {
    const body = loginSchema.parse(req.body);
    const u = await prisma.user.findUnique({ where: { email: body.email }, include: { tenant: true } });
    if (!u) return res.status(401).json({ error: 'unauthorized', message: 'Email yoki parol noto\'g\'ri' });
    const ok = await bcrypt.compare(body.password, u.passwordHash);
    if (!ok) return res.status(401).json({ error: 'unauthorized', message: 'Email yoki parol noto\'g\'ri' });

    const tokens = signTenantTokens({ sub: u.id, tenantId: u.tenantId, role: u.role });
    res.json({ user: s.user(u), tenant: s.tenant(u.tenant), tokens });
  }),
);

// Parolni tiklash — email xizmati yo'qligi sababli ro'yxatdan o'tishda kiritilgan
// telefon raqami orqali tasdiqlanadi (email + telefon mos kelsa, yangi parol o'rnatiladi).
const forgotSchema = z.object({
  email: z.string().email(),
  phone: z.string().min(3),
  newPassword: z.string().min(6),
});

authRouter.post(
  '/forgot-password',
  ah(async (req, res) => {
    const body = forgotSchema.parse(req.body);
    const u = await prisma.user.findUnique({ where: { email: body.email }, include: { tenant: true } });

    // Telefonni faqat raqamlar bo'yicha solishtiramiz ("+998 90..." == "99890...")
    const digits = (p?: string | null) => (p ?? '').replace(/\D/g, '');
    const given = digits(body.phone);
    const matches =
      !!u && given.length >= 7 && (digits(u.phone) === given || digits(u.tenant?.phone) === given);

    if (!u || !matches) {
      return res.status(400).json({
        error: 'invalid',
        message:
          "Email yoki telefon raqami mos kelmadi. Ro'yxatdan o'tishda telefon kiritmagan bo'lsangiz, qo'llab-quvvatlashga murojaat qiling.",
      });
    }

    const passwordHash = await bcrypt.hash(body.newPassword, 10);
    await prisma.user.update({ where: { id: u.id }, data: { passwordHash } });
    res.json({ ok: true, message: 'Parol muvaffaqiyatli yangilandi. Endi yangi parol bilan kiring.' });
  }),
);

authRouter.post(
  '/refresh',
  ah(async (req, res) => {
    const token = req.body?.refreshToken as string | undefined;
    if (!token) return res.status(400).json({ error: 'bad_request', message: 'refreshToken kerak' });
    try {
      const payload = verifyRefresh(token);
      if (payload.kind !== 'tenant') throw new Error('wrong');
      const tokens = signTenantTokens({ sub: payload.sub, tenantId: payload.tenantId, role: payload.role });
      res.json({ tokens });
    } catch {
      res.status(401).json({ error: 'unauthorized', message: 'Refresh token yaroqsiz' });
    }
  }),
);

authRouter.get(
  '/me',
  requireAuth,
  ah(async (req, res) => {
    const u = await prisma.user.findUnique({ where: { id: req.user!.sub }, include: { tenant: true } });
    if (!u) return res.status(404).json({ error: 'not_found', message: 'Foydalanuvchi topilmadi' });
    res.json({ user: s.user(u), tenant: s.tenant(u.tenant) });
  }),
);
