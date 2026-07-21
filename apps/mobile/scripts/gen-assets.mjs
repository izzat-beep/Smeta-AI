// Placeholder brend assetlarini (ikonka/splash/favicon) generatsiya qiladi —
// toza solid navy (#0F3473) markazida purple (#5555E7) kvadrat. EAS build uchun
// yaroqli PNG'lar. Keyin brendli dizayn bilan almashtiring.
// Ishga tushirish: node scripts/gen-assets.mjs
import { deflateSync } from 'node:zlib';
import { writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const dir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../assets');
mkdirSync(dir, { recursive: true });

// CRC32
const crcTable = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();
function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crc]);
}
function hex(c) {
  return [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)];
}
// w×h PNG: bg fon, markazida side×side kvadrat fg rangda.
function makePng(w, h, bg, fg, side) {
  const [br, bgc, bb] = hex(bg);
  const [fr, fgc, fb] = hex(fg);
  const x0 = (w - side) / 2;
  const y0 = (h - side) / 2;
  const raw = Buffer.alloc((w * 4 + 1) * h);
  let o = 0;
  for (let y = 0; y < h; y++) {
    raw[o++] = 0; // filter: none
    for (let x = 0; x < w; x++) {
      const inSq = x >= x0 && x < x0 + side && y >= y0 && y < y0 + side;
      raw[o++] = inSq ? fr : br;
      raw[o++] = inSq ? fgc : bgc;
      raw[o++] = inSq ? fb : bb;
      raw[o++] = 255;
    }
  }
  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
}

const NAVY = '#0F3473';
const PURPLE = '#5555E7';
const out = [
  ['icon.png', makePng(1024, 1024, NAVY, PURPLE, 440)],
  ['adaptive-icon.png', makePng(1024, 1024, NAVY, PURPLE, 380)],
  ['splash.png', makePng(1284, 2778, NAVY, PURPLE, 360)],
  ['favicon.png', makePng(48, 48, NAVY, PURPLE, 22)],
];
for (const [name, buf] of out) {
  writeFileSync(path.join(dir, name), buf);
  console.log(`✓ assets/${name} (${buf.length} bayt)`);
}
