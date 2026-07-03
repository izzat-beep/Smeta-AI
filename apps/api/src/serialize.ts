import { toNum } from './prisma.js';

// Prisma yozuvlarini API DTO'larga (Decimal->number, Date->ISO) o'giradi.
const iso = (d: Date | null | undefined) => (d ? d.toISOString() : null);

export function project(p: any) {
  return {
    id: p.id,
    tenantId: p.tenantId,
    code: p.code,
    title: p.title,
    clientName: p.clientName,
    category: p.category,
    value: toNum(p.value),
    currency: p.currency,
    deadline: iso(p.deadline),
    progress: p.progress,
    status: p.status,
    managerId: p.managerId,
    totalUnits: p.totalUnits ?? 0,
    purchasePrice: toNum(p.purchasePrice),
    manager: p.manager
      ? { id: p.manager.id, fullName: p.manager.fullName, avatarUrl: p.manager.avatarUrl }
      : null,
    createdAt: iso(p.createdAt),
  };
}

export function material(m: any) {
  return {
    id: m.id,
    name: m.name,
    category: m.category,
    provider: m.provider,
    unit: m.unit,
    priceUzs: toNum(m.priceUzs),
    priceUsd: toNum(m.priceUsd),
    stock: toNum(m.stock),
    rating: m.rating,
    imageUrl: m.imageUrl,
    tenantId: m.tenantId,
    createdAt: iso(m.createdAt),
  };
}

export function estimateItem(i: any) {
  return {
    id: i.id,
    estimateId: i.estimateId,
    materialId: i.materialId,
    name: i.name,
    type: i.type,
    paymentType: i.paymentType ?? null,
    qty: toNum(i.qty),
    unit: i.unit,
    unitPrice: toNum(i.unitPrice),
    lineTotal: toNum(i.lineTotal),
  };
}

export function estimateStage(x: any) {
  return {
    id: x.id,
    estimateId: x.estimateId,
    label: x.label,
    date: iso(x.date),
    amount: toNum(x.amount),
    currency: x.currency,
    order: x.order,
  };
}

export function estimate(e: any) {
  return {
    id: e.id,
    tenantId: e.tenantId,
    projectId: e.projectId,
    title: e.title,
    currency: e.currency,
    taxRate: e.taxRate,
    subtotal: toNum(e.subtotal),
    taxAmount: toNum(e.taxAmount),
    total: toNum(e.total),
    status: e.status,
    items: (e.items ?? []).map(estimateItem),
    stages: (e.stages ?? []).map(estimateStage),
    createdAt: iso(e.createdAt),
  };
}

export function activity(a: any) {
  return {
    id: a.id,
    tenantId: a.tenantId,
    userId: a.userId,
    user: a.user
      ? { id: a.user.id, fullName: a.user.fullName, avatarUrl: a.user.avatarUrl }
      : null,
    action: a.action,
    projectName: a.projectName,
    createdAt: iso(a.createdAt),
  };
}

export function user(u: any) {
  return {
    id: u.id,
    tenantId: u.tenantId,
    fullName: u.fullName,
    email: u.email,
    phone: u.phone,
    role: u.role,
    position: u.position,
    avatarUrl: u.avatarUrl,
    language: u.language ?? 'uz',
    createdAt: iso(u.createdAt),
  };
}

export function tenant(t: any) {
  return {
    id: t.id,
    name: t.name,
    inn: t.inn,
    phone: t.phone,
    plan: t.plan,
    status: t.status,
    usdRate: toNum(t.usdRate ?? 12600),
    trialEndsAt: iso(t.trialEndsAt),
    createdAt: iso(t.createdAt),
  };
}

export function invoice(i: any) {
  return {
    id: i.id,
    tenantId: i.tenantId,
    tenant: i.tenant ? { id: i.tenant.id, name: i.tenant.name } : null,
    amount: toNum(i.amount),
    currency: i.currency,
    period: i.period,
    status: i.status,
    issuedAt: iso(i.issuedAt),
    paidAt: iso(i.paidAt),
  };
}

export function payment(p: any) {
  return {
    id: p.id,
    saleId: p.saleId,
    amount: toNum(p.amount),
    currency: p.currency,
    location: p.location ?? null,
    method: p.method ?? null,
    note: p.note ?? null,
    paidAt: iso(p.paidAt),
    createdAt: iso(p.createdAt),
  };
}

export function realtor(r: any) {
  return {
    id: r.id,
    tenantId: r.tenantId,
    name: r.name,
    phone: r.phone ?? null,
    salesCount: r._count?.sales,
    createdAt: iso(r.createdAt),
  };
}

export function sale(x: any) {
  // To'lovlar tarixi (kelgan bo'lsa) — vaqt bo'yicha o'sish tartibida.
  const payments = Array.isArray(x.payments)
    ? [...x.payments].sort((a, b) => +new Date(a.paidAt) - +new Date(b.paidAt)).map(payment)
    : undefined;
  const lastPaymentAt = payments && payments.length ? payments[payments.length - 1].paidAt : null;

  return {
    id: x.id,
    tenantId: x.tenantId,
    projectId: x.projectId ?? null,
    project: x.project ? { id: x.project.id, title: x.project.title, code: x.project.code } : null,
    unitName: x.unitName,
    buyerName: x.buyerName,
    buyerPhone: x.buyerPhone ?? null,
    area: toNum(x.area),
    price: toNum(x.price),
    paid: toNum(x.paid),
    currency: x.currency,
    soldAt: iso(x.soldAt),
    createdAt: iso(x.createdAt),
    realtorId: x.realtorId ?? null,
    commissionAmount: toNum(x.commissionAmount),
    realtor: x.realtor ? realtor(x.realtor) : null,
    ...(payments ? { payments, lastPaymentAt } : {}),
  };
}

export function adminUser(a: any) {
  return {
    id: a.id,
    email: a.email,
    fullName: a.fullName,
    role: a.role,
    createdAt: iso(a.createdAt),
  };
}
