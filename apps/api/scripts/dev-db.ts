// Lokal demo uchun haqiqiy PostgreSQL'ni Docker'siz ishga tushiradi (embedded-postgres).
// Jarayon ochiq turguncha baza ishlaydi. To'xtatish: Ctrl+C.
import EmbeddedPostgres from 'embedded-postgres';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../.pgdata');

const pg = new EmbeddedPostgres({
  databaseDir: dir,
  user: 'smeta',
  password: 'smeta',
  port: 5432,
  persistent: true,
  // UTF8 majburiy — o'zbek/maxsus belgilar (m³, m²) uchun.
  // Windows tizimi lokali WIN1251 bo'lishi mumkin, shuning uchun C lokal + UTF8.
  initdbFlags: ['--encoding=UTF8', '--locale=C'],
});

const alreadyInit = fs.existsSync(path.join(dir, 'PG_VERSION'));
if (!alreadyInit) {
  console.log('⏳ PostgreSQL klasteri yaratilmoqda (birinchi marta)...');
  await pg.initialise();
}

await pg.start();

try {
  await pg.createDatabase('smeta');
  console.log("✓ 'smeta' bazasi yaratildi");
} catch {
  console.log("✓ 'smeta' bazasi allaqachon mavjud");
}

console.log('\n✅ Embedded PostgreSQL ishlamoqda');
console.log('   postgresql://smeta:smeta@localhost:5432/smeta');
console.log("   (To'xtatish: Ctrl+C)\n");

async function shutdown() {
  console.log('\n⏹  PostgreSQL to\'xtatilmoqda...');
  try {
    await pg.stop();
  } catch {
    /* ignore */
  }
  process.exit(0);
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

// Jarayonni tirik saqlash (baza shu jarayonga bog'langan)
setInterval(() => {}, 1 << 30);
