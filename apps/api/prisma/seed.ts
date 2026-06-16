import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Root .env dan DATABASE_URL ni yuklaymiz (apps/api/prisma -> smeta-ai)
dotenv.config({ path: path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../.env') });

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seed boshlandi...');

  // Tozalash (idempotent seed)
  await prisma.chatMessage.deleteMany();
  await prisma.chatSession.deleteMany();
  await prisma.estimateItem.deleteMany();
  await prisma.estimate.deleteMany();
  await prisma.activity.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.project.deleteMany();
  await prisma.material.deleteMany();
  await prisma.user.deleteMany();
  await prisma.tenant.deleteMany();
  await prisma.adminUser.deleteMany();

  // ─── Admin ──────────────────────────────────────────────────────────────
  await prisma.adminUser.create({
    data: {
      email: 'admin@smeta.ai',
      fullName: 'Bosh Administrator',
      passwordHash: await bcrypt.hash('admin1234', 10),
      role: 'SUPERADMIN',
    },
  });
  console.log('  ✓ Admin: admin@smeta.ai / admin1234');

  // ─── Global materiallar katalogi ──────────────────────────────────────────
  const materials = [
    { name: 'Beton M400 (Yuqori mustahkamlik)', category: 'Beton', provider: 'Euro Beton LLC', unit: 'm³', priceUzs: 750000, priceUsd: 60.5, stock: 120, rating: 4.8 },
    { name: 'Beton M300', category: 'Beton', provider: 'Euro Beton LLC', unit: 'm³', priceUzs: 700000, priceUsd: 56.4, stock: 200, rating: 4.6 },
    { name: 'Armatura A500C (12mm)', category: 'Metal', provider: 'Uzmetkombinat', unit: 'kg', priceUzs: 12500, priceUsd: 1.01, stock: 5000, rating: 4.9 },
    { name: "G'isht (Pishgan, standart)", category: 'Gisht', provider: 'Zangiota Bricks', unit: 'dona', priceUzs: 1800, priceUsd: 0.15, stock: 15000, rating: 4.5 },
    { name: "Yog'och Reyka (40x40mm)", category: 'Yogoch', provider: 'WoodMaster Export', unit: 'm', priceUzs: 8500, priceUsd: 0.68, stock: 850, rating: 4.7 },
    { name: 'Sement M500 (Qopda)', category: 'Beton', provider: 'Qizilqum Sement', unit: 'kg', priceUzs: 1400, priceUsd: 0.11, stock: 2000, rating: 4.6 },
    { name: 'Gipsokarton (Suvga chidamli)', category: 'Ichki ishlar', provider: 'Knauf Uzbekistan', unit: 'm²', priceUzs: 45000, priceUsd: 3.63, stock: 450, rating: 4.9 },
    { name: 'Kafel (Granit effekt)', category: 'Ichki ishlar', provider: 'Modena Ceramic', unit: 'm²', priceUzs: 120000, priceUsd: 9.68, stock: 220, rating: 4.4 },
    { name: 'Izolyatsiya (Mineral paxta)', category: 'Izolyatsiya', provider: 'TermoUz', unit: 'm²', priceUzs: 32000, priceUsd: 2.58, stock: 600, rating: 4.6 },
    { name: 'Qum (yuvilgan)', category: 'Beton', provider: 'Qurilish Servis', unit: 'm³', priceUzs: 80000, priceUsd: 6.45, stock: 300, rating: 4.3 },
    { name: "Shag'al", category: 'Beton', provider: 'Qurilish Servis', unit: 'm³', priceUzs: 100000, priceUsd: 8.06, stock: 250, rating: 4.4 },
    { name: 'Emulsiya bo\'yoq (oq)', category: 'Ichki ishlar', provider: 'ColorPro', unit: 'litr', priceUzs: 35000, priceUsd: 2.82, stock: 400, rating: 4.5 },
  ];
  await prisma.material.createMany({ data: materials.map((m) => ({ ...m, tenantId: null })) });
  console.log(`  ✓ ${materials.length} ta global material`);

  // ─── Asosiy demo mijoz (tenant) ──────────────────────────────────────────
  const demoTenant = await prisma.tenant.create({
    data: {
      name: 'BuildSmart Solutions MCHJ',
      inn: '123456789',
      phone: '+998 90 123 45 67',
      plan: 'PROFESSIONAL',
      status: 'ACTIVE',
      users: {
        create: [
          {
            fullName: 'Jamshid Abduvoxidov',
            email: 'j.abduvoxidov@smeta.ai',
            phone: '+998 90 123 45 67',
            passwordHash: await bcrypt.hash('demo1234', 10),
            role: 'OWNER',
            position: 'Bosh muhandis',
          },
          {
            fullName: 'Malika Karimova',
            email: 'malika@smeta.ai',
            passwordHash: await bcrypt.hash('demo1234', 10),
            role: 'MANAGER',
            position: 'Loyiha menejeri',
          },
        ],
      },
    },
    include: { users: true },
  });
  const owner = demoTenant.users[0];
  const manager = demoTenant.users[1];
  console.log('  ✓ Demo mijoz: j.abduvoxidov@smeta.ai / demo1234');

  // Loyihalar
  const projects = [
    { code: 'PRJ-001', title: 'Skyline Turar-joy Majmuasi', clientName: 'Global Build Co.', category: "Ko'p qavatli bino", value: 4250000000, currency: 'UZS', progress: 65, status: 'IN_PROGRESS', deadline: new Date('2026-12-20'), managerId: owner.id },
    { code: 'PRJ-002', title: 'Eco-Park Sanoat Markazi', clientName: 'Green Future LLC', category: 'Sanoat', value: 1890000, currency: 'USD', progress: 15, status: 'PLANNED', deadline: new Date('2027-03-15'), managerId: manager.id },
    { code: 'PRJ-003', title: 'Yunusobod Biznes Markazi', clientName: 'Toshkent City Invest', category: 'Tijorat', value: 12400000000, currency: 'UZS', progress: 42, status: 'IN_PROGRESS', deadline: new Date('2026-09-01'), managerId: owner.id },
    { code: 'PRJ-004', title: 'Zarkaynar Villa Majmuasi', clientName: 'Premium Estates', category: 'Xususiy sektor', value: 8500000000, currency: 'UZS', progress: 100, status: 'COMPLETED', deadline: new Date('2025-05-10'), managerId: manager.id },
    { code: 'PRJ-005', title: 'Samarqand Logistika Markazi', clientName: 'Silk Road Logistics', category: 'Logistika', value: 3200000, currency: 'USD', progress: 78, status: 'IN_PROGRESS', deadline: new Date('2026-11-18'), managerId: owner.id },
    { code: 'PRJ-006', title: 'Modern School Reconstruction', clientName: "Xalq Ta'limi Vazirligi", category: "Davlat ob'ekti", value: 5600000000, currency: 'UZS', progress: 5, status: 'PLANNED', deadline: new Date('2027-08-01'), managerId: manager.id },
  ];
  for (const p of projects) {
    await prisma.project.create({ data: { ...p, tenantId: demoTenant.id, currency: p.currency as any, status: p.status as any } });
  }
  console.log(`  ✓ ${projects.length} ta loyiha`);

  // Smetalar (items bilan)
  const firstProject = await prisma.project.findFirst({ where: { tenantId: demoTenant.id, code: 'PRJ-001' } });
  const estItems = [
    { name: 'Sement M400', type: 'MATERIAL', qty: 50, unit: 'qop', unitPrice: 50000 },
    { name: 'Armatura 12mm', type: 'MATERIAL', qty: 1200, unit: 'kg', unitPrice: 7000 },
    { name: 'Qum (yuvilgan)', type: 'MATERIAL', qty: 15, unit: 'm³', unitPrice: 80000 },
    { name: "G'isht (pishgan)", type: 'MATERIAL', qty: 5000, unit: 'dona', unitPrice: 900 },
    { name: 'Beton M300', type: 'MATERIAL', qty: 20, unit: 'm³', unitPrice: 700000 },
    { name: 'Quruvchi ishchilar', type: 'LABOR', qty: 120, unit: 'soat', unitPrice: 25000 },
    { name: 'Kran ijarasi', type: 'EQUIPMENT', qty: 2, unit: 'sutka', unitPrice: 1500000 },
  ];
  const subtotal = estItems.reduce((s, i) => s + i.qty * i.unitPrice, 0);
  const taxRate = 12;
  const taxAmount = (subtotal * taxRate) / 100;
  await prisma.estimate.create({
    data: {
      tenantId: demoTenant.id,
      projectId: firstProject?.id ?? null,
      title: 'Skyline — poydevor smetasi',
      currency: 'UZS',
      taxRate,
      subtotal,
      taxAmount,
      total: subtotal + taxAmount,
      status: 'APPROVED',
      items: { create: estItems.map((i) => ({ ...i, type: i.type as any, lineTotal: i.qty * i.unitPrice })) },
    },
  });
  console.log('  ✓ Namunaviy smeta');

  // Faollik
  const activities = [
    { userId: owner.id, action: 'material narxini yangiladi', projectName: 'Skyline Turar-joy Majmuasi' },
    { userId: manager.id, action: 'yangi smeta yaratdi', projectName: 'Eco-Park Sanoat Markazi' },
    { userId: owner.id, action: 'loyihani arxivladi', projectName: 'City Garden Phase 1' },
    { userId: manager.id, action: 'hisobotni yuklab oldi', projectName: 'Yunusobod Biznes Markazi' },
  ];
  for (const a of activities) await prisma.activity.create({ data: { ...a, tenantId: demoTenant.id } });
  console.log(`  ✓ ${activities.length} ta faollik`);

  // Hisob-fakturalar
  await prisma.invoice.createMany({
    data: [
      { tenantId: demoTenant.id, amount: 499000, currency: 'UZS', period: '2026-05', status: 'PAID', paidAt: new Date('2026-05-03') },
      { tenantId: demoTenant.id, amount: 499000, currency: 'UZS', period: '2026-06', status: 'PENDING' },
    ],
  });

  // ─── Qo'shimcha mijozlar (admin panel uchun) ──────────────────────────────
  const others = [
    { name: "Build-UP MCHJ", plan: 'BOSHLANGICH', status: 'ACTIVE', owner: 'Anvar Rahimov', email: 'anvar@buildup.uz' },
    { name: 'Green Life Co.', plan: 'PROFESSIONAL', status: 'TRIAL', owner: 'Malika Ahmedova', email: 'malika@greenlife.uz' },
    { name: 'Mega Building LLC', plan: 'KORPORATIV', status: 'ACTIVE', owner: 'Jasur Komilov', email: 'jasur@megabuild.uz' },
    { name: 'Zamon Group', plan: 'PROFESSIONAL', status: 'SUSPENDED', owner: 'Dilnoza Olimova', email: 'dilnoza@zamon.uz' },
    { name: 'Silk Road Construct', plan: 'BOSHLANGICH', status: 'TRIAL', owner: 'Sardor Azimov', email: 'sardor@silkroad.uz' },
    { name: 'Toshkent City Invest', plan: 'KORPORATIV', status: 'ACTIVE', owner: "Anvar G'ofurov", email: 'anvar@tashcity.uz' },
  ];
  for (const o of others) {
    await prisma.tenant.create({
      data: {
        name: o.name,
        plan: o.plan as any,
        status: o.status as any,
        trialEndsAt: o.status === 'TRIAL' ? new Date(Date.now() + 10 * 86400000) : null,
        users: {
          create: {
            fullName: o.owner,
            email: o.email,
            passwordHash: await bcrypt.hash('demo1234', 10),
            role: 'OWNER',
            position: 'Rahbar',
          },
        },
        projects: {
          create: Array.from({ length: Math.floor(Math.random() * 4) + 1 }, (_, i) => ({
            code: `PRJ-00${i + 1}`,
            title: `${o.name} loyihasi ${i + 1}`,
            clientName: 'Mijoz',
            value: Math.floor(Math.random() * 5000000000),
            progress: Math.floor(Math.random() * 100),
            status: 'IN_PROGRESS' as any,
          })),
        },
      },
    });
  }
  console.log(`  ✓ ${others.length} ta qo'shimcha mijoz`);

  console.log('✅ Seed yakunlandi!\n');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
