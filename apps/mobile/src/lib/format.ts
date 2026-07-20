// Pul va sana formatlash — Hermes Intl locale cheklovlaridan qochib, qo'lda
// (minglik ajratgich probel). Web apps/web/src/lib/format.ts bilan mos ko'rinish.
import type { Currency } from '@smeta/shared';

function groupThousands(intPart: string, sep: string): string {
  return intPart.replace(/\B(?=(\d{3})+(?!\d))/g, sep);
}

export function formatMoney(amount: number, currency: Currency = 'UZS'): string {
  const safe = Number.isFinite(amount) ? amount : 0;
  if (currency === 'USD') {
    const fixed = Math.abs(safe).toFixed(2);
    const [int, dec] = fixed.split('.');
    const sign = safe < 0 ? '-' : '';
    return `${sign}$${groupThousands(int ?? '0', ',')}.${dec ?? '00'}`;
  }
  const rounded = Math.round(safe);
  const sign = rounded < 0 ? '-' : '';
  return `${sign}${groupThousands(String(Math.abs(rounded)), ' ')} so'm`;
}

// Qisqa (kompakt) pul — dashboard kartalari uchun (1.2 mln / 3.4 mlrd).
export function formatMoneyShort(amount: number, currency: Currency = 'UZS'): string {
  const safe = Number.isFinite(amount) ? amount : 0;
  const abs = Math.abs(safe);
  const sign = safe < 0 ? '-' : '';
  const suffix = currency === 'USD' ? '$' : '';
  const unit = currency === 'USD' ? '' : " so'm";
  if (abs >= 1_000_000_000) return `${sign}${suffix}${(abs / 1_000_000_000).toFixed(1)} mlrd${unit}`;
  if (abs >= 1_000_000) return `${sign}${suffix}${(abs / 1_000_000).toFixed(1)} mln${unit}`;
  return formatMoney(safe, currency);
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${dd}.${mm}.${d.getFullYear()}`;
}
