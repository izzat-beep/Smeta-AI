import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'node:crypto';
import { config } from './config.js';
import { prisma } from './prisma.js';

export interface TenantTokenPayload {
  sub: string; // userId
  tenantId: string;
  role: string;
  kind: 'tenant';
}

export interface AdminTokenPayload {
  sub: string; // adminId
  role: string;
  kind: 'admin';
}

// ─── Access tokenlar (qisqa muddatli JWT) ────────────────────────────────────
export function signTenantAccess(payload: Omit<TenantTokenPayload, 'kind'>) {
  return jwt.sign({ ...payload, kind: 'tenant' as const }, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn,
  } as jwt.SignOptions);
}

export function signAdminAccess(payload: Omit<AdminTokenPayload, 'kind'>) {
  return jwt.sign({ ...payload, kind: 'admin' as const }, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn,
  } as jwt.SignOptions);
}

// ─── Refresh tokenlar (opaque + DB, rotatsiya, reuse-detection) ──────────────
const REFRESH_BYTES = 48;

// Refresh token DB'da HMAC-SHA256 hash ko'rinishida saqlanadi. Kalit —
// JWT_REFRESH_SECRET (endi haqiqiy vazifaga ega): DB sizib ketsa ham hash'lar
// sirsiz qayta hisoblab bo'lmaydi (defense-in-depth).
export function hmacHashToken(raw: string, secret: string): string {
  return crypto.createHmac('sha256', secret).update(raw).digest('hex');
}

// Legacy (kalitsiz) SHA-256 — 2026-07-19 dan oldin berilgan tokenlar uchun.
// Eski sessiyalar uzilmasligi uchun o'qishda fallback qilinadi. Refresh
// tokenlar ≤7 kunda muddati o'tgani sabab bu fallbackni 2026-08 dan keyin
// olib tashlash mumkin.
export function legacyHashToken(raw: string): string {
  return crypto.createHash('sha256').update(raw).digest('hex');
}

function hashToken(raw: string): string {
  return hmacHashToken(raw, config.jwt.refreshSecret);
}

// Raw tokenni DB'dan topadi: avval yangi HMAC hash, topilmasa legacy SHA-256.
async function findTokenRecord(raw: string) {
  const rec = await prisma.refreshToken.findUnique({ where: { tokenHash: hashToken(raw) } });
  if (rec) return rec;
  return prisma.refreshToken.findUnique({ where: { tokenHash: legacyHashToken(raw) } });
}

function refreshExpiry(): Date {
  return new Date(Date.now() + config.jwt.refreshDays * 24 * 60 * 60 * 1000);
}

interface IssueArgs {
  kind: 'tenant' | 'admin';
  subjectId: string;
  tenantId?: string | null;
  role: string;
  familyId?: string; // rotatsiyada eski oila saqlanadi
}

// Yangi opaque refresh token yaratadi va DB'ga hash ko'rinishida yozadi.
export async function issueRefreshToken(args: IssueArgs): Promise<string> {
  const raw = crypto.randomBytes(REFRESH_BYTES).toString('base64url');
  const familyId = args.familyId ?? crypto.randomUUID();
  await prisma.refreshToken.create({
    data: {
      tokenHash: hashToken(raw),
      familyId,
      kind: args.kind,
      userId: args.kind === 'tenant' ? args.subjectId : null,
      adminId: args.kind === 'admin' ? args.subjectId : null,
      tenantId: args.tenantId ?? null,
      role: args.role,
      expiresAt: refreshExpiry(),
    },
  });
  return raw;
}

export interface RotateResult {
  status: 'ok' | 'invalid' | 'reuse';
  token?: string; // yangi raw refresh token
  record?: { kind: string; subjectId: string; tenantId: string | null; role: string };
}

// Refresh tokenni tekshiradi va rotatsiya qiladi.
// - Topilmasa → invalid.
// - Bekor qilingan (allaqachon ishlatilgan) token qayta kelsa → REUSE:
//   butun oila bekor qilinadi (o'g'irlangan token belgisi).
// - Muddati o'tgan → invalid.
export async function rotateRefreshToken(raw: string): Promise<RotateResult> {
  if (!raw) return { status: 'invalid' };
  const rec = await findTokenRecord(raw);
  if (!rec) return { status: 'invalid' };

  if (rec.revokedAt) {
    // Reuse aniqlandi — xavfsizlik uchun butun oilani bekor qilamiz.
    await prisma.refreshToken.updateMany({
      where: { familyId: rec.familyId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    return { status: 'reuse' };
  }

  if (rec.expiresAt.getTime() < Date.now()) {
    await prisma.refreshToken.update({ where: { id: rec.id }, data: { revokedAt: new Date() } });
    return { status: 'invalid' };
  }

  const subjectId = rec.kind === 'tenant' ? rec.userId! : rec.adminId!;

  // Eski tokenni bekor qilib, o'sha oilada yangisini beramiz.
  await prisma.refreshToken.update({ where: { id: rec.id }, data: { revokedAt: new Date() } });
  const token = await issueRefreshToken({
    kind: rec.kind as 'tenant' | 'admin',
    subjectId,
    tenantId: rec.tenantId,
    role: rec.role,
    familyId: rec.familyId,
  });

  return {
    status: 'ok',
    token,
    record: { kind: rec.kind, subjectId, tenantId: rec.tenantId, role: rec.role },
  };
}

// Logout — berilgan tokenni (va uning oilasini) bekor qiladi.
export async function revokeRefreshToken(raw: string | undefined): Promise<void> {
  if (!raw) return;
  const rec = await findTokenRecord(raw);
  if (!rec) return;
  await prisma.refreshToken.updateMany({
    where: { familyId: rec.familyId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

// ─── Refresh cookie yordamchilari ────────────────────────────────────────────
export const REFRESH_COOKIE = {
  tenant: 'smeta_rt',
  admin: 'smeta_admin_rt',
} as const;

const COOKIE_PATH = {
  tenant: '/api/auth',
  admin: '/api/admin/auth',
} as const;

export function setRefreshCookie(res: Response, kind: 'tenant' | 'admin', token: string) {
  res.cookie(REFRESH_COOKIE[kind], token, {
    httpOnly: true,
    secure: config.cookie.secure,
    sameSite: config.cookie.sameSite,
    path: COOKIE_PATH[kind],
    maxAge: config.jwt.refreshDays * 24 * 60 * 60 * 1000,
  });
}

export function clearRefreshCookie(res: Response, kind: 'tenant' | 'admin') {
  res.clearCookie(REFRESH_COOKIE[kind], {
    httpOnly: true,
    secure: config.cookie.secure,
    sameSite: config.cookie.sameSite,
    path: COOKIE_PATH[kind],
  });
}

function extractToken(req: Request): string | null {
  const header = req.headers.authorization;
  if (header?.startsWith('Bearer ')) return header.slice(7);
  return null;
}

// Tenant foydalanuvchilar uchun himoya
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = extractToken(req);
  if (!token) return res.status(401).json({ error: 'unauthorized', message: 'Token topilmadi' });
  try {
    const payload = jwt.verify(token, config.jwt.secret) as TenantTokenPayload;
    if (payload.kind !== 'tenant') throw new Error('wrong kind');
    req.user = payload;
    next();
  } catch {
    return res.status(401).json({ error: 'unauthorized', message: 'Token yaroqsiz yoki muddati tugagan' });
  }
}

// Admin panel uchun himoya
export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const token = extractToken(req);
  if (!token) return res.status(401).json({ error: 'unauthorized', message: 'Token topilmadi' });
  try {
    const payload = jwt.verify(token, config.jwt.secret) as AdminTokenPayload;
    if (payload.kind !== 'admin') throw new Error('wrong kind');
    req.admin = payload;
    next();
  } catch {
    return res.status(401).json({ error: 'unauthorized', message: 'Admin token yaroqsiz' });
  }
}

// ─── RBAC: tenant foydalanuvchi roli bo'yicha ruxsat ─────────────────────────
// requireAuth'dan KEYIN ishlatiladi. Masalan: requireRole('OWNER', 'MANAGER').
export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) return res.status(401).json({ error: 'unauthorized', message: 'Avval tizimga kiring' });
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'forbidden', message: 'Bu amal uchun ruxsat yo\'q' });
    }
    next();
  };
}

// Admin roli bo'yicha ruxsat (requireAdmin'dan keyin).
export function requireAdminRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.admin) return res.status(401).json({ error: 'unauthorized', message: 'Admin token kerak' });
    if (!roles.includes(req.admin.role)) {
      return res.status(403).json({ error: 'forbidden', message: 'Faqat superadmin uchun ruxsat' });
    }
    next();
  };
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: TenantTokenPayload;
      admin?: AdminTokenPayload;
    }
  }
}
