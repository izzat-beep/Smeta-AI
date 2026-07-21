// Parol hashing (F9, CWE-916): argon2id (yangi standart) + bcrypt backward-compat.
// Mavjud bcrypt hash'lar login paytida argon2id'ga SHAFFOF ko'chiriladi
// (needsRehash) — migratsiyasiz, breaking emas.
import { hash as argonHash, verify as argonVerify } from '@node-rs/argon2';
import bcrypt from 'bcryptjs';

// OWASP argon2id tavsiyasi: memory 19 MiB, iterations 2, parallelism 1.
const ARGON_OPTS = { memoryCost: 19456, timeCost: 2, parallelism: 1 } as const;

export function hashPassword(password: string): Promise<string> {
  return argonHash(password, ARGON_OPTS);
}

export interface VerifyResult {
  ok: boolean;
  needsRehash: boolean; // true => login muvaffaqiyatli, lekin hash eski (bcrypt) — argon2'ga yangilang
}

export async function verifyPassword(storedHash: string, password: string): Promise<VerifyResult> {
  if (storedHash.startsWith('$argon2')) {
    const ok = await argonVerify(storedHash, password).catch(() => false);
    return { ok, needsRehash: false };
  }
  // Legacy bcrypt — to'g'ri bo'lsa argon2'ga ko'chirishni signal qilamiz.
  const ok = await bcrypt.compare(password, storedHash);
  return { ok, needsRehash: ok };
}
