import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Icon } from '@iconify/react';
import { useTranslation } from 'react-i18next';
import type { Plan, TenantStatus } from '@smeta/shared';
import { api } from '../lib/api';
import { fmtDate, fmtMoney, planLabel, statusLabel, statusCls, planCls, invoiceLabel } from '../lib/format';
import { Spinner } from './Stats';

const PLANS: Plan[] = ['BOSHLANGICH', 'PROFESSIONAL', 'KORPORATIV'];
const STATUSES: TenantStatus[] = ['TRIAL', 'ACTIVE', 'SUSPENDED', 'CANCELLED'];

export function TenantDetail() {
  const { t: tr } = useTranslation();
  const { id } = useParams();
  const [t, setT] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function load() {
    setT(await api.get(`/tenants/${id}`));
  }
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [id]);

  async function update(patch: { plan?: Plan; status?: TenantStatus }) {
    setSaving(true);
    setMsg(null);
    try {
      await api.patch(`/tenants/${id}`, patch);
      await load();
      setMsg(tr('common.saved'));
      setTimeout(() => setMsg(null), 2000);
    } finally {
      setSaving(false);
    }
  }

  if (!t) return <Spinner />;

  return (
    <div className="space-y-6">
      <Link to="/mijozlar" className="inline-flex items-center gap-2 text-sm text-[#BCC0C7] hover:text-white">
        <Icon icon="lucide:arrow-left" className="w-4 h-4" /> {tr('tenants.back')}
      </Link>

      <div className="glass-panel rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-[#5555E7]/15 flex items-center justify-center text-[#5555E7] text-2xl font-bold">{t.name.charAt(0)}</div>
          <div>
            <h1 className="text-2xl font-bold text-white font-display">{t.name}</h1>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${planCls[t.plan as Plan]}`}>{planLabel(t.plan)}</span>
              <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${statusCls[t.status as TenantStatus]}`}>{statusLabel(t.status)}</span>
              {t.inn && <span className="text-[11px] text-[#BCC0C7]">{tr('tenants.inn')}: {t.inn}</span>}
            </div>
          </div>
        </div>
        {msg && <span className="text-[#10B981] text-sm font-medium">{msg}</span>}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat label={tr('tenants.users')} value={t.counts.users} icon="lucide:users" />
        <Stat label={tr('tenants.projects')} value={t.counts.projects} icon="lucide:briefcase" />
        <Stat label={tr('tenants.estimates')} value={t.counts.estimates} icon="lucide:file-text" />
        <Stat label={tr('tenants.created')} value={fmtDate(t.createdAt)} icon="lucide:calendar" small />
      </div>

      {/* Boshqaruv */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-panel rounded-2xl p-6">
          <h3 className="text-lg font-bold text-white font-display mb-4">{tr('tenants.plan')}</h3>
          <div className="grid grid-cols-3 gap-2">
            {PLANS.map((p) => (
              <button
                key={p}
                disabled={saving}
                onClick={() => update({ plan: p })}
                className={`py-3 rounded-xl text-sm font-medium border-2 transition-all ${t.plan === p ? 'bg-[#5555E7] border-[#5555E7] text-white' : 'bg-[#16181D]/40 border-[#343841]/40 text-[#BCC0C7] hover:border-[#5555E7]/40'}`}
              >
                {planLabel(p)}
              </button>
            ))}
          </div>
        </div>
        <div className="glass-panel rounded-2xl p-6">
          <h3 className="text-lg font-bold text-white font-display mb-4">{tr('tenants.status')}</h3>
          <div className="grid grid-cols-2 gap-2">
            {STATUSES.map((st) => (
              <button
                key={st}
                disabled={saving}
                onClick={() => update({ status: st })}
                className={`py-3 rounded-xl text-sm font-medium border-2 transition-all ${t.status === st ? 'bg-[#16181D] border-[#5555E7] text-white' : 'bg-[#16181D]/40 border-[#343841]/40 text-[#BCC0C7] hover:border-[#343841]'}`}
              >
                {statusLabel(st)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Foydalanuvchilar */}
      <div className="glass-panel rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-[#343841]/40"><h3 className="text-lg font-bold text-white font-display">{tr('tenants.usersList')}</h3></div>
        <div className="divide-y divide-[#343841]/30">
          {t.users.map((u: any) => (
            <div key={u.id} className="flex items-center justify-between px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-[#06B6D4]/15 flex items-center justify-center text-[#22D3EE] font-bold">{u.fullName.charAt(0)}</div>
                <div>
                  <p className="text-sm font-medium text-white">{u.fullName}</p>
                  <p className="text-[11px] text-[#BCC0C7]">{u.email}</p>
                </div>
              </div>
              <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-[#343841]/40 text-[#BCC0C7]">{u.role}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Hisob-fakturalar */}
      {t.invoices.length > 0 && (
        <div className="glass-panel rounded-2xl overflow-hidden">
          <div className="p-6 border-b border-[#343841]/40"><h3 className="text-lg font-bold text-white font-display">{tr('invoices.title')}</h3></div>
          <div className="divide-y divide-[#343841]/30">
            {t.invoices.map((inv: any) => (
              <div key={inv.id} className="flex items-center justify-between px-6 py-4">
                <div>
                  <p className="text-sm font-medium text-white">{inv.period}</p>
                  <p className="text-[11px] text-[#BCC0C7]">{fmtMoney(inv.amount, inv.currency)}</p>
                </div>
                <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-[#343841]/40 text-[#BCC0C7]">{invoiceLabel(inv.status)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, icon, small }: { label: string; value: number | string; icon: string; small?: boolean }) {
  return (
    <div className="glass-panel rounded-2xl p-5">
      <Icon icon={icon} className="w-5 h-5 text-[#5555E7] mb-3" />
      <p className="text-[12px] text-[#BCC0C7]">{label}</p>
      <p className={`font-bold font-display text-white mt-1 ${small ? 'text-base' : 'text-2xl'}`}>{value}</p>
    </div>
  );
}
