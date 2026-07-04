import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Icon } from '@iconify/react';
import { useTranslation } from 'react-i18next';
import type { AdminStats } from '@smeta/shared';
import { api } from '../lib/api';
import { fmtMoney, fmtNumber, planLabel, statusLabel, statusCls } from '../lib/format';

export function Stats() {
  const { t } = useTranslation();
  const [data, setData] = useState<AdminStats | null>(null);

  useEffect(() => {
    api.get<AdminStats>('/stats').then(setData).catch(() => {});
  }, []);

  if (!data) return <Spinner />;

  const cards = [
    { label: t('stats.totalTenants'), value: fmtNumber(data.totalTenants), icon: 'lucide:building-2', color: 'text-[#5555E7]', sub: `${data.activeTenants} ${t('stats.activeSuffix')}` },
    { label: t('stats.mrr'), value: fmtMoney(data.mrr), icon: 'lucide:trending-up', color: 'text-[#FF6B1A]', sub: t('stats.mrrSub') },
    { label: t('stats.users'), value: fmtNumber(data.totalUsers), icon: 'lucide:users', color: 'text-[#22D3EE]', sub: t('stats.usersSub') },
    { label: t('stats.projects'), value: fmtNumber(data.totalProjects), icon: 'lucide:briefcase', color: 'text-[#10B981]', sub: t('stats.projectsSub') },
  ];

  const maxSignup = Math.max(1, ...data.signupsTrend.map((s) => s.count));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-white font-display tracking-tight">{t('stats.title')}</h1>
        <p className="text-[#BCC0C7] mt-1">{t('stats.subtitle')}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c) => (
          <div key={c.label} className="p-6 glass-panel rounded-2xl relative overflow-hidden">
            <div className="w-10 h-10 bg-[#16181D]/50 border border-[#343841]/50 rounded-xl flex items-center justify-center mb-4">
              <Icon icon={c.icon} className={`w-5 h-5 ${c.color}`} />
            </div>
            <p className="text-sm font-medium text-[#BCC0C7]">{c.label}</p>
            <h3 className={`text-2xl font-bold font-display mt-1 ${c.color}`}>{c.value}</h3>
            <p className="text-[12px] text-[#BCC0C7]/60 mt-2">{c.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Signups trend */}
        <div className="lg:col-span-2 glass-panel rounded-2xl p-6">
          <h3 className="text-lg font-bold text-white font-display mb-1">{t('stats.signups')}</h3>
          <p className="text-sm text-[#BCC0C7] mb-8">{t('stats.signupsSub')}</p>
          <div className="h-48 flex items-end justify-between gap-3">
            {data.signupsTrend.map((s, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2">
                <div className="w-full bg-[#5555E7]/20 hover:bg-[#5555E7]/40 rounded-t-lg relative group" style={{ height: `${(s.count / maxSignup) * 100}%`, minHeight: '4px' }}>
                  <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-bold text-white opacity-0 group-hover:opacity-100">{s.count}</span>
                </div>
                <span className="text-[10px] text-[#BCC0C7] uppercase">{s.month}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Plan breakdown */}
        <div className="glass-panel rounded-2xl p-6">
          <h3 className="text-lg font-bold text-white font-display mb-6">{t('stats.byPlan')}</h3>
          <div className="space-y-4">
            {data.planBreakdown.map((p) => {
              const pct = data.totalTenants ? Math.round((p.count / data.totalTenants) * 100) : 0;
              return (
                <div key={p.plan}>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-white font-medium">{planLabel(p.plan)}</span>
                    <span className="text-[#BCC0C7]">{t('stats.unitCount', { count: p.count })}</span>
                  </div>
                  <div className="h-2 bg-[#343841]/40 rounded-full overflow-hidden">
                    <div className="h-full bg-[#5555E7] rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-6 pt-6 border-t border-[#343841]/40 grid grid-cols-3 gap-2 text-center">
            <Mini label={t('stats.active')} value={data.activeTenants} color="text-[#10B981]" />
            <Mini label={t('stats.trial')} value={data.trialTenants} color="text-[#22D3EE]" />
            <Mini label={t('stats.suspended')} value={data.suspendedTenants} color="text-[#F97316]" />
          </div>
        </div>
      </div>

      {/* Recent tenants */}
      <div className="glass-panel rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-[#343841]/40 flex items-center justify-between">
          <h3 className="text-lg font-bold text-white font-display">{t('stats.recentTenants')}</h3>
          <Link to="/mijozlar" className="text-sm text-[#22D3EE] hover:underline">{t('stats.viewAll')}</Link>
        </div>
        <div className="divide-y divide-[#343841]/30">
          {data.recentTenants.map((t) => (
            <Link key={t.id} to={`/mijozlar/${t.id}`} className="flex items-center justify-between px-6 py-4 hover:bg-white/5">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-[#5555E7]/15 flex items-center justify-center text-[#5555E7] font-bold">{t.name.charAt(0)}</div>
                <div>
                  <p className="text-sm font-medium text-white">{t.name}</p>
                  <p className="text-[11px] text-[#BCC0C7]">{planLabel(t.plan)}</p>
                </div>
              </div>
              <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${statusCls[t.status]}`}>{statusLabel(t.status)}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

function Mini({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div>
      <div className={`text-xl font-bold font-display ${color}`}>{value}</div>
      <div className="text-[10px] text-[#BCC0C7] uppercase">{label}</div>
    </div>
  );
}

export function Spinner() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="w-10 h-10 border-2 border-[#5555E7]/30 border-t-[#5555E7] rounded-full animate-spin" />
    </div>
  );
}
