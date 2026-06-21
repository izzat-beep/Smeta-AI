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
    qty: toNum(i.qty),
    unit: i.unit,
    unitPrice: toNum(i.unitPrice),
    lineTotal: toNum(i.lineTotal),
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

export function sale(x: any) {
  return {
    id: x.id,
    tenantId: x.tenantId,
    unitName: x.unitName,
    buyerName: x.buyerName,
    area: toNum(x.area),
    price: toNum(x.price),
    paid: toNum(x.paid),
    currency: x.currency,
    soldAt: iso(x.soldAt),
    createdAt: iso(x.createdAt),
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
