// Xavfsizlik regression testlari (2026-07-19 audit).
// Ishga tushirish: npm run test -w @smeta/api
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { optionalHttpUrl } from '../src/util.js';
import { adminPasswordProblems } from '../src/adminCreds.js';
import { isLocked, nextFailedState, needsClear, lockRemainingSeconds, LOCKOUT } from '../src/lockout.js';

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
