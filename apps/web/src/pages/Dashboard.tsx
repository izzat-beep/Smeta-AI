import { useEffect, useState } from 'react';
import { Icon } from '@iconify/react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';
import { fmtMoney, fmtDate, fmtRelative, projectStatus } from '../lib/format';
import type { DashboardData } from '@smeta/shared';

const PROGRESS_COLORS = ['bg-[#5555E7]', 'bg-[#3DF2FF]', 'bg-[#1FB21F]', 'bg-[#FF6B1A]'];

export function Dashboard() {
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
          label: 'Umumiy xarajatlar',
          value: fmtMoney(stats.totalExpenses, 'UZS'),
          sub: 'UZS • Oxirgi 30 kun',
          icon: '/assets/dashboard/IMG_17.svg',
          color: 'text-[#F97316]',
          trend: true,
        },
        {
          label: 'Kutilayotgan smetalar',
          value: `${stats.pendingEstimates} ta`,
          sub: `${stats.pendingApproval} ta tasdiqlash jarayonida`,
          icon: '/assets/dashboard/IMG_19.svg',
          color: 'text-[#22D3EE]',
          trend: true,
        },
        {
          label: 'Loyiha unumdorligi',
          value: `${stats.productivity}%`,
          sub: "Joriy davr ko'rsatkichi",
          icon: '/assets/dashboard/IMG_21.svg',
          color: 'text-white',
          trend: true,
        },
        {
          label: "Faol ob'ektlar",
          value: `${stats.activeObjects} ta`,
          sub: `${stats.workersCount} kishi faol`,
          icon: '/assets/dashboard/IMG_20.svg',
          color: 'text-[#5555E7]',
          trend: false,
        },
      ]
    : [];

  return (
    <div className="p-4 md:p-10 space-y-8 max-w-[1200px] mx-auto w-full">
      {/* Welcome Section */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white">
            Xush kelibsiz,{' '}
            <span className="text-[#5555E7] drop-shadow-[0_0_20px_rgba(85,85,231,0.2)]">{firstName}</span> !
          </h1>
          <p className="mt-2 text-[#BCC0C7]">Bugungi qurilish loyihalaringiz holati va yangiliklar.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[240px]">
            <Icon icon="lucide:search" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#BCC0C7]" />
            <input
              type="text"
              placeholder="Loyihalarni qidirish..."
              className="w-full pl-10 pr-4 py-2 bg-[#191B1F]/40 border border-[#343841]/50 rounded-xl outline-none focus:border-[#5555E7]/50 transition-all"
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-[#191B1F]/40 border border-[#343841]/50 rounded-xl text-sm font-medium hover:bg-white/5">
            <img src="/assets/dashboard/IMG_15.svg" className="w-4 h-4" alt="Filter" />
            Filtrlar
          </button>
          <button
            onClick={() => navigate('/app/loyihalar')}
            className="flex items-center gap-2 px-4 py-2 bg-[#FF6B1A] text-white rounded-xl text-sm font-medium shadow-[0_8px_16px_rgba(249,115,22,0.2)] hover:bg-[#e55a10] transition-all"
          >
            <Icon icon="lucide:plus-circle" className="w-4 h-4" />
            Yangi loyiha
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="p-6 bg-[#191B1F]/40 backdrop-blur-xl border border-[#343841]/30 rounded-2xl h-[170px] animate-pulse"
              >
                <div className="w-10 h-10 bg-[#343841]/40 rounded-xl mb-6" />
                <div className="h-3 w-24 bg-[#343841]/40 rounded mb-3" />
                <div className="h-6 w-32 bg-[#343841]/40 rounded" />
              </div>
            ))
          : statCards.map((stat, i) => (
              <div
                key={i}
                className="p-6 bg-[#191B1F]/40 backdrop-blur-xl border border-[#343841]/30 rounded-2xl relative overflow-hidden group"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 blur-3xl rounded-full -mr-10 -mt-10" />
                <div className="flex justify-between items-start mb-6">
                  <div className="w-10 h-10 bg-[#16181D]/50 border border-[#343841]/50 rounded-xl flex items-center justify-center">
                    <img src={stat.icon} className={`w-5 h-5 ${stat.color}`} alt="Icon" />
                  </div>
                  {stat.trend && (
                    <div className="flex items-center gap-1 text-white text-xs font-medium">
                      <Icon icon="lucide:trending-up" className="w-3.5 h-3.5" />
                      +12%
                    </div>
                  )}
                </div>
                <p className="text-sm font-medium text-[#BCC0C7]">{stat.label}</p>
                <h3 className={`text-2xl font-bold font-['Oxanium'] mt-1 ${stat.color}`}>{stat.value}</h3>
                <p className="text-[12px] text-[#BCC0C7]/60 mt-2">{stat.sub}</p>
              </div>
            ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Active Projects */}
        <div className="lg:col-span-8 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src="/assets/dashboard/IMG_3.svg" className="w-5 h-5 text-[#FF6B1A]" alt="Projects" />
              <h2 className="text-xl font-bold font-['Oxanium'] text-white">Faol loyihalar</h2>
            </div>
            <Link to="/app/loyihalar" className="text-sm font-medium text-[#22D3EE] hover:underline">
              Barchasini ko'rish
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {(data?.activeProjects ?? []).map((project, i) => {
              const st = projectStatus(project.status);
              const color = PROGRESS_COLORS[i % PROGRESS_COLORS.length];
              return (
                <div
                  key={project.id}
                  className="bg-[#191B1F]/40 backdrop-blur-xl border border-[#343841]/30 rounded-2xl overflow-hidden flex flex-col"
                >
                  <div className={`h-2 w-full ${color}`} />
                  <div className="p-5 flex-1 flex flex-col">
                    <div className="flex justify-between items-start mb-2 gap-2">
                      <h3 className="text-lg font-bold font-['Oxanium'] text-white leading-tight">
                        {project.title}
                      </h3>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full border shrink-0 ${st.cls}`}>
                        {st.label}
                      </span>
                    </div>
                    <p className="text-xs text-[#BCC0C7] mb-6">{project.clientName}</p>

                    <div className="space-y-2 mb-6">
                      <div className="flex justify-between text-[12px]">
                        <span>Progress</span>
                        <span className="text-white font-medium">{project.progress}%</span>
                      </div>
                      <div className="h-1.5 bg-[#343841] rounded-full overflow-hidden">
                        <div className={`h-full ${color}`} style={{ width: `${project.progress}%` }} />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-[#BCC0C7]/60">Byudjet</p>
                        <p className="text-sm font-semibold text-white truncate">
                          {fmtMoney(project.value, project.currency)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] uppercase tracking-wider text-[#BCC0C7]/60">Muddati</p>
                        <p className="text-sm font-semibold text-white">{fmtDate(project.deadline)}</p>
                      </div>
                    </div>

                    <button
                      onClick={() => navigate('/app/loyihalar')}
                      className="w-full py-2.5 bg-[#343841]/50 border border-[#343841]/50 rounded-xl text-sm font-medium text-white hover:bg-[#343841] transition-colors mt-auto"
                    >
                      Loyiha tafsilotlari
                    </button>
                  </div>
                </div>
              );
            })}

            {/* Add Project Placeholder */}
            <Link
              to="/app/loyihalar"
              className="border-2 border-dashed border-[#343841]/40 rounded-2xl p-6 flex flex-col items-center justify-center gap-3 hover:bg-white/5 transition-all group min-h-[294px]"
            >
              <div className="w-12 h-12 bg-[#343841]/30 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                <Icon icon="lucide:plus" className="w-6 h-6 text-[#BCC0C7]" />
              </div>
              <span className="text-sm font-medium text-[#BCC0C7]">Loyiha qo'shish</span>
            </Link>
          </div>

          {/* Charts & AI Recommendation */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Budget Chart */}
            <div className="bg-[#191B1F]/40 backdrop-blur-xl border border-[#343841]/30 rounded-2xl p-6 overflow-hidden">
              <div className="flex items-center gap-3 mb-8">
                <Icon icon="lucide:trending-up" className="w-4 h-4 text-white" />
                <h3 className="text-sm font-semibold text-white">Byudjet o'zgarishi dinamikasi</h3>
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
                  <div className="w-full h-full flex items-center justify-center text-xs text-[#BCC0C7]/60">
                    Ma'lumot yo'q
                  </div>
                )}
              </div>
              <div className="mt-4 pt-4 border-t border-[#343841]/40 flex justify-between text-[10px] uppercase tracking-widest text-[#BCC0C7]/60">
                <span>Yanvar</span>
                <span>Iyun</span>
                <span>Dekabr</span>
              </div>
            </div>

            {/* AI Recommendation */}
            <div className="bg-[#191B1F]/40 backdrop-blur-xl border border-[#343841]/30 rounded-2xl p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#06B6D4]/10 blur-[80px] -mr-10 -mt-10" />
              <div className="flex items-center gap-3 mb-4">
                <img src="/assets/dashboard/IMG_22.svg" className="w-4 h-4 text-[#22D3EE]" alt="AI" />
                <h3 className="text-sm font-semibold text-white">AI Tavsiyasi</h3>
              </div>
              <p className="text-sm text-[#BCC0C7] leading-relaxed italic mb-8">
                {data?.aiRecommendation ? `"${data.aiRecommendation}"` : 'Tavsiyalar tayyorlanmoqda...'}
              </p>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => navigate('/app/ai')}
                  className="px-4 py-2 bg-[#06B6D4] text-white rounded-xl text-sm font-medium hover:bg-[#05a1bc] transition-all"
                >
                  AI bilan muhokama
                </button>
                <button className="px-4 py-2 text-white rounded-xl text-sm font-medium hover:bg-white/5 transition-all">
                  E'tiborsiz qoldirish
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar Panels */}
        <div className="lg:col-span-4 space-y-6">
          {/* Quick Calculator */}
          <div className="bg-[#191B1F]/40 backdrop-blur-xl border border-[#343841]/30 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-1">
              <img src="/assets/dashboard/IMG_22.svg" className="w-4 h-4 text-[#F97316]" alt="Zap" />
              <h3 className="text-sm font-semibold text-white">Tezkor Kalkulyator</h3>
            </div>
            <p className="text-xs text-[#BCC0C7] mb-6">Material sarfini tezda hisoblang</p>

            <div className="space-y-4">
              <div>
                <label className="block text-[12px] font-medium text-[#BCC0C7] mb-2">Material turi</label>
                <div className="relative">
                  <img
                    src="/assets/dashboard/IMG_19.svg"
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#BCC0C7]"
                    alt="Type"
                  />
                  <input
                    type="text"
                    placeholder="Beton, g'isht, armatura..."
                    className="w-full pl-10 pr-4 py-2.5 bg-[#16181D]/50 border border-[#343841]/50 rounded-xl text-sm outline-none"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[12px] font-medium text-[#BCC0C7] mb-2">O'lcham (m²)</label>
                  <input
                    type="text"
                    placeholder="0.00"
                    className="w-full px-4 py-2.5 bg-[#16181D]/50 border border-[#343841]/50 rounded-xl text-sm outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-medium text-[#BCC0C7] mb-2">Qalinlik (sm)</label>
                  <input
                    type="text"
                    placeholder="0"
                    className="w-full px-4 py-2.5 bg-[#16181D]/50 border border-[#343841]/50 rounded-xl text-sm outline-none"
                  />
                </div>
              </div>
              <button
                onClick={() => navigate('/app/kalkulyator')}
                className="w-full py-3 bg-[#FF6B1A] text-white rounded-xl text-sm font-semibold shadow-[0_0_20px_rgba(255,107,26,0.2)] hover:bg-[#e55a10] transition-all"
              >
                Hisoblash
              </button>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-[#191B1F]/40 backdrop-blur-xl border border-[#343841]/30 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <img src="/assets/dashboard/IMG_23.svg" className="w-4 h-4 text-[#22D3EE]" alt="Clock" />
                <h3 className="text-sm font-semibold text-white">So'nggi faollik</h3>
              </div>
              <button className="text-[12px] text-[#BCC0C7] hover:text-white">Hammasi</button>
            </div>

            {(data?.recentActivity ?? []).length === 0 ? (
              <p className="text-xs text-[#BCC0C7]/60">Hozircha faollik yo'q.</p>
            ) : (
              <div className="space-y-6 relative">
                {/* Vertical Line */}
                <div className="absolute left-[17px] top-4 bottom-4 w-px bg-[#343841]/40" />

                {(data?.recentActivity ?? []).map((activity) => {
                  const name = activity.user?.fullName ?? 'Tizim';
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
                          <span className="text-[#BCC0C7]">{activity.action}</span>
                        </p>
                        <div className="flex items-center gap-2">
                          {activity.projectName && (
                            <span className="text-[10px] px-2 py-0.5 bg-[#5555E7]/5 border border-[#5555E7]/20 rounded-full text-[#5555E7] font-semibold">
                              {activity.projectName}
                            </span>
                          )}
                          <span className="text-[10px] text-[#BCC0C7]/60">{fmtRelative(activity.createdAt)}</span>
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
      <footer className="pt-10 pb-6 border-t border-[#343841]/40 text-center">
        <p className="text-[12px] text-[#BCC0C7]/60">
          © 2026 Smeta AI. Barcha huquqlar himoyalangan. Qurilish hisob-kitoblarining kelajagi.
        </p>
      </footer>
    </div>
  );
}
