import { PLAN_LABELS, TENANT_STATUS_LABELS, INVOICE_STATUS_LABELS } from '@smeta/shared';
import type { Plan, TenantStatus, InvoiceStatus } from '@smeta/shared';

export function fmtMoney(value: number, currency: 'UZS' | 'USD' = 'UZS'): string {
  return `${new Intl.NumberFormat('uz-UZ', { maximumFractionDigits: 0 }).format(Math.round(value))} ${currency}`;
}
export function fmtNumber(value: number): string {
  return new Intl.NumberFormat('uz-UZ', { maximumFractionDigits: 0 }).format(Math.round(value));
}
export function fmtDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('uz-UZ', { day: '2-digit', month: '2-digit', year: 'numeric' });
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
