// ═══════════════════════════════════════════════════════════════════════
//  YAGONA HISOBLASH MANBAI (Vazifa 2) — kalkulyator formulasi.
//  Dashboard, hisobotlar va smeta saqlash AYNAN shu funksiyalardan
//  foydalanadi — ikki joyda alohida formula bo'lishi taqiqlanadi.
//
//  Kalkulyator formulasi:
//    subtotal  = Σ (qty × unitPrice)         [UZS]
//    taxAmount = subtotal × taxRate / 100
//    total     = subtotal + taxAmount        ← smeta "Yakiniy summa"
//  Umumiy harajatlar (generalExpenses, V5 avto-yozuvlar bilan):
//    Σ amount (USD qatorlar tenant kursida UZS'ga o'giriladi)
//  Umumiy xarajat = Σ smeta.total + Σ umumiy harajatlar
//  Sof foyda      = kelgan pullar (sotuvlar bo'yicha to'langan) − umumiy xarajat
// ═══════════════════════════════════════════════════════════════════════
import { prisma, toNum } from './prisma.js';

// Kalkulyator yig'indisi — estimates route saqlashda ham shu ishlatiladi.
export function estimateTotals(items: { qty: number; unitPrice: number }[], taxRate: number) {
  const subtotal = items.reduce((sum, i) => sum + i.qty * i.unitPrice, 0);
  const taxAmount = (subtotal * taxRate) / 100;
  return { subtotal, taxAmount, total: subtotal + taxAmount };
}

// Foiz o'zgarish: o'tgan davr ma'lumoti bo'lmasa (0) — null (badge ko'rsatilmaydi).
// Fake foiz taqiqlanadi.
export function pctChange(current: number, previous: number): number | null {
  if (!previous) return null;
  return Math.round(((current - previous) / Math.abs(previous)) * 1000) / 10;
}

export type ExpenseCategory = 'MATERIAL' | 'LABOR' | 'EQUIPMENT' | 'GENERAL';

// Kategoriya bo'yicha FAKT (haqiqiy) xarajat — Reja vs Fakt jadvali uchun.
export type CategoryFakt = Record<ExpenseCategory, number>;

export interface TenantFinance {
  materialCost: number; // smeta MATERIAL + buyurtma avto xarajatlar + material kategoriyali harajat (UZS)
  laborCost: number; // smeta LABOR + labor kategoriyali harajat
  equipmentCost: number; // smeta EQUIPMENT + equipment kategoriyali harajat
  generalCost: number; // GENERAL kategoriyali qo'lda harajatlar
  taxAmount: number; // smeta soliqlari
  estimatesTotal: number; // Σ smeta.total (kalkulyator "Yakuniy summa")
  orderExpenses: number; // buyurtmadan avtomatik yozilgan xarajatlar (V5, material)
  manualExpenses: number; // qo'lda kiritilgan harajatlar (barcha kategoriya, buyurtmasiz)
  generalExpensesTotal: number; // orderExpenses + manualExpenses
  totalExpense: number; // estimatesTotal + generalExpensesTotal
  faktByCategory: CategoryFakt; // kategoriya bo'yicha fakt (soliqsiz, lineTotal asosida)
  incoming: number; // sotuvlar to'lovlari + Income yozuvlari (UZS'ga normallashtirilgan)
  netProfit: number; // incoming - totalExpense
  estimatesCount: number;
  pendingEstimates: number; // PENDING statusdagi smetalar
}

interface Range {
  from?: Date;
  to?: Date; // exclusive
  projectId?: string | null; // berilsa — shu loyiha; 'null' (aniq) — loyihasiz; undefined — barchasi
}

function createdAtFilter(range?: Range) {
  if (!range?.from && !range?.to) return undefined;
  return { ...(range.from ? { gte: range.from } : {}), ...(range.to ? { lt: range.to } : {}) };
}

// projectId filtri: undefined bo'lsa cheklanmaydi; aniq qiymat (null yoki id) bo'lsa filtrlanadi.
function projectFilter(range?: Range): { projectId?: string | null } {
  return range && 'projectId' in range && range.projectId !== undefined ? { projectId: range.projectId } : {};
}

// Tenant kursi: USD summalarni UZS'ga o'girish uchun.
export async function tenantRate(tenantId: string): Promise<number> {
  const t = await prisma.tenant.findUnique({ where: { id: tenantId }, select: { usdRate: true } });
  return toNum(t?.usdRate ?? 12600) || 12600;
}

export async function computeTenantFinance(tenantId: string, range?: Range): Promise<TenantFinance> {
  const createdAt = createdAtFilter(range);
  const proj = projectFilter(range);
  const [rate, estimates, expenses, sales, incomes] = await Promise.all([
    tenantRate(tenantId),
    prisma.estimate.findMany({
      where: { tenantId, ...proj, ...(createdAt ? { createdAt } : {}) },
      include: { items: true },
    }),
    prisma.generalExpenses.findMany({
      where: { tenantId, ...proj, ...(createdAt ? { createdAt } : {}) },
      select: { amount: true, currency: true, orderId: true, category: true },
    }),
    prisma.sale.findMany({
      where: { tenantId, ...proj, ...(createdAt ? { createdAt } : {}) },
      select: { paid: true, currency: true },
    }),
    prisma.income.findMany({
      where: { tenantId, ...proj, ...(createdAt ? { date: createdAt } : {}) },
      select: { amount: true, currency: true },
    }),
  ]);
  const toUzs = (amount: number, currency: string) => (currency === 'USD' ? amount * rate : amount);

  const fakt: CategoryFakt = { MATERIAL: 0, LABOR: 0, EQUIPMENT: 0, GENERAL: 0 };
  let taxAmount = 0;
  let estimatesTotal = 0;
  for (const e of estimates) {
    // Smeta bazaviy UZS'da saqlanadi (kalkulyator hamma narsani UZS'ga o'girib yozadi)
    estimatesTotal += toNum(e.total);
    taxAmount += toNum(e.taxAmount);
    for (const i of e.items) {
      const line = toNum(i.lineTotal);
      if (i.type === 'LABOR') fakt.LABOR += line;
      else if (i.type === 'EQUIPMENT') fakt.EQUIPMENT += line;
      else fakt.MATERIAL += line;
    }
  }

  let orderExpenses = 0;
  let manualExpenses = 0;
  for (const x of expenses) {
    const v = toUzs(x.amount, x.currency);
    if (x.orderId) {
      // Buyurtmadan avtomatik yozilgan = material xaridi
      orderExpenses += v;
      fakt.MATERIAL += v;
    } else {
      manualExpenses += v;
      const cat = (x.category ?? 'GENERAL') as ExpenseCategory;
      fakt[cat] += v;
    }
  }
  const generalExpensesTotal = orderExpenses + manualExpenses;

  const salesIn = sales.reduce((sum, s) => sum + toUzs(toNum(s.paid), s.currency), 0);
  const incomeIn = incomes.reduce((sum, i) => sum + toUzs(toNum(i.amount), i.currency), 0);
  const incoming = salesIn + incomeIn;
  const totalExpense = estimatesTotal + generalExpensesTotal;

  const pendingEstimates = estimates.filter((e) => e.status === 'PENDING').length;

  return {
    materialCost: fakt.MATERIAL,
    laborCost: fakt.LABOR,
    equipmentCost: fakt.EQUIPMENT,
    generalCost: fakt.GENERAL,
    taxAmount,
    estimatesTotal,
    orderExpenses,
    manualExpenses,
    generalExpensesTotal,
    totalExpense,
    faktByCategory: fakt,
    incoming,
    netProfit: incoming - totalExpense,
    estimatesCount: estimates.length,
    pendingEstimates,
  };
}

// Oy boshi (lokal server vaqti bo'yicha)
function monthStart(d: Date, offset = 0): Date {
  return new Date(d.getFullYear(), d.getMonth() + offset, 1);
}
function ymKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export interface MonthPoint {
  ym: string; // '2026-07' — frontend lokalga mos oy nomini o'zi chiqaradi
  actual: number; // haqiqiy xarajat: smeta.total + umumiy harajatlar (yaratilgan oy bo'yicha)
  planned: number; // rejalashtirilgan: smeta bosqichlari (Muddatlar) sanasi bo'yicha
}

// Oylik xarajat dinamikasi — oxirgi N oy. Ma'lumot yo'q oy = 0 (fake taqsimot yo'q).
// projectId berilsa — faqat shu loyiha (null = loyihasiz; undefined = barchasi).
export async function monthlyExpenseSeries(tenantId: string, months: number, projectId?: string | null): Promise<MonthPoint[]> {
  const now = new Date();
  const from = monthStart(now, -(months - 1));
  const toEx = monthStart(now, 1);
  const proj = projectId !== undefined ? { projectId } : {};
  const [rate, estimates, expenses, stages] = await Promise.all([
    tenantRate(tenantId),
    prisma.estimate.findMany({
      where: { tenantId, ...proj, createdAt: { gte: from, lt: toEx } },
      select: { total: true, createdAt: true },
    }),
    prisma.generalExpenses.findMany({
      where: { tenantId, ...proj, createdAt: { gte: from, lt: toEx } },
      select: { amount: true, currency: true, createdAt: true },
    }),
    prisma.estimateStage.findMany({
      where: { estimate: { tenantId, ...proj }, date: { gte: from, lt: toEx } },
      select: { amount: true, currency: true, date: true },
    }),
  ]);
  const toUzs = (amount: number, currency: string) => (currency === 'USD' ? amount * rate : amount);

  const points = new Map<string, MonthPoint>();
  for (let i = 0; i < months; i++) {
    const d = monthStart(from, i);
    points.set(ymKey(d), { ym: ymKey(d), actual: 0, planned: 0 });
  }
  for (const e of estimates) {
    const p = points.get(ymKey(e.createdAt));
    if (p) p.actual += toNum(e.total);
  }
  for (const x of expenses) {
    const p = points.get(ymKey(x.createdAt));
    if (p) p.actual += toUzs(x.amount, x.currency);
  }
  for (const st of stages) {
    if (!st.date) continue;
    const p = points.get(ymKey(st.date));
    if (p) p.planned += toUzs(toNum(st.amount), st.currency);
  }
  return [...points.values()].map((p) => ({
    ym: p.ym,
    actual: Math.round(p.actual),
    planned: Math.round(p.planned),
  }));
}

// Resurs sarfi — smeta pozitsiyalari bo'yicha eng katta 5 ta (summasi bo'yicha % taqsimot).
export async function resourceUsage(tenantId: string, projectId?: string | null): Promise<{ label: string; percentage: number }[]> {
  const proj = projectId !== undefined ? { projectId } : {};
  const items = await prisma.estimateItem.findMany({
    where: { estimate: { tenantId, ...proj } },
    select: { name: true, lineTotal: true },
  });
  const byName = new Map<string, number>();
  for (const i of items) byName.set(i.name, (byName.get(i.name) ?? 0) + toNum(i.lineTotal));
  const maxVal = Math.max(1, ...byName.values());
  return [...byName.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([label, val]) => ({ label, percentage: Math.round((val / maxVal) * 100) }));
}

// Joriy oy vs o'tgan oy trendlari (real; o'tgan oy bo'sh bo'lsa null).
export interface FinanceTrends {
  totalExpense: number | null;
  materialCost: number | null;
  laborCost: number | null;
  netProfit: number | null;
}

export async function monthOverMonthTrends(tenantId: string): Promise<FinanceTrends> {
  const now = new Date();
  const [cur, prev] = await Promise.all([
    computeTenantFinance(tenantId, { from: monthStart(now), to: monthStart(now, 1) }),
    computeTenantFinance(tenantId, { from: monthStart(now, -1), to: monthStart(now) }),
  ]);
  return {
    totalExpense: pctChange(cur.totalExpense, prev.totalExpense),
    materialCost: pctChange(cur.materialCost, prev.materialCost),
    laborCost: pctChange(cur.laborCost, prev.laborCost),
    netProfit: pctChange(cur.netProfit, prev.netProfit),
  };
}
