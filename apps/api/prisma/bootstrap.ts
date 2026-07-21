// Production uchun IDEMPOTENT bootstrap — har deploy'da xavfsiz ishlaydi.
// Hech narsani o'CHIRMAYDI. Faqat admin foydalanuvchi va global materiallar
// katalogi mavjud bo'lmasa yaratadi. (To'liq demo ma'lumot uchun seed.ts ni ishlating.)
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { adminPasswordProblems } from '../src/adminCreds.js';
import { hashPassword } from '../src/password.js';

dotenv.config({ path: path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../.env') });

const prisma = new PrismaClient();

async function main() {
  // Super admin. Dev'da default qulaylik uchun qoladi; productionda esa
  // ADMIN_PASSWORD majburiy va kuchli bo'lishi shart (fail-fast, aks holda
  // repodagi ochiq parol bilan superadmin akkaunti yaratilib qolardi).
  const adminEmail = process.env.ADMIN_EMAIL ?? 'superadmin@smeta-ai.uz';
  const adminPassword = process.env.ADMIN_PASSWORD ?? 'Smeta@Admin2026';

  if (process.env.NODE_ENV === 'production') {
    const problems = adminPasswordProblems(process.env.ADMIN_PASSWORD);
    if (problems.length) {
      console.error(
        '\n  ❌ Xavfsizlik: bootstrap to\'xtatildi:\n' +
          problems.map((p) => `     • ${p}`).join('\n') +
          '\n  .env faylida ADMIN_PASSWORD ni kuchli parolga o\'rnating va qayta deploy qiling.\n',
      );
      process.exit(1);
    }
  }

  // Admin (upsert — mavjud bo'lsa tegmaydi/yangilaydi)
  await prisma.adminUser.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      fullName: 'Bosh Administrator',
      passwordHash: await hashPassword(adminPassword),
      role: 'SUPERADMIN',
    },
  });
  // Eski demo admin'ni o'chiramiz (agar boshqa super admin belgilangan bo'lsa)
  if (adminEmail !== 'admin@smeta.ai') {
    await prisma.adminUser.deleteMany({ where: { email: 'admin@smeta.ai' } });
  }
  console.log(`✓ Super admin tayyor: ${adminEmail}`);

  // Global materiallar katalogi — faqat bo'sh bo'lsa
  const globalCount = await prisma.material.count({ where: { tenantId: null } });
  if (globalCount === 0) {
    const materials = [
      { name: 'Beton M400 (Yuqori mustahkamlik)', category: 'Beton', provider: 'Euro Beton LLC', unit: 'm³', priceUzs: 750000, priceUsd: 60.5, stock: 120, rating: 4.8 },
      { name: 'Beton M300', category: 'Beton', provider: 'Euro Beton LLC', unit: 'm³', priceUzs: 700000, priceUsd: 56.4, stock: 200, rating: 4.6 },
      { name: 'Armatura A500C (12mm)', category: 'Metal', provider: 'Uzmetkombinat', unit: 'kg', priceUzs: 12500, priceUsd: 1.01, stock: 5000, rating: 4.9 },
      { name: "G'isht (Pishgan, standart)", category: 'Gisht', provider: 'Zangiota Bricks', unit: 'dona', priceUzs: 1800, priceUsd: 0.15, stock: 15000, rating: 4.5 },
      { name: 'Sement M500 (Qopda)', category: 'Beton', provider: 'Qizilqum Sement', unit: 'kg', priceUzs: 1400, priceUsd: 0.11, stock: 2000, rating: 4.6 },
      { name: 'Gipsokarton (Suvga chidamli)', category: 'Ichki ishlar', provider: 'Knauf Uzbekistan', unit: 'm²', priceUzs: 45000, priceUsd: 3.63, stock: 450, rating: 4.9 },
      { name: 'Kafel (Granit effekt)', category: 'Ichki ishlar', provider: 'Modena Ceramic', unit: 'm²', priceUzs: 120000, priceUsd: 9.68, stock: 220, rating: 4.4 },
      { name: 'Izolyatsiya (Mineral paxta)', category: 'Izolyatsiya', provider: 'TermoUz', unit: 'm²', priceUzs: 32000, priceUsd: 2.58, stock: 600, rating: 4.6 },
    ];
    await prisma.material.createMany({ data: materials.map((m) => ({ ...m, tenantId: null })) });
    console.log(`✓ ${materials.length} ta global material yaratildi`);
  } else {
    console.log(`✓ Global katalog mavjud (${globalCount} ta)`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
