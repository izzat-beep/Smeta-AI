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

export interface TenantFinance {
  materialCost: number; // smeta MATERIAL pozitsiyalari + buyurtmadan avto xarajatlar (UZS)
  laborCost: number; // smeta LABOR pozitsiyalari
  equipmentCost: number; // smeta EQUIPMENT pozitsiyalari
  taxAmount: number; // smeta soliqlari
  estimatesTotal: number; // Σ smeta.total (kalkulyator "Yakuniy summa")
  orderExpenses: number; // buyurtmadan avtomatik yozilgan umumiy harajatlar (V5)
  manualExpenses: number; // qo'lda kiritilgan umumiy harajatlar
  generalExpensesTotal: number; // orderExpenses + manualExpenses
  totalExpense: number; // estimatesTotal + generalExpensesTotal
  incoming: number; // sotuvlardan kelgan pullar (UZS'ga normallashtirilgan)
  netProfit: number; // incoming - totalExpense
  estimatesCount: number;
  pendingEstimates: number; // PENDING statusdagi smetalar
}

interface Range {
  from?: Date;
  to?: Date; // exclusive
}

function createdAtFilter(range?: Range) {
  if (!range?.from && !range?.to) return undefined;
  return { ...(range.from ? { gte: range.from } : {}), ...(range.to ? { lt: range.to } : {}) };
}

// Tenant kursi: USD summalarni UZS'ga o'girish uchun.
export async function tenantRate(tenantId: string): Promise<number> {
  const t = await prisma.tenant.findUnique({ where: { id: tenantId }, select: { usdRate: true } });
  return toNum(t?.usdRate ?? 12600) || 12600;
}

export async function computeTenantFinance(tenantId: string, range?: Range): Promise<TenantFinance> {
  const createdAt = createdAtFilter(range);
  const [rate, estimates, expenses, sales] = await Promise.all([
    tenantRate(tenantId),
    prisma.estimate.findMany({
      where: { tenantId, ...(createdAt ? { createdAt } : {}) },
      include: { items: true },
    }),
    prisma.generalExpenses.findMany({
      where: { tenantId, ...(createdAt ? { createdAt } : {}) },
      select: { amount: true, currency: true, orderId: true },
    }),
    prisma.sale.findMany({
      where: { tenantId, ...(createdAt ? { createdAt } : {}) },
      select: { paid: true, currency: true },
    }),
  ]);
  const toUzs = (amount: number, currency: string) => (currency === 'USD' ? amount * rate : amount);

  let materialCost = 0;
  let laborCost = 0;
  let equipmentCost = 0;
  let taxAmount = 0;
  let estimatesTotal = 0;
  for (const e of estimates) {
    // Smeta bazaviy UZS'da saqlanadi (kalkulyator hamma narsani UZS'ga o'girib yozadi)
    estimatesTotal += toNum(e.total);
    taxAmount += toNum(e.taxAmount);
    for (const i of e.items) {
      const line = toNum(i.lineTotal);
      if (i.type === 'LABOR') laborCost += line;
      else if (i.type === 'EQUIPMENT') equipmentCost += line;
      else materialCost += line;
    }
  }

  let orderExpenses = 0;
  let manualExpenses = 0;
  for (const x of expenses) {
    const v = toUzs(x.amount, x.currency);
    if (x.orderId) orderExpenses += v;
    else manualExpenses += v;
  }
  const generalExpensesTotal = orderExpenses + manualExpenses;

  const incoming = sales.reduce((sum, s) => sum + toUzs(toNum(s.paid), s.currency), 0);
  const totalExpense = estimatesTotal + generalExpensesTotal;

  const pendingEstimates = estimates.filter((e) => e.status === 'PENDING').length;

  return {
    // Buyurtmadan sotib olingan materiallar ham material xarajati hisoblanadi
    materialCost: materialCost + orderExpenses,
    laborCost,
    equipmentCost,
    taxAmount,
    estimatesTotal,
    orderExpenses,
    manualExpenses,
    generalExpensesTotal,
    totalExpense,
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
export async function monthlyExpenseSeries(tenantId: string, months: number): Promise<MonthPoint[]> {
  const now = new Date();
  const from = monthStart(now, -(months - 1));
  const toEx = monthStart(now, 1);
  const [rate, estimates, expenses, stages] = await Promise.all([
    tenantRate(tenantId),
    prisma.estimate.findMany({
      where: { tenantId, createdAt: { gte: from, lt: toEx } },
      select: { total: true, createdAt: true },
    }),
    prisma.generalExpenses.findMany({
      where: { tenantId, createdAt: { gte: from, lt: toEx } },
      select: { amount: true, currency: true, createdAt: true },
    }),
    prisma.estimateStage.findMany({
      where: { estimate: { tenantId }, date: { gte: from, lt: toEx } },
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
export async function resourceUsage(tenantId: string): Promise<{ label: string; percentage: number }[]> {
  const items = await prisma.estimateItem.findMany({
    where: { estimate: { tenantId } },
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
