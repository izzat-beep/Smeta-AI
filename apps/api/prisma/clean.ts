// Demo ma'lumotlarni tozalaydi: barcha mijozlar (tenant) va ularga bog'liq
// hamma narsa (foydalanuvchi, loyiha, smeta, sotuv, faollik) o'chadi.
// Super admin va global materiallar katalogi SAQLANADI.
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

dotenv.config({ path: path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../.env') });

const prisma = new PrismaClient();

async function main() {
  const r = await prisma.tenant.deleteMany({});
  console.log(`✓ ${r.count} ta demo mijoz va bog'liq ma'lumotlar o'chirildi`);
  console.log('✓ Super admin va global katalog saqlandi');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
