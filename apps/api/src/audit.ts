// Append-only audit log (CWE-778) — sezgir/admin amallari uchun o'zgarmas iz.
// Best-effort: yozish xato bo'lsa asosiy amal buzilmaydi (jim loglaymiz).
import type { Request } from 'express';
import { prisma } from './prisma.js';

export interface AuditInput {
  actorId?: string | null;
  actorKind: 'admin' | 'vendor' | 'tenant';
  actorEmail?: string | null;
  action: string; // 'admin.user.create', 'vendor.block', ...
  targetType?: string;
  targetId?: string;
  meta?: Record<string, unknown>;
}

export async function audit(req: Request, input: AuditInput): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        actorId: input.actorId ?? null,
        actorKind: input.actorKind,
        actorEmail: input.actorEmail ?? null,
        action: input.action,
        targetType: input.targetType ?? null,
        targetId: input.targetId ?? null,
        ip: req.ip ?? null,
        meta: input.meta ? JSON.stringify(input.meta) : null,
      },
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[audit] yozishda xato:', err);
  }
}
