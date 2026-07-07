import { useEffect, useState } from 'react';
import { Icon } from '@iconify/react';
import { useTranslation } from 'react-i18next';
import { api, ApiError } from '../lib/api';
import { useCurrency } from '../lib/currency';
import type { ReportSummary } from '@smeta/shared';

export function Reports() {
  const { t, i18n } = useTranslation();
  const { fmt } = useCurrency();
  const [data, setData] = useState<ReportSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // '2026-07' -> lokalga mos qisqa oy nomi ("iyul" / "июль")
  const monthLabel = (ym: string) => {
    const [y, m] = ym.split('-').map(Number);
    return new Date(y, m - 1, 1).toLocaleDateString(i18n.language === 'ru' ? 'ru-RU' : 'uz-UZ', { month: 'short' });
  };

  useEffect(() => {
    let alive = true;
    setLoading(true);
    api
      .get<ReportSummary>('/reports')
      .then((res) => {
        if (alive) setData(res);
      })
      .catch((err) => {
        if (alive) setError(err instanceof ApiError ? err.message : t('reports.noData'));
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  const maxDynamic =
    data && data.costDynamics.length
      ? Math.max(1, ...data.costDynamics.flatMap((d) => [d.actual, d.planned]))
      : 1;

  return (
    <div className="p-4 lg:p-10 space-y-8 max-w-[1200px] mx-auto w-full">
      {/* Page Title & Actions */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div className="space-y-2">
          <h1 className="text-3xl lg:text-4xl font-extrabold text-white tracking-tight font-display">{t('reports.title')}</h1>
          <p className="text-[#BCC0C7] max-w-xl">{t('reports.subtitle')}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex bg-[#343841]/30 border border-[#343841]/50 rounded-xl p-1">
            <button aria-label="Excel" className="w-10 h-10 inline-flex items-center justify-center hover:bg-white/5 rounded-lg"><Icon icon="lucide:file-spreadsheet" className="w-4 h-4" /></button>
            <button aria-label="PDF" className="w-10 h-10 inline-flex items-center justify-center hover:bg-white/5 rounded-lg"><Icon icon="lucide:file-text" className="w-4 h-4" /></button>
          </div>
        </div>
      </div>

      {error && (
        <div className="glass-panel rounded-2xl p-6 border border-red-500/20 bg-red-500/5 text-red-400 text-sm">
          {error}
        </div>
      )}

      {loading || !data ? (
        <ReportSkeleton />
      ) : (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
            <StatCard
              icon="lucide:dollar-sign"
              iconColor="text-[#F97316]"
              label={t('reports.totalExpense')}
              value={fmt(data.totalExpense)}
              trend={data.trends.totalExpense}
            />
            <StatCard
              icon="lucide:box"
              iconColor="text-[#22D3EE]"
              label={t('reports.materialCost')}
              value={fmt(data.materialCost)}
              trend={data.trends.materialCost}
            />
            <StatCard
              icon="lucide:hammer"
              iconColor="text-[#C084FC]"
              label={t('reports.laborCost')}
              value={fmt(data.laborCost)}
              trend={data.trends.laborCost}
            />
            <StatCard
              icon="lucide:trending-up"
              iconColor="text-[#34D399]"
              label={t('reports.netProfit')}
              value={fmt(data.netProfit)}
              trend={data.trends.netProfit}
            />
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Chart */}
            <div className="lg:col-span-2 glass-panel rounded-2xl p-6 flex flex-col">
              <div className="flex items-start justify-between mb-8">
                <div>
                  <h3 className="text-xl font-bold text-white font-display">{t('reports.costDynamics')}</h3>
                </div>
              </div>
              <div className="flex-1 min-h-[300px] relative flex items-end justify-between gap-2 sm:gap-4 px-1">
                {data.costDynamics.every((d) => d.actual === 0 && d.planned === 0) ? (
                  <div className="w-full h-full flex items-center justify-center text-sm text-[#BCC0C7]">
                    {t('common.noData')}
                  </div>
                ) : (
                  data.costDynamics.map((d) => (
                    <div key={d.ym} className="flex-1 flex flex-col items-center gap-3 min-w-0 h-full justify-end">
                      <div className="w-full flex items-end justify-center gap-1 sm:gap-1.5 h-full">
                        <div
                          className="w-1/2 max-w-[18px] rounded-t-md bg-[#FF8E4D] transition-all duration-500"
                          style={{ height: `${Math.max(2, (d.actual / maxDynamic) * 100)}%` }}
                          title={`${t('reports.actual')}: ${fmt(d.actual)}`}
                        ></div>
                        <div
                          className="w-1/2 max-w-[18px] rounded-t-md bg-[#3DF2FF] transition-all duration-500"
                          style={{ height: `${Math.max(2, (d.planned / maxDynamic) * 100)}%` }}
                          title={`${t('reports.planned')}: ${fmt(d.planned)}`}
                        ></div>
                      </div>
                      <span className="text-[10px] sm:text-xs text-[#BCC0C7] truncate w-full text-center">{monthLabel(d.ym)}</span>
                    </div>
                  ))
                )}
              </div>
              <div className="flex items-center justify-center gap-8 mt-4">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-sm bg-[#FF8E4D]"></div>
                  <span className="text-xs text-white">{t('reports.actual')}</span>
                </div>
                <div className="flex items-center gap-2" title={t('reports.plannedHint')}>
                  <div className="w-2 h-2 rounded-sm bg-[#3DF2FF]"></div>
                  <span className="text-xs text-white">{t('reports.planned')}</span>
                </div>
              </div>
            </div>

            {/* Resource Usage Chart */}
            <div className="glass-panel rounded-2xl p-6 flex flex-col">
              <h3 className="text-xl font-bold text-white font-display mb-1">{t('reports.resourceUsage')}</h3>
              <p className="text-sm text-[#BCC0C7] mb-8">&nbsp;</p>

              <div className="flex-1 space-y-6">
                {data.resourceUsage.length === 0 ? (
                  <p className="text-sm text-[#BCC0C7]">{t('common.noData')}</p>
                ) : (
                  data.resourceUsage.map((r) => (
                    <ResourceBar key={r.label} label={r.label} percentage={r.percentage} color="bg-[#22D3EE]" />
                  ))
                )}
              </div>

              <div className="mt-8 p-4 bg-[#16181D]/40 border border-[#343841]/50 rounded-xl">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs text-[#BCC0C7]">{t('reports.resourceUsage')}</span>
                  <span className="text-sm font-bold text-[#F97316]">{avgUsage(data)}%</span>
                </div>
                <div className="h-1.5 w-full bg-[#343841]/30 rounded-full overflow-hidden">
                  <div className="h-full bg-[#F97316]" style={{ width: `${avgUsage(data)}%` }}></div>
                </div>
              </div>
            </div>
          </div>

          {/* Table Section */}
          <div className="glass-panel rounded-2xl overflow-hidden">
            <div className="p-6 border-b border-[#343841]/50 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-white font-display">{t('reports.pnl')}</h3>
              </div>
            </div>
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left border-separate border-spacing-0">
                <thead>
                  <tr className="bg-[#16181D]/20">
                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-[#BCC0C7]">{t('reports.category')}</th>
                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-[#BCC0C7]">{t('reports.revenue')}</th>
                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-[#BCC0C7]">{t('reports.expense')}</th>
                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-[#BCC0C7]">{t('reports.profit')}</th>
                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-right text-[#BCC0C7]">{t('reports.status')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#343841]/30">
                  {data.pnl.every((r) => r.revenue === 0 && r.expense === 0) ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-sm text-[#BCC0C7]">
                        {t('common.noData')}
                      </td>
                    </tr>
                  ) : (
                    data.pnl.map((row) => (
                      <TableRow
                        key={row.key}
                        category={t(`reports.pnlCat.${row.key}`)}
                        revenue={fmt(row.revenue)}
                        expense={fmt(row.expense)}
                        profit={row.profit}
                        profitStr={fmt(Math.abs(row.profit))}
                        status={row.status}
                        statusLabel={t(`reports.pnlStatus.${row.status}`)}
                      />
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Bottom Actions — PDF eksport (brauzer print orqali PDF saqlash) */}
          <div className="grid grid-cols-1 gap-6 pb-12">
            <div className="glass-panel rounded-2xl p-6 flex items-center gap-4 bg-gradient-to-br from-[#191B1F]/40 to-[#16181D]/40">
              <div className="w-12 h-12 rounded-full bg-[#F97316]/10 border border-[#F97316]/20 flex items-center justify-center shrink-0">
                <Icon icon="lucide:download" className="w-5 h-5 text-[#F97316]" />
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-white font-display">{t('reports.pdfExport')}</h4>
                <p className="text-xs text-[#BCC0C7]">{t('reports.pdfExportDesc')}</p>
              </div>
              <button
                onClick={() => window.print()}
                className="px-5 py-2.5 bg-[#FF6B1A] text-white text-sm font-semibold rounded-xl shadow-[0_8px_16px_rgba(249,115,22,0.2)] hover:scale-105 transition-transform"
              >
                {t('reports.download')}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function avgUsage(data: ReportSummary): number {
  if (!data.resourceUsage.length) return 0;
  const sum = data.resourceUsage.reduce((acc, r) => acc + r.percentage, 0);
  return Math.round(sum / data.resourceUsage.length);
}

// Helper Components
// trend: joriy oy vs o'tgan oy (%). null = o'tgan davr ma'lumoti yo'q —
// badge UMUMAN ko'rsatilmaydi (fake foiz taqiqlangan).
function StatCard({
  icon,
  iconColor,
  label,
  value,
  trend,
}: {
  icon: string;
  iconColor: string;
  label: string;
  value: string;
  trend: number | null;
}) {
  const trendUp = (trend ?? 0) >= 0;
  return (
    <div className="glass-panel rounded-2xl p-6 flex flex-col gap-4 hover:translate-y-[-2px] transition-transform duration-300">
      <div className="flex items-start justify-between">
        <div className={`w-12 h-12 rounded-2xl bg-[#16181D]/50 border border-[#343841]/50 flex items-center justify-center ${iconColor}`}>
          <Icon icon={icon} className="w-6 h-6" />
        </div>
        {trend !== null && (
          <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${trendUp ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
            <Icon icon={trendUp ? 'lucide:trending-up' : 'lucide:trending-down'} className="w-3 h-3" />
            {trendUp ? '+' : ''}{trend}%
          </div>
        )}
      </div>
      <div>
        <p className="text-sm font-medium text-[#BCC0C7]">{label}</p>
        <p className="text-2xl font-bold text-white font-display mt-1 data-value">{value}</p>
      </div>
    </div>
  );
}

function ResourceBar({ label, percentage, color }: { label: string; percentage: number; color: string }) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-xs font-medium">
        <span className="text-[#BCC0C7]">{label}</span>
        <span className="text-white">{percentage}%</span>
      </div>
      <div className="h-2 w-full bg-[#343841]/30 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full`} style={{ width: `${percentage}%` }}></div>
      </div>
    </div>
  );
}

// Holat backend'dan key sifatida keladi ('ok'|'warn'|'good' — ma'lumotdan
// kelib chiqqan), label i18n orqali tarjima qilinadi.
const STATUS_CLS: Record<string, string> = {
  good: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
  warn: 'bg-orange-500/10 border-orange-500/20 text-orange-400',
  ok: 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400',
};

function TableRow({
  category,
  revenue,
  expense,
  profit,
  profitStr,
  status,
  statusLabel,
}: {
  category: string;
  revenue: string;
  expense: string;
  profit: number;
  profitStr: string;
  status: string;
  statusLabel: string;
}) {
  const isLoss = profit < 0;
  return (
    <tr className="hover:bg-white/5 transition-colors group">
      <td className="px-6 py-4 text-sm font-medium text-white">{category}</td>
      <td className="px-6 py-4 text-sm text-[#BCC0C7] data-value">{revenue}</td>
      <td className="px-6 py-4 text-sm text-[#BCC0C7] data-value">{expense}</td>
      <td className={`px-6 py-4 text-sm font-bold data-value ${isLoss ? 'text-red-400' : 'text-emerald-400'}`}>
        {isLoss ? '-' : ''}{profitStr}
      </td>
      <td className="px-6 py-4 text-right">
        <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-bold border ${STATUS_CLS[status] ?? STATUS_CLS.ok}`}>
          {statusLabel}
        </span>
      </td>
    </tr>
  );
}

function ReportSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="glass-panel rounded-2xl p-6 h-[140px]">
            <div className="w-12 h-12 rounded-2xl bg-[#343841]/40"></div>
            <div className="h-3 w-24 bg-[#343841]/40 rounded mt-6"></div>
            <div className="h-5 w-32 bg-[#343841]/40 rounded mt-2"></div>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-panel rounded-2xl p-6 min-h-[380px]"></div>
        <div className="glass-panel rounded-2xl p-6 min-h-[380px]"></div>
      </div>
      <div className="glass-panel rounded-2xl h-[280px]"></div>
    </div>
  );
}
