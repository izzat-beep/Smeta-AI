// CSP uchun inline skript SHA-256 hash'larini hisoblaydi.
// Ishga tushirish (web build'dan keyin):  node scripts/csp-hashes.mjs
// Chiqqan 'sha256-...' qiymatlarini apps/web/nginx.conf script-src'ga qo'ying.
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const dist = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../dist/index.html');
const html = readFileSync(dist, 'utf8');

const re = /<script([^>]*)>([\s\S]*?)<\/script>/g;
let m;
const hashes = [];
while ((m = re.exec(html))) {
  const attrs = m[1];
  const body = m[2];
  if (/\bsrc=/.test(attrs)) continue; // tashqi skript — 'self'/whitelist
  const type = (attrs.match(/type=["]([^"]*)["]/) || [])[1] || '';
  // ld+json kabi data-bloklar CSP script-src'ga tushmaydi.
  if (type && type !== 'module' && type !== 'text/javascript' && type !== 'application/javascript') continue;
  const h = 'sha256-' + createHash('sha256').update(body, 'utf8').digest('base64');
  hashes.push(h);
  console.log(`${h}   (len=${body.length})`);
}

if (!hashes.length) console.log('(inline bajariladigan skript topilmadi)');
