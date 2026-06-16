import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from './config.js';

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

export function signTenantTokens(payload: Omit<TenantTokenPayload, 'kind'>) {
  const base = { ...payload, kind: 'tenant' as const };
  return {
    accessToken: jwt.sign(base, config.jwt.secret, { expiresIn: config.jwt.expiresIn } as any),
    refreshToken: jwt.sign(base, config.jwt.refreshSecret, { expiresIn: config.jwt.refreshExpiresIn } as any),
  };
}

export function signAdminTokens(payload: Omit<AdminTokenPayload, 'kind'>) {
  const base = { ...payload, kind: 'admin' as const };
  return {
    accessToken: jwt.sign(base, config.jwt.secret, { expiresIn: config.jwt.expiresIn } as any),
    refreshToken: jwt.sign(base, config.jwt.refreshSecret, { expiresIn: config.jwt.refreshExpiresIn } as any),
  };
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

export function verifyRefresh(token: string): TenantTokenPayload | AdminTokenPayload {
  return jwt.verify(token, config.jwt.refreshSecret) as TenantTokenPayload | AdminTokenPayload;
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
