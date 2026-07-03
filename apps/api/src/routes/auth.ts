import { Router } from 'express';
import bcrypt from 'bcryptjs';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { prisma } from '../prisma.js';
import { ah } from '../util.js';
import {
  signTenantAccess,
  issueRefreshToken,
  rotateRefreshToken,
  revokeRefreshToken,
  setRefreshCookie,
  clearRefreshCookie,
  REFRESH_COOKIE,
  requireAuth,
} from '../auth.js';
import * as s from '../serialize.js';

export const authRouter = Router();

// Login uchun rate limiting: IP bo'yicha 15 daqiqada 5 urinish.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  // Muvaffaqiyatli loginlar limitga kirmasin (faqat xatolarni cheklaymiz).
  skipSuccessfulRequests: true,
  message: {
    error: 'too_many_requests',
    message: 'Juda ko\'p urinish. 15 daqiqadan so\'ng qayta urinib ko\'ring.',
  },
});

// Muvaffaqiyatsiz urinishni log qilish.
function logFailedLogin(req: any, email: string, reason: string) {
  // eslint-disable-next-line no-console
  console.warn(
    `[auth] Muvaffaqiyatsiz login — email=${email} ip=${req.ip} reason=${reason} time=${new Date().toISOString()}`,
  );
}

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

    const passwordHash = await bcrypt.hash(body.password, 12);
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
    const accessToken = signTenantAccess({ sub: u.id, tenantId: tenant.id, role: u.role });
    const refresh = await issueRefreshToken({ kind: 'tenant', subjectId: u.id, tenantId: tenant.id, role: u.role });
    setRefreshCookie(res, 'tenant', refresh);
    res.status(201).json({ user: s.user(u), tenant: s.tenant(tenant), tokens: { accessToken } });
  }),
);

const loginSchema = z.object({ email: z.string().email(), password: z.string() });

authRouter.post(
  '/login',
  loginLimiter,
  ah(async (req, res) => {
    const body = loginSchema.parse(req.body);
    const u = await prisma.user.findUnique({ where: { email: body.email }, include: { tenant: true } });
    if (!u) {
      logFailedLogin(req, body.email, 'user_not_found');
      return res.status(401).json({ error: 'unauthorized', message: 'Email yoki parol noto\'g\'ri' });
    }
    const ok = await bcrypt.compare(body.password, u.passwordHash);
    if (!ok) {
      logFailedLogin(req, body.email, 'bad_password');
      return res.status(401).json({ error: 'unauthorized', message: 'Email yoki parol noto\'g\'ri' });
    }

    const accessToken = signTenantAccess({ sub: u.id, tenantId: u.tenantId, role: u.role });
    const refresh = await issueRefreshToken({ kind: 'tenant', subjectId: u.id, tenantId: u.tenantId, role: u.role });
    setRefreshCookie(res, 'tenant', refresh);
    res.json({ user: s.user(u), tenant: s.tenant(u.tenant), tokens: { accessToken } });
  }),
);

// Parolni tiklash — email xizmati yo'qligi sababli ro'yxatdan o'tishda kiritilgan
// telefon raqami orqali tasdiqlanadi (email + telefon mos kelsa, yangi parol o'rnatiladi).
const forgotSchema = z.object({
  email: z.string().email(),
  phone: z.string().min(3),
  newPassword: z.string().min(6),
});

// Parol tiklashga ham rate-limit (brute-force'dan himoya).
const forgotLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'too_many_requests', message: 'Juda ko\'p urinish. Keyinroq qayta urinib ko\'ring.' },
});

authRouter.post(
  '/forgot-password',
  forgotLimiter,
  ah(async (req, res) => {
    const body = forgotSchema.parse(req.body);
    const u = await prisma.user.findUnique({ where: { email: body.email }, include: { tenant: true } });

    // Telefonni faqat raqamlar bo'yicha solishtiramiz ("+998 90..." == "99890...")
    const digits = (p?: string | null) => (p ?? '').replace(/\D/g, '');
    const given = digits(body.phone);
    const matches =
      !!u && given.length >= 7 && (digits(u.phone) === given || digits(u.tenant?.phone) === given);

    if (!u || !matches) {
      logFailedLogin(req, body.email, 'forgot_password_mismatch');
      return res.status(400).json({
        error: 'invalid',
        message:
          "Email yoki telefon raqami mos kelmadi. Ro'yxatdan o'tishda telefon kiritmagan bo'lsangiz, qo'llab-quvvatlashga murojaat qiling.",
      });
    }

    const passwordHash = await bcrypt.hash(body.newPassword, 12);
    await prisma.user.update({ where: { id: u.id }, data: { passwordHash } });
    // Parol o'zgargach barcha eski sessiyalarni bekor qilamiz.
    await prisma.refreshToken.updateMany({ where: { userId: u.id, revokedAt: null }, data: { revokedAt: new Date() } });
    res.json({ ok: true, message: 'Parol muvaffaqiyatli yangilandi. Endi yangi parol bilan kiring.' });
  }),
);

// Refresh — token httpOnly cookie'dan olinadi, rotatsiya qilinadi.
authRouter.post(
  '/refresh',
  ah(async (req, res) => {
    const raw = req.cookies?.[REFRESH_COOKIE.tenant] as string | undefined;
    const result = await rotateRefreshToken(raw ?? '');
    if (result.status !== 'ok' || result.record?.kind !== 'tenant') {
      clearRefreshCookie(res, 'tenant');
      const msg =
        result.status === 'reuse'
          ? 'Sessiya bekor qilindi (xavfsizlik). Qaytadan kiring.'
          : 'Refresh token yaroqsiz';
      return res.status(401).json({ error: 'unauthorized', message: msg });
    }
    setRefreshCookie(res, 'tenant', result.token!);
    const accessToken = signTenantAccess({
      sub: result.record.subjectId,
      tenantId: result.record.tenantId!,
      role: result.record.role,
    });
    res.json({ tokens: { accessToken } });
  }),
);

// Logout — refresh oilasini bekor qilib, cookie'ni tozalaymiz.
authRouter.post(
  '/logout',
  ah(async (req, res) => {
    const raw = req.cookies?.[REFRESH_COOKIE.tenant] as string | undefined;
    await revokeRefreshToken(raw);
    clearRefreshCookie(res, 'tenant');
    res.json({ ok: true });
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
