// Xavfsizlik regression testlari (2026-07-19 audit).
// Ishga tushirish: npm run test -w @smeta/api
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { optionalHttpUrl } from '../src/util.js';
import { adminPasswordProblems } from '../src/adminCreds.js';

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
