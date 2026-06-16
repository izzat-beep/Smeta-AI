import { useEffect, useState } from 'react';
import { Icon } from '@iconify/react';
import type { Invoice } from '@smeta/shared';
import { api } from '../lib/api';
import { fmtMoney, fmtDate, invoiceLabel } from '../lib/format';
import { Spinner } from './Stats';

const STATUS_CLS: Record<string, string> = {
  PAID: 'text-[#10B981] bg-[#10B981]/10 border-[#10B981]/20',
  PENDING: 'text-[#22D3EE] bg-[#22D3EE]/10 border-[#22D3EE]/20',
  OVERDUE: 'text-[#E11919] bg-[#E11919]/10 border-[#E11919]/20',
  CANCELLED: 'text-[#BCC0C7] bg-[#343841]/40 border-[#343841]',
};

export function Invoices() {
  const [data, setData] = useState<{ invoices: Invoice[]; totalPaid: number } | null>(null);

  useEffect(() => {
    api.get<{ invoices: Invoice[]; totalPaid: number }>('/invoices').then(setData).catch(() => {});
  }, []);

  if (!data) return <Spinner />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white font-display tracking-tight">Hisob-fakturalar</h1>
          <p className="text-[#BCC0C7] mt-1">Barcha to'lovlar va obuna hisob-kitoblari.</p>
        </div>
        <div className="glass-panel rounded-2xl px-6 py-4">
          <p className="text-[10px] uppercase tracking-widest text-[#BCC0C7]">Jami to'langan</p>
          <p className="text-2xl font-bold font-display text-[#10B981]">{fmtMoney(data.totalPaid)}</p>
        </div>
      </div>

      <div className="glass-panel rounded-2xl overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-[#16181D]/30 border-b border-[#343841]/40">
                {['Mijoz', 'Davr', 'Summa', 'Holat', 'Sana'].map((h) => (
                  <th key={h} className="px-5 py-4 text-[10px] font-bold uppercase tracking-widest text-[#BCC0C7]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#343841]/30">
              {data.invoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-white/5">
                  <td className="px-5 py-4 text-sm font-medium text-white">{inv.tenant?.name ?? '—'}</td>
                  <td className="px-5 py-4 text-sm text-[#BCC0C7]">{inv.period}</td>
                  <td className="px-5 py-4 text-sm font-semibold text-white">{fmtMoney(inv.amount, inv.currency)}</td>
                  <td className="px-5 py-4"><span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${STATUS_CLS[inv.status]}`}>{invoiceLabel(inv.status)}</span></td>
                  <td className="px-5 py-4 text-sm text-[#BCC0C7]">{fmtDate(inv.issuedAt)}</td>
                </tr>
              ))}
              {data.invoices.length === 0 && (
                <tr><td colSpan={5} className="px-5 py-10 text-center text-[#BCC0C7]"><Icon icon="lucide:receipt" className="w-8 h-8 mx-auto mb-2 opacity-40" />Hisob-fakturalar yo'q</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
