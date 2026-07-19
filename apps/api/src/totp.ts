// TOTP (RFC 6238) — dependency'siz, Node crypto bilan. Admin panel 2FA uchun.
// Standart: SHA1, 6 raqam, 30 soniyalik qadam (Google Authenticator, Authy,
// 1Password bilan mos). Sof funksiyalar — RFC 6238 test vektorlari bilan sinaladi.
import crypto from 'node:crypto';

const DIGITS = 6;
const PERIOD = 30; // soniya

// ─── Base32 (RFC 4648, padding'siz) ──────────────────────────────────────────
const B32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

export function base32Encode(buf: Buffer): string {
  let bits = 0;
  let value = 0;
  let out = '';
  for (const byte of buf) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      out += B32_ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) out += B32_ALPHABET[(value << (5 - bits)) & 31];
  return out;
}

export function base32Decode(input: string): Buffer {
  const clean = input.replace(/=+$/,'').replace(/\s/g, '').toUpperCase();
  let bits = 0;
  let value = 0;
  const out: number[] = [];
  for (const ch of clean) {
    const idx = B32_ALPHABET.indexOf(ch);
    if (idx === -1) throw new Error('Base32 xato belgisi');
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      out.push((value >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }
  return Buffer.from(out);
}

// ─── HOTP (RFC 4226) va TOTP (RFC 6238) ──────────────────────────────────────
function hotp(secret: Buffer, counter: number): string {
  const buf = Buffer.alloc(8);
  // 64-bit counter (big-endian). JS bitwise 32-bitli, shu bois ikki qismga bo'lamiz.
  buf.writeUInt32BE(Math.floor(counter / 0x100000000), 0);
  buf.writeUInt32BE(counter >>> 0, 4);
  const hmac = crypto.createHmac('sha1', secret).update(buf).digest();
  const offset = hmac[hmac.length - 1] & 0x0f;
  const bin =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);
  return (bin % 10 ** DIGITS).toString().padStart(DIGITS, '0');
}

// Berilgan vaqt (ms) uchun TOTP kodini hisoblaydi.
export function totpAt(secretBase32: string, timeMs: number): string {
  const counter = Math.floor(timeMs / 1000 / PERIOD);
  return hotp(base32Decode(secretBase32), counter);
}

// Foydalanuvchi kiritgan kodni tekshiradi. window=1 → oldingi/keyingi 30s
// oynasini ham qabul qiladi (soat farqi/kechikish uchun). Doimiy-vaqt solishtirish.
export function verifyTOTP(
  secretBase32: string,
  token: string,
  now: number = Date.now(),
  window = 1,
): boolean {
  const clean = (token ?? '').replace(/\s/g, '');
  if (!/^\d{6}$/.test(clean)) return false;
  const counter = Math.floor(now / 1000 / PERIOD);
  const secret = base32Decode(secretBase32);
  for (let w = -window; w <= window; w++) {
    const candidate = hotp(secret, counter + w);
    // timingSafeEqual bir xil uzunlikdagi bufer talab qiladi (ikkalasi 6 raqam).
    if (crypto.timingSafeEqual(Buffer.from(candidate), Buffer.from(clean))) return true;
  }
  return false;
}

// Yangi tasodifiy TOTP siri (20 bayt = 160 bit, RFC tavsiyasi) base32'da.
export function generateSecret(): string {
  return base32Encode(crypto.randomBytes(20));
}

// Authenticator ilovasi uchun otpauth:// URL (QR kodga aylantiriladi).
export function otpauthURL(secretBase32: string, accountLabel: string, issuer = 'Smeta AI'): string {
  const label = encodeURIComponent(`${issuer}:${accountLabel}`);
  const params = new URLSearchParams({
    secret: secretBase32,
    issuer,
    algorithm: 'SHA1',
    digits: String(DIGITS),
    period: String(PERIOD),
  });
  return `otpauth://totp/${label}?${params.toString()}`;
}
