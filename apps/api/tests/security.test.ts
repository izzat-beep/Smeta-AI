// Xavfsizlik regression testlari (2026-07-19 audit).
// Ishga tushirish: npm run test -w @smeta/api
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { optionalHttpUrl } from '../src/util.js';
import { adminPasswordProblems } from '../src/adminCreds.js';
import { isLocked, nextFailedState, needsClear, lockRemainingSeconds, LOCKOUT } from '../src/lockout.js';
import { hmacHashToken, legacyHashToken } from '../src/auth.js';
import { totpAt, verifyTOTP, generateSecret, base32Encode, base32Decode, otpauthURL } from '../src/totp.js';
import { encryptSecret, decryptSecret } from '../src/totpCrypto.js';

// ─── URL maydonlari (avatarUrl/logoUrl/imageUrl) ─────────────────────────────

test('optionalHttpUrl: https URL qabul qilinadi', () => {
  assert.equal(optionalHttpUrl.parse('https://example.com/logo.png'), 'https://example.com/logo.png');
});

test('optionalHttpUrl: http URL qabul qilinadi (dev)', () => {
  assert.equal(optionalHttpUrl.parse('http://localhost:5173/a.png'), 'http://localhost:5173/a.png');
});

test("optionalHttpUrl: bo'sh satr null'ga aylanadi (tozalash)", () => {
  assert.equal(optionalHttpUrl.parse(''), null);
});

test("optionalHttpUrl: undefined/null o'z holicha o'tadi", () => {
  assert.equal(optionalHttpUrl.parse(undefined), undefined);
  assert.equal(optionalHttpUrl.parse(null), null);
});

test('optionalHttpUrl: javascript: sxemasi rad etiladi', () => {
  assert.throws(() => optionalHttpUrl.parse('javascript:alert(1)'));
});

test('optionalHttpUrl: data: sxemasi rad etiladi', () => {
  assert.throws(() => optionalHttpUrl.parse('data:text/html;base64,PHNjcmlwdD4='));
});

test('optionalHttpUrl: URL bo\'lmagan matn rad etiladi', () => {
  assert.throws(() => optionalHttpUrl.parse('shunchaki matn'));
});

test('optionalHttpUrl: 2048 belgidan uzun URL rad etiladi', () => {
  assert.throws(() => optionalHttpUrl.parse('https://example.com/' + 'a'.repeat(2100)));
});

// ─── Bootstrap super admin paroli siyosati ───────────────────────────────────

test("adminPasswordProblems: o'rnatilmagan parol rad etiladi", () => {
  assert.ok(adminPasswordProblems(undefined).length > 0);
  assert.ok(adminPasswordProblems('').length > 0);
});

test('adminPasswordProblems: repodagi namuna parollar rad etiladi', () => {
  assert.ok(adminPasswordProblems('admin1234').length > 0);
  assert.ok(adminPasswordProblems('Smeta@Admin2026').length > 0);
  assert.ok(adminPasswordProblems('demo1234').length > 0);
});

test('adminPasswordProblems: qisqa parol rad etiladi', () => {
  assert.ok(adminPasswordProblems('Ab1!xyz').length > 0);
});

test("adminPasswordProblems: kuchli parol o'tadi", () => {
  assert.equal(adminPasswordProblems('X9#kL2mQ8@pR4z').length, 0);
});

// ─── Account lockout ─────────────────────────────────────────────────────────

test('isLocked: lockedUntil kelajakda bo\'lsa true', () => {
  assert.equal(isLocked({ failedLoginAttempts: 0, lockedUntil: new Date(Date.now() + 60_000) }), true);
});

test('isLocked: lockedUntil o\'tmishda bo\'lsa false (avto-ochilish)', () => {
  assert.equal(isLocked({ failedLoginAttempts: 0, lockedUntil: new Date(Date.now() - 60_000) }), false);
});

test('isLocked: lockedUntil null bo\'lsa false', () => {
  assert.equal(isLocked({ failedLoginAttempts: 3, lockedUntil: null }), false);
});

test('nextFailedState: chegaradan past — faqat hisoblagich oshadi', () => {
  const next = nextFailedState({ failedLoginAttempts: 2, lockedUntil: null });
  assert.equal(next.failedLoginAttempts, 3);
  assert.equal(next.lockedUntil, null);
});

test('nextFailedState: chegaraga yetganda bloklaydi va hisoblagichni tozalaydi', () => {
  const now = new Date('2026-07-19T10:00:00Z');
  const next = nextFailedState({ failedLoginAttempts: LOCKOUT.maxFailed - 1, lockedUntil: null }, now);
  assert.equal(next.failedLoginAttempts, 0);
  assert.ok(next.lockedUntil instanceof Date);
  assert.equal(next.lockedUntil!.getTime(), now.getTime() + LOCKOUT.lockMinutes * 60_000);
});

test('lockRemainingSeconds: qolgan vaqtni to\'g\'ri hisoblaydi', () => {
  const now = new Date();
  const rem = lockRemainingSeconds({ failedLoginAttempts: 0, lockedUntil: new Date(now.getTime() + 90_000) }, now);
  assert.ok(rem >= 89 && rem <= 90);
});

test('needsClear: toza holatda false, iflos holatda true', () => {
  assert.equal(needsClear({ failedLoginAttempts: 0, lockedUntil: null }), false);
  assert.equal(needsClear({ failedLoginAttempts: 1, lockedUntil: null }), true);
  assert.equal(needsClear({ failedLoginAttempts: 0, lockedUntil: new Date() }), true);
});

// ─── Refresh token HMAC hashing (JWT_REFRESH_SECRET endi ishlatiladi) ────────

test('hmacHashToken: deterministik (bir xil kirish -> bir xil hash)', () => {
  assert.equal(hmacHashToken('token-abc', 'sir'), hmacHashToken('token-abc', 'sir'));
});

test('hmacHashToken: kalit HMAC natijasiga ta\'sir qiladi', () => {
  assert.notEqual(hmacHashToken('token-abc', 'sir1'), hmacHashToken('token-abc', 'sir2'));
});

test('hmacHashToken: legacy (kalitsiz) SHA-256 dan farq qiladi', () => {
  assert.notEqual(hmacHashToken('token-abc', 'sir'), legacyHashToken('token-abc'));
});

test('hmacHashToken: 64 belgili hex qaytaradi', () => {
  assert.match(hmacHashToken('x', 'y'), /^[0-9a-f]{64}$/);
});

// ─── TOTP (RFC 6238) — rasmiy test vektorlari bilan ─────────────────────────
// RFC 6238 Appendix B, SHA1, sir = ASCII "12345678901234567890" (20 bayt).
// RFC 8 xonali kodlarning oxirgi 6 raqami bizning 6 xonali kodimizga teng.
const RFC_SECRET = base32Encode(Buffer.from('12345678901234567890'));
const RFC_VECTORS: [number, string][] = [
  [59, '287082'],
  [1111111109, '081804'],
  [1111111111, '050471'],
  [1234567890, '005924'],
  [2000000000, '279037'],
  [20000000000, '353130'],
];

for (const [sec, expected] of RFC_VECTORS) {
  test(`totpAt: RFC 6238 vektor t=${sec}s -> ${expected}`, () => {
    assert.equal(totpAt(RFC_SECRET, sec * 1000), expected);
  });
}

test('base32: encode/decode teskari (round-trip)', () => {
  const buf = Buffer.from('12345678901234567890');
  assert.deepEqual(base32Decode(base32Encode(buf)), buf);
});

test('verifyTOTP: to\'g\'ri kod qabul qilinadi', () => {
  const now = 1111111111 * 1000;
  assert.equal(verifyTOTP(RFC_SECRET, '050471', now), true);
});

test('verifyTOTP: noto\'g\'ri kod rad etiladi', () => {
  assert.equal(verifyTOTP(RFC_SECRET, '000000', 1111111111 * 1000), false);
});

test('verifyTOTP: oldingi oynadagi kod (window=1) qabul qilinadi', () => {
  const now = 1111111111 * 1000;
  const prev = totpAt(RFC_SECRET, now - 30_000);
  assert.equal(verifyTOTP(RFC_SECRET, prev, now), true);
});

test('verifyTOTP: 2 oyna uzoqdagi kod rad etiladi', () => {
  const now = 1111111111 * 1000;
  const far = totpAt(RFC_SECRET, now - 90_000);
  assert.equal(verifyTOTP(RFC_SECRET, far, now), false);
});

test('verifyTOTP: 6 raqamdan boshqa format rad etiladi', () => {
  assert.equal(verifyTOTP(RFC_SECRET, '12345', Date.now()), false);
  assert.equal(verifyTOTP(RFC_SECRET, 'abcdef', Date.now()), false);
});

test('generateSecret: base32, kamida 32 belgi (>=160 bit)', () => {
  const s = generateSecret();
  assert.match(s, /^[A-Z2-7]+$/);
  assert.ok(s.length >= 32);
});

test('otpauthURL: to\'g\'ri otpauth:// formati', () => {
  const url = otpauthURL('ABCDEF', 'admin@smeta.uz');
  assert.ok(url.startsWith('otpauth://totp/'));
  assert.match(url, /secret=ABCDEF/);
  assert.match(url, /issuer=Smeta(\+|%20)AI/);
});

// ─── TOTP sirini shifrlash (AES-256-GCM) ─────────────────────────────────────

test('encrypt/decrypt: round-trip asl sirni qaytaradi', () => {
  const secret = generateSecret();
  assert.equal(decryptSecret(encryptSecret(secret)), secret);
});

test('encryptSecret: har safar boshqa ciphertext (tasodifiy IV)', () => {
  assert.notEqual(encryptSecret('SAME'), encryptSecret('SAME'));
});

test('encryptSecret: natijada ochiq sir ko\'rinmaydi', () => {
  const enc = encryptSecret('MYSECRET123');
  assert.ok(!enc.includes('MYSECRET123'));
  assert.ok(enc.startsWith('v1:'));
});

test('decryptSecret: buzilgan ciphertext (GCM tag) rad etiladi', () => {
  const enc = encryptSecret('DATA');
  const parts = enc.split(':');
  parts[3] = Buffer.from('buzilgan-data').toString('base64'); // ciphertextni almashtiramiz
  assert.throws(() => decryptSecret(parts.join(':')));
});
