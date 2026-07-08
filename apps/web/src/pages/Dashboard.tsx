import { useEffect, useState } from 'react';
import { Icon } from '@iconify/react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';
import { useCurrency } from '../lib/currency';
import { fmtDate, fmtRelative, projectStatus } from '../lib/format';
import type { DashboardData } from '@smeta/shared';

const PROGRESS_COLORS = ['bg-[#5555E7]', 'bg-[#3DF2FF]', 'bg-[#1FB21F]', 'bg-[#FF6B1A]'];

export function Dashboard() {
  const { t } = useTranslation();
  const { fmt, rate } = useCurrency();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await api.get<DashboardData>('/dashboard');
        if (active) setData(res);
      } catch {
        if (active) setData(null);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const firstName = (user?.fullName ?? 'Foydalanuvchi').split(' ')[0];
  const stats = data?.stats;
  const trend = stats?.budgetTrend ?? [];
  const maxTrend = trend.length ? Math.max(...trend) : 1;

  const statCards = stats
    ? [
        {
          label: t('dashboard.statTotalExpenses'),
          value: fmt(stats.totalExpenses),
          sub: t('dashboard.statTotalExpensesSub'),
          icon: '/assets/dashboard/IMG_17.svg',
          color: 'text-[#F97316]',
        },
        {
          label: t('dashboard.statPendingEstimates'),
          value: t('dashboard.unitCount', { count: stats.pendingEstimates }),
          sub: t('dashboard.statPendingApprovalSub', { count: stats.pendingApproval }),
          icon: '/assets/dashboard/IMG_19.svg',
          color: 'text-[#22D3EE]',
        },
        {
          label: t('dashboard.statProductivity'),
          value: `${stats.productivity}%`,
          sub: t('dashboard.statProductivitySub'),
          icon: '/assets/dashboard/IMG_21.svg',
          color: 'text-white',
        },
        {
          label: t('dashboard.statActiveObjects'),
          value: t('dashboard.unitCount', { count: stats.activeObjects }),
          sub: t('dashboard.statActiveObjectsSub', { count: stats.teamCount }),
          icon: '/assets/dashboard/IMG_20.svg',
          color: 'text-[#5555E7]',
        },
      ]
    : [];

  return (
    <div className="p-4 md:p-10 space-y-8 max-w-[1200px] mx-auto w-full">
      {/* Welcome Section */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white">
            {t('dashboard.welcome')},{' '}
            <span className="text-[#5555E7] drop-shadow-[0_0_20px_rgba(85,85,231,0.2)]">{firstName}</span> !
          </h1>
          <p className="mt-2 text-[var(--c-muted)]">{t('dashboard.subtitle')}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[240px]">
            <Icon icon="lucide:search" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--c-muted)]" />
            <input
              type="text"
              placeholder={t('dashboard.searchProjects')}
              className="w-full pl-10 pr-4 py-2 bg-[var(--c-panel)]/40 border border-[var(--c-border)]/50 rounded-xl outline-none focus:border-[#5555E7]/50 transition-all"
            />
          </div>
          <button
            onClick={() => navigate('/app/loyihalar')}
            className="flex items-center gap-2 px-4 py-2 bg-[#FF6B1A] text-white rounded-xl text-sm font-medium shadow-[0_8px_16px_rgba(249,115,22,0.2)] hover:bg-[#e55a10] transition-all"
          >
            <Icon icon="lucide:plus-circle" className="w-4 h-4" />
            {t('dashboard.newProject')}
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="p-6 bg-[var(--c-panel)]/40 backdrop-blur-xl border border-[var(--c-border)]/30 rounded-2xl h-[170px] animate-pulse"
              >
                <div className="w-10 h-10 bg-[var(--c-border)]/40 rounded-xl mb-6" />
                <div className="h-3 w-24 bg-[var(--c-border)]/40 rounded mb-3" />
                <div className="h-6 w-32 bg-[var(--c-border)]/40 rounded" />
              </div>
            ))
          : statCards.map((stat, i) => (
              <div
                key={i}
                className="p-6 bg-[var(--c-panel)]/40 backdrop-blur-xl border border-[var(--c-border)]/30 rounded-2xl relative overflow-hidden group"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 blur-3xl rounded-full -mr-10 -mt-10" />
                <div className="flex justify-between items-start mb-6">
                  <div className="w-10 h-10 bg-[var(--c-bg)]/50 border border-[var(--c-border)]/50 rounded-xl flex items-center justify-center">
                    <img src={stat.icon} className={`w-5 h-5 ${stat.color}`} alt="" />
                  </div>
                </div>
                <p className="text-sm font-medium text-[var(--c-muted)]">{stat.label}</p>
                <h3 className={`text-2xl font-bold font-['Oxanium'] mt-1 ${stat.color}`}>{stat.value}</h3>
                <p className="text-[12px] text-[var(--c-muted)]/60 mt-2">{stat.sub}</p>
              </div>
            ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Active Projects */}
        <div className="lg:col-span-8 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src="/assets/dashboard/IMG_3.svg" className="w-5 h-5 text-[#FF6B1A]" alt="" />
              <h2 className="text-xl font-bold font-['Oxanium'] text-white">{t('dashboard.activeProjects')}</h2>
            </div>
            <Link to="/app/loyihalar" className="text-sm font-medium text-[#22D3EE] hover:underline">
              {t('dashboard.viewAll')}
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {(data?.activeProjects ?? []).map((project, i) => {
              const st = projectStatus(project.status);
              const color = PROGRESS_COLORS[i % PROGRESS_COLORS.length];
              return (
                <div
                  key={project.id}
                  className="bg-[var(--c-panel)]/40 backdrop-blur-xl border border-[var(--c-border)]/30 rounded-2xl overflow-hidden flex flex-col"
                >
                  <div className={`h-2 w-full ${color}`} />
                  <div className="p-5 flex-1 flex flex-col">
                    <div className="flex justify-between items-start mb-2 gap-2">
                      <h3 className="text-lg font-bold font-['Oxanium'] text-white leading-tight">
                        {project.title}
                      </h3>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full border shrink-0 ${st.cls}`}>
                        {t(`projects.statuses.${project.status}`)}
                      </span>
                    </div>
                    <p className="text-xs text-[var(--c-muted)] mb-6">{project.clientName}</p>

                    <div className="space-y-2 mb-6">
                      <div className="flex justify-between text-[12px]">
                        <span>{t('dashboard.progress')}</span>
                        <span className="text-white font-medium">{project.progress}%</span>
                      </div>
                      <div className="h-1.5 bg-[var(--c-border)] rounded-full overflow-hidden">
                        <div className={`h-full ${color}`} style={{ width: `${project.progress}%` }} />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-[var(--c-muted)]/60">{t('dashboard.budget')}</p>
                        <p className="text-sm font-semibold text-white truncate">
                          {fmt(project.currency === 'USD' ? project.value * rate : project.value)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] uppercase tracking-wider text-[var(--c-muted)]/60">{t('dashboard.deadline')}</p>
                        <p className="text-sm font-semibold text-white">{fmtDate(project.deadline)}</p>
                      </div>
                    </div>

                    <button
                      onClick={() => navigate('/app/loyihalar')}
                      className="w-full py-2.5 bg-[var(--c-border)]/50 border border-[var(--c-border)]/50 rounded-xl text-sm font-medium text-white hover:bg-[var(--c-border)] transition-colors mt-auto"
                    >
                      {t('dashboard.projectDetails')}
                    </button>
                  </div>
                </div>
              );
            })}

            {/* Add Project Placeholder */}
            <Link
              to="/app/loyihalar"
              className="border-2 border-dashed border-[var(--c-border)]/40 rounded-2xl p-6 flex flex-col items-center justify-center gap-3 hover:bg-white/5 transition-all group min-h-[294px]"
            >
              <div className="w-12 h-12 bg-[var(--c-border)]/30 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                <Icon icon="lucide:plus" className="w-6 h-6 text-[var(--c-muted)]" />
              </div>
              <span className="text-sm font-medium text-[var(--c-muted)]">{t('dashboard.addProject')}</span>
            </Link>
          </div>

          {/* Charts & AI Recommendation */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Budget Chart */}
            <div className="bg-[var(--c-panel)]/40 backdrop-blur-xl border border-[var(--c-border)]/30 rounded-2xl p-6 overflow-hidden">
              <div className="flex items-center gap-3 mb-8">
                <Icon icon="lucide:trending-up" className="w-4 h-4 text-white" />
                <h3 className="text-sm font-semibold text-white">{t('dashboard.budgetDynamics')}</h3>
              </div>
              <div className="h-40 flex items-end justify-between gap-2 px-2">
                {trend.length ? (
                  trend.map((h, i) => (
                    <div
                      key={i}
                      className="flex-1 bg-[#5555E7]/20 rounded-t-md hover:bg-[#5555E7]/40 transition-colors"
                      style={{ height: `${(h / maxTrend) * 100}%` }}
                    />
                  ))
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xs text-[var(--c-muted)]/60">
                    {t('common.noData')}
                  </div>
                )}
              </div>
              <div className="mt-4 pt-4 border-t border-[var(--c-border)]/40 flex justify-between text-[10px] uppercase tracking-widest text-[var(--c-muted)]/60">
                <span>{t('dashboard.months.jan')}</span>
                <span>{t('dashboard.months.jun')}</span>
                <span>{t('dashboard.months.dec')}</span>
              </div>
            </div>

            {/* AI Recommendation */}
            <div className="bg-[var(--c-panel)]/40 backdrop-blur-xl border border-[var(--c-border)]/30 rounded-2xl p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#06B6D4]/10 blur-[80px] -mr-10 -mt-10" />
              <div className="flex items-center gap-3 mb-4">
                <img src="/assets/dashboard/IMG_22.svg" className="w-4 h-4 text-[#22D3EE]" alt="" />
                <h3 className="text-sm font-semibold text-white">{t('dashboard.aiRecommendation')}</h3>
              </div>
              <p className="text-sm text-[var(--c-muted)] leading-relaxed italic mb-8">
                {data?.aiRecommendation ? `"${data.aiRecommendation}"` : t('dashboard.aiPreparing')}
              </p>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => navigate('/app/ai')}
                  className="px-4 py-2 bg-[#06B6D4] text-white rounded-xl text-sm font-medium hover:bg-[#05a1bc] transition-all"
                >
                  {t('dashboard.aiDiscuss')}
                </button>
                <button className="px-4 py-2 text-white rounded-xl text-sm font-medium hover:bg-white/5 transition-all">
                  {t('dashboard.dismiss')}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar Panels */}
        <div className="lg:col-span-4 space-y-6">
          {/* Quick Calculator */}
          <div className="bg-[var(--c-panel)]/40 backdrop-blur-xl border border-[var(--c-border)]/30 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-1">
              <img src="/assets/dashboard/IMG_22.svg" className="w-4 h-4 text-[#F97316]" alt="" />
              <h3 className="text-sm font-semibold text-white">{t('dashboard.quickCalc')}</h3>
            </div>
            <p className="text-xs text-[var(--c-muted)] mb-6">{t('dashboard.quickCalcSub')}</p>

            <div className="space-y-4">
              <div>
                <label className="block text-[12px] font-medium text-[var(--c-muted)] mb-2">{t('dashboard.materialType')}</label>
                <div className="relative">
                  <img
                    src="/assets/dashboard/IMG_19.svg"
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--c-muted)]"
                    alt=""
                  />
                  <input
                    type="text"
                    placeholder={t('dashboard.materialTypePh')}
                    className="w-full pl-10 pr-4 py-2.5 bg-[var(--c-bg)]/50 border border-[var(--c-border)]/50 rounded-xl text-sm outline-none"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[12px] font-medium text-[var(--c-muted)] mb-2">{t('dashboard.size')}</label>
                  <input
                    type="text"
                    placeholder="0.00"
                    className="w-full px-4 py-2.5 bg-[var(--c-bg)]/50 border border-[var(--c-border)]/50 rounded-xl text-sm outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-medium text-[var(--c-muted)] mb-2">{t('dashboard.thickness')}</label>
                  <input
                    type="text"
                    placeholder="0"
                    className="w-full px-4 py-2.5 bg-[var(--c-bg)]/50 border border-[var(--c-border)]/50 rounded-xl text-sm outline-none"
                  />
                </div>
              </div>
              <button
                onClick={() => navigate('/app/kalkulyator')}
                className="w-full py-3 bg-[#FF6B1A] text-white rounded-xl text-sm font-semibold shadow-[0_0_20px_rgba(255,107,26,0.2)] hover:bg-[#e55a10] transition-all"
              >
                {t('dashboard.calculate')}
              </button>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-[var(--c-panel)]/40 backdrop-blur-xl border border-[var(--c-border)]/30 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <img src="/assets/dashboard/IMG_23.svg" className="w-4 h-4 text-[#22D3EE]" alt="" />
                <h3 className="text-sm font-semibold text-white">{t('dashboard.recentActivity')}</h3>
              </div>
              <button className="text-[12px] text-[var(--c-muted)] hover:text-white">{t('common.all')}</button>
            </div>

            {(data?.recentActivity ?? []).length === 0 ? (
              <p className="text-xs text-[var(--c-muted)]/60">{t('dashboard.noActivity')}</p>
            ) : (
              <div className="space-y-6 relative">
                {/* Vertical Line */}
                <div className="absolute left-[17px] top-4 bottom-4 w-px bg-[var(--c-border)]/40" />

                {(data?.recentActivity ?? []).map((activity) => {
                  const name = activity.user?.fullName ?? t('dashboard.system');
                  return (
                    <div key={activity.id} className="flex gap-4 relative z-10">
                      <div className="w-9 h-9 rounded-full overflow-hidden border border-white/10 shrink-0 shadow-lg bg-[#5555E7]/20 flex items-center justify-center text-[#5555E7] font-bold">
                        {activity.user?.avatarUrl ? (
                          <img src={activity.user.avatarUrl} className="w-full h-full object-cover" alt={name} />
                        ) : (
                          name.charAt(0)
                        )}
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm leading-tight">
                          <span className="font-semibold text-white">{name}</span>{' '}
                          <span className="text-[var(--c-muted)]">{activity.action}</span>
                        </p>
                        <div className="flex items-center gap-2">
                          {activity.projectName && (
                            <span className="text-[10px] px-2 py-0.5 bg-[#5555E7]/5 border border-[#5555E7]/20 rounded-full text-[#5555E7] font-semibold">
                              {activity.projectName}
                            </span>
                          )}
                          <span className="text-[10px] text-[var(--c-muted)]/60">{fmtRelative(activity.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="pt-10 pb-6 border-t border-[var(--c-border)]/40 text-center">
        <p className="text-[12px] text-[var(--c-muted)]/60">{t('dashboard.footer')}</p>
      </footer>
    </div>
  );
}
