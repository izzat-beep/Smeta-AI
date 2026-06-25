// Pul va sana formatlash yordamchilari

export function fmtMoney(value: number, currency: 'UZS' | 'USD' = 'UZS'): string {
  if (currency === 'USD') {
    // USD doimo 2 xona kasr (cent) bilan ko'rsatiladi: 100.2 emas → 100.20.
    // Avval Math.round + maximumFractionDigits:0 ishlatilgani sabab cent yo'qolardi.
    const n = new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
    return `${n} USD`;
  }
  // UZS — so'mda cent yo'q, butun songa yaxlitlanadi.
  const n = new Intl.NumberFormat('uz-UZ', { maximumFractionDigits: 0 }).format(Math.round(value));
  return `${n} UZS`;
}

export function fmtNumber(value: number): string {
  return new Intl.NumberFormat('uz-UZ', { maximumFractionDigits: 0 }).format(Math.round(value));
}

export function fmtDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('uz-UZ', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export function fmtRelative(iso: string | null | undefined): string {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'hozir';
  if (mins < 60) return `${mins} daqiqa avval`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} soat avval`;
  const days = Math.floor(hours / 24);
  return `${days} kun avval`;
}

const STATUS: Record<string, { label: string; cls: string }> = {
  PLANNED: { label: 'Rejalashtirilgan', cls: 'text-[#F97316] bg-[#F97316]/10 border-[#F97316]/20' },
  IN_PROGRESS: { label: 'Jarayonda', cls: 'text-[#06B6D4] bg-[#06B6D4]/10 border-[#06B6D4]/20' },
  COMPLETED: { label: 'Yakunlangan', cls: 'text-[#10B981] bg-[#10B981]/10 border-[#10B981]/20' },
  ARCHIVED: { label: 'Arxivlangan', cls: 'text-[#BCC0C7] bg-[#343841]/40 border-[#343841]' },
};
export function projectStatus(status: string) {
  return STATUS[status] ?? STATUS.PLANNED;
}
