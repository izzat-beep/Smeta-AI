import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Icon } from '@iconify/react';
import { useTranslation } from 'react-i18next';
import type { Tenant } from '@smeta/shared';
import { api } from '../lib/api';
import { fmtDate, planLabel, statusLabel, statusCls, planCls } from '../lib/format';
import { Spinner } from './Stats';

type Row = Tenant & { userCount: number; projectCount: number };

const STATUS_TABS = ['ALL', 'ACTIVE', 'TRIAL', 'SUSPENDED', 'CANCELLED'] as const;

export function Tenants() {
  const { t: tr } = useTranslation();
  const [rows, setRows] = useState<Row[] | null>(null);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState<string>('ALL');

  async function load() {
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (status !== 'ALL') params.set('status', status);
    const data = await api.get<Row[]>(`/tenants?${params.toString()}`);
    setRows(data);
  }

  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, status]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white font-display tracking-tight">{tr('tenants.title')}</h1>
          <p className="text-[#BCC0C7] mt-1">{tr('tenants.subtitle')}</p>
        </div>
      </div>

      <div className="glass-panel rounded-2xl p-4 flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Icon icon="lucide:search" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#BCC0C7]" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={tr('tenants.search')}
            className="w-full bg-[#16181D]/50 border border-[#343841]/40 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-[#5555E7]/50"
          />
        </div>
        <div className="flex gap-1 bg-[#16181D]/40 border border-[#343841]/40 rounded-xl p-1 overflow-x-auto">
          {STATUS_TABS.map((s) => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap ${status === s ? 'bg-[#5555E7] text-white' : 'text-[#BCC0C7] hover:text-white'}`}
            >
              {s === 'ALL' ? tr('tenants.all') : statusLabel(s as any)}
            </button>
          ))}
        </div>
      </div>

      {!rows ? (
        <Spinner />
      ) : (
        <div className="glass-panel rounded-2xl overflow-hidden">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-[#16181D]/30 border-b border-[#343841]/40">
                  {[tr('tenants.name'), tr('tenants.plan'), tr('tenants.status'), tr('tenants.users'), tr('tenants.projects'), tr('tenants.created'), ''].map((h) => (
                    <th key={h} className="px-5 py-4 text-[10px] font-bold uppercase tracking-widest text-[#BCC0C7]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#343841]/30">
                {rows.map((t) => (
                  <tr key={t.id} className="hover:bg-white/5">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-[#5555E7]/15 flex items-center justify-center text-[#5555E7] font-bold">{t.name.charAt(0)}</div>
                        <div>
                          <p className="text-sm font-medium text-white">{t.name}</p>
                          <p className="text-[11px] text-[#BCC0C7]">{t.inn ? `${tr('tenants.inn')}: ${t.inn}` : '—'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4"><span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${planCls[t.plan]}`}>{planLabel(t.plan)}</span></td>
                    <td className="px-5 py-4"><span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${statusCls[t.status]}`}>{statusLabel(t.status)}</span></td>
                    <td className="px-5 py-4 text-sm text-white">{t.userCount}</td>
                    <td className="px-5 py-4 text-sm text-white">{t.projectCount}</td>
                    <td className="px-5 py-4 text-sm text-[#BCC0C7]">{fmtDate(t.createdAt)}</td>
                    <td className="px-5 py-4 text-right">
                      <Link to={`/mijozlar/${t.id}`} className="text-[#22D3EE] hover:underline text-sm font-medium">{tr('tenants.detailTitle')}</Link>
                    </td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr><td colSpan={7} className="px-5 py-10 text-center text-[#BCC0C7]">{tr('tenants.noTenants')}</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
