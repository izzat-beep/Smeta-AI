// TOTP sirini DB'da shifrlab saqlash — AES-256-GCM.
// Shifrlash kaliti JWT_SECRET'dan HKDF-SHA256 bilan hosil qilinadi (alohida env
// talab qilmaslik uchun). ESLATMA: JWT_SECRET rotatsiya qilinsa saqlangan 2FA
// sirlarini o'qib bo'lmaydi — adminlar 2FA'ni qayta ulashi kerak (kamdan-kam
// hodisa, SECURITY.md'da hujjatlashtirilgan).
import crypto from 'node:crypto';
import { config } from './config.js';

function key(): Buffer {
  return Buffer.from(
    crypto.hkdfSync('sha256', Buffer.from(config.jwt.secret), Buffer.from('smeta-totp-salt'), Buffer.from('totp-enc-v1'), 32),
  );
}

// "v1:iv:tag:ciphertext" (hammasi base64).
export function encryptSecret(plain: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key(), iv);
  const ct = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `v1:${iv.toString('base64')}:${tag.toString('base64')}:${ct.toString('base64')}`;
}

export function decryptSecret(stored: string): string {
  const [ver, ivB, tagB, ctB] = stored.split(':');
  if (ver !== 'v1' || !ivB || !tagB || !ctB) throw new Error('TOTP shifr formati xato');
  const decipher = crypto.createDecipheriv('aes-256-gcm', key(), Buffer.from(ivB, 'base64'));
  decipher.setAuthTag(Buffer.from(tagB, 'base64'));
  return Buffer.concat([decipher.update(Buffer.from(ctB, 'base64')), decipher.final()]).toString('utf8');
}
