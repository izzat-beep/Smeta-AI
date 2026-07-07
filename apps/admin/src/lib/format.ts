import { PLAN_LABELS, TENANT_STATUS_LABELS, INVOICE_STATUS_LABELS } from '@smeta/shared';
import type { Plan, TenantStatus, InvoiceStatus } from '@smeta/shared';

export function fmtMoney(value: number, currency: 'UZS' | 'USD' = 'UZS'): string {
  if (currency === 'USD') {
    // USD doimo 2 xona kasr (cent) bilan: 100.2 emas → 100.20
    return `${new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value)} USD`;
  }
  return `${new Intl.NumberFormat('uz-UZ', { maximumFractionDigits: 0 }).format(Math.round(value))} UZS`;
}
export function fmtNumber(value: number): string {
  return new Intl.NumberFormat('uz-UZ', { maximumFractionDigits: 0 }).format(Math.round(value));
}
export function fmtDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('uz-UZ', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

// Nisbiy vaqt: "5 daqiqa oldin" (bildirishnomalar uchun)
export function fmtRelative(iso: string | null | undefined): string {
  if (!iso) return '—';
  const diffMs = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diffMs / 60000);
  if (min < 1) return 'hozirgina';
  if (min < 60) return `${min} daqiqa oldin`;
  const hours = Math.floor(min / 60);
  if (hours < 24) return `${hours} soat oldin`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} kun oldin`;
  return fmtDate(iso);
}

export const planLabel = (p: Plan) => PLAN_LABELS[p];
export const statusLabel = (s: TenantStatus) => TENANT_STATUS_LABELS[s];
export const invoiceLabel = (s: InvoiceStatus) => INVOICE_STATUS_LABELS[s];

export const statusCls: Record<TenantStatus, string> = {
  ACTIVE: 'text-[#10B981] bg-[#10B981]/10 border-[#10B981]/20',
  TRIAL: 'text-[#22D3EE] bg-[#22D3EE]/10 border-[#22D3EE]/20',
  SUSPENDED: 'text-[#F97316] bg-[#F97316]/10 border-[#F97316]/20',
  CANCELLED: 'text-[#E11919] bg-[#E11919]/10 border-[#E11919]/20',
};

export const planCls: Record<Plan, string> = {
  BOSHLANGICH: 'text-[#BCC0C7] bg-[#343841]/40 border-[#343841]',
  PROFESSIONAL: 'text-[#5555E7] bg-[#5555E7]/10 border-[#5555E7]/20',
  KORPORATIV: 'text-[#FF6B1A] bg-[#FF6B1A]/10 border-[#FF6B1A]/20',
};
