// Hisobotlar (Vazifa 3) — BARCHA raqamlar DB'dan (fake yo'q).
// Filtrlar: oy (standart joriy) + loyiha. "+ Ma'lumot qo'shish" modali:
// Xarajat / Daromad / Reja (Me'yor). Reja vs Fakt jadvali BudgetPlan'dan.
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Icon } from '@iconify/react';
import { useTranslation } from 'react-i18next';
import { api, ApiError } from '../lib/api';
import { useCurrency } from '../lib/currency';
import { fmtDate } from '../lib/format';
import type {
  ReportsSummary,
  ExpenseItem,
  Income,
  Project,
  ExpenseCategory,
  PlanFaktRow,
} from '@smeta/shared';

const CATEGORIES: ExpenseCategory[] = ['MATERIAL', 'LABOR', 'EQUIPMENT', 'GENERAL'];

function currentYm(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}
function ymRange(ym: string): { from: string; to: string } {
  const [y, m] = ym.split('-').map(Number);
  const from = new Date(y, m - 1, 1);
  const to = new Date(y, m, 1);
  return { from: from.toISOString(), to: to.toISOString() };
}

type ModalTab = 'expense' | 'income' | 'plan';
interface ModalState {
  tab: ModalTab;
  editExpense?: ExpenseItem;
  editIncome?: Income;
}

export function Reports() {
  const { t, i18n } = useTranslation();
  const { fmt, rate } = useCurrency();
  // Yozuv o'z valyutasida saqlanadi — ko'rsatishda UZS'ga normallashtiramiz (fmt UZS kutadi)
  const rowUzs = (amount: number, cur: string) => (cur === 'USD' ? amount * rate : amount);

  const [period, setPeriod] = useState(currentYm());
  const [projectId, setProjectId] = useState(''); // '' = barcha loyihalar
  const [projects, setProjects] = useState<Project[]>([]);

  const [data, setData] = useState<ReportsSummary | null>(null);
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [expenses, setExpenses] = useState<ExpenseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modal, setModal] = useState<ModalState | null>(null);
  const [toast, setToast] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);

  const flash = useCallback((kind: 'ok' | 'err', text: string) => {
    setToast({ kind, text });
    window.setTimeout(() => setToast(null), 2500);
  }, []);

  const monthLabel = (ym: string) => {
    const [y, m] = ym.split('-').map(Number);
    return new Date(y, m - 1, 1).toLocaleDateString(i18n.language === 'ru' ? 'ru-RU' : 'uz-UZ', { month: 'short' });
  };

  const load = useCallback(async () => {
    setError(null);
    const { from, to } = ymRange(period);
    // period ANIQ yuboriladi — UTC serverda ISO'dan oy hisoblashda surilish bo'lmasin
    const qs = `from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&period=${period}${projectId ? `&projectId=${encodeURIComponent(projectId)}` : ''}`;
    try {
      const [sum, inc, exp] = await Promise.all([
        api.get<ReportsSummary>(`/reports/summary?${qs}`),
        api.get<Income[]>(`/incomes?${qs}`),
        api.get<ExpenseItem[]>(`/expenses/list?${qs}`),
      ]);
      setData(sum);
      setIncomes(inc);
      setExpenses(exp);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('reports.noData'));
    } finally {
      setLoading(false);
    }
  }, [period, projectId, t]);

  useEffect(() => {
    api.get<Project[]>('/projects').then(setProjects).catch(() => setProjects([]));
  }, []);
  useEffect(() => {
    setLoading(true);
    load();
  }, [load]);

  const maxDynamic =
    data && data.costDynamics.length
      ? Math.max(1, ...data.costDynamics.flatMap((d) => [d.actual, d.planned]))
      : 1;

  const noDataAtAll =
    !!data && data.totalExpense === 0 && data.incoming === 0 && incomes.length === 0 && expenses.length === 0;

  async function deleteIncome(row: Income) {
    if (!confirm(t('reports.confirmDeleteRow'))) return;
    try {
      await api.delete(`/incomes/${row.id}`);
      flash('ok', t('reports.rowDeleted'));
      load();
    } catch (err) {
      flash('err', err instanceof ApiError ? err.message : t('common.error'));
    }
  }
  async function deleteExpense(row: ExpenseItem) {
    if (!confirm(t('reports.confirmDeleteRow'))) return;
    try {
      await api.delete(`/expenses/${row.id}`);
      flash('ok', t('reports.rowDeleted'));
      load();
    } catch (err) {
      flash('err', err instanceof ApiError ? err.message : t('common.error'));
    }
  }

  return (
    <div className="p-4 lg:p-10 space-y-8 max-w-[1200px] mx-auto w-full">
      {/* Sarlavha + harakatlar */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div className="space-y-2">
          <h1 className="text-3xl lg:text-4xl font-extrabold text-white tracking-tight font-display">{t('reports.title')}</h1>
          <p className="text-[var(--c-muted)] max-w-xl">{t('reports.subtitle')}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {/* Vazifa 3C: ko'zga tashlanadigan ma'lumot kiritish tugmasi */}
          <button
            onClick={() => setModal({ tab: 'expense' })}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#FF6B1A] hover:bg-[#e55a10] text-white rounded-xl font-bold text-sm shadow-[0_8px_16px_rgba(249,115,22,0.2)]"
          >
            <Icon icon="lucide:plus" className="w-4 h-4" /> {t('reports.addData')}
          </button>
          <button
            onClick={() => window.print()}
            aria-label={t('reports.pdfExport')}
            className="w-11 h-11 inline-flex items-center justify-center bg-[var(--c-border)]/30 border border-[var(--c-border)]/50 rounded-xl hover:bg-white/5"
          >
            <Icon icon="lucide:download" className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Filtrlar: oy + loyiha */}
      <div className="glass-panel rounded-2xl p-4 flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <label className="block text-[11px] font-medium text-[var(--c-muted)] mb-1.5">{t('reports.filterMonth')}</label>
          <input
            type="month"
            value={period}
            onChange={(e) => e.target.value && setPeriod(e.target.value)}
            className="w-full bg-[var(--c-bg)]/50 border border-[var(--c-border)]/50 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-[#5555E7]/50 [color-scheme:dark]"
          />
        </div>
        <div className="flex-1">
          <label className="block text-[11px] font-medium text-[var(--c-muted)] mb-1.5">{t('reports.filterProject')}</label>
          <select
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            className="w-full bg-[var(--c-bg)]/50 border border-[var(--c-border)]/50 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-[#5555E7]/50"
          >
            <option value="" className="bg-[var(--c-panel)]">{t('reports.allProjects')}</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id} className="bg-[var(--c-panel)]">{p.title}</option>
            ))}
          </select>
        </div>
      </div>

      {toast && (
        <div className={`toast-in px-4 py-2.5 rounded-xl border text-sm ${toast.kind === 'ok' ? 'text-[#10B981] bg-[#10B981]/10 border-[#10B981]/20' : 'text-[#ff6b6b] bg-[#E11919]/10 border-[#E11919]/30'}`}>
          {toast.text}
        </div>
      )}
      {error && (
        <div className="glass-panel rounded-2xl p-6 border border-red-500/20 bg-red-500/5 text-red-400 text-sm">{error}</div>
      )}

      {loading || !data ? (
        <ReportSkeleton />
      ) : (
        <>
          {/* Ma'lumot yo'q holati — CTA bilan */}
          {noDataAtAll && (
            <div className="glass-panel rounded-2xl p-6 flex flex-col sm:flex-row items-center gap-4 border border-[#5555E7]/20">
              <Icon icon="lucide:database" className="w-8 h-8 text-[#5555E7]/60 shrink-0" />
              <p className="text-sm text-[var(--c-muted)] flex-1">{t('reports.emptyHint')}</p>
              <button
                onClick={() => setModal({ tab: 'expense' })}
                className="px-4 py-2 bg-[#5555E7] hover:bg-[#4444d6] text-white rounded-xl text-sm font-bold shrink-0"
              >
                {t('reports.addData')}
              </button>
            </div>
          )}

          {/* Kartalar — real trendlar (o'tgan davr bo'sh → badge yo'q) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <StatCard icon="lucide:dollar-sign" iconColor="text-[#F97316]" label={t('reports.totalExpense')} value={fmt(data.totalExpense)} trend={data.trends.totalExpense} invert />
            <StatCard icon="lucide:box" iconColor="text-[#22D3EE]" label={t('reports.materialCost')} value={fmt(data.materialCost)} trend={data.trends.materialCost} invert />
            <StatCard icon="lucide:hammer" iconColor="text-[#C084FC]" label={t('reports.laborCost')} value={fmt(data.laborCost)} trend={data.trends.laborCost} invert />
            <StatCard icon="lucide:wallet" iconColor="text-[#10B981]" label={t('reports.incoming')} value={fmt(data.incoming)} trend={data.trends.incoming ?? null} />
            <StatCard icon="lucide:trending-up" iconColor="text-[#34D399]" label={t('reports.netProfit')} value={fmt(data.netProfit)} trend={data.trends.netProfit} />
          </div>

          {/* Reja vs Fakt (Me'yor) — real BudgetPlan asosida (Vazifa 3D) */}
          <PlanFaktTable
            rows={data.planFakt}
            period={period}
            projectId={projectId || null}
            onSaved={() => { flash('ok', t('reports.planSaved')); load(); }}
            onError={(m) => flash('err', m)}
          />

          {/* Grafiklar (real) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 glass-panel rounded-2xl p-6 flex flex-col">
              <h3 className="text-xl font-bold text-white font-display mb-8">{t('reports.costDynamics')}</h3>
              <div className="flex-1 min-h-[260px] relative flex items-end justify-between gap-2 sm:gap-4 px-1">
                {data.costDynamics.every((d) => d.actual === 0 && d.planned === 0) ? (
                  <div className="w-full h-full flex items-center justify-center text-sm text-[var(--c-muted)]">{t('common.noData')}</div>
                ) : (
                  data.costDynamics.map((d) => (
                    <div key={d.ym} className="flex-1 flex flex-col items-center gap-3 min-w-0 h-full justify-end">
                      <div className="w-full flex items-end justify-center gap-1 sm:gap-1.5 h-full">
                        <div className="w-1/2 max-w-[18px] rounded-t-md bg-[#FF8E4D] transition-all duration-500" style={{ height: `${Math.max(2, (d.actual / maxDynamic) * 100)}%` }} title={`${t('reports.actual')}: ${fmt(d.actual)}`} />
                        <div className="w-1/2 max-w-[18px] rounded-t-md bg-[#3DF2FF] transition-all duration-500" style={{ height: `${Math.max(2, (d.planned / maxDynamic) * 100)}%` }} title={`${t('reports.planned')}: ${fmt(d.planned)}`} />
                      </div>
                      <span className="text-[10px] sm:text-xs text-[var(--c-muted)] truncate w-full text-center">{monthLabel(d.ym)}</span>
                    </div>
                  ))
                )}
              </div>
              <div className="flex items-center justify-center gap-8 mt-4">
                <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-sm bg-[#FF8E4D]" /><span className="text-xs text-white">{t('reports.actual')}</span></div>
                <div className="flex items-center gap-2" title={t('reports.plannedHint')}><div className="w-2 h-2 rounded-sm bg-[#3DF2FF]" /><span className="text-xs text-white">{t('reports.planned')}</span></div>
              </div>
            </div>

            <div className="glass-panel rounded-2xl p-6 flex flex-col">
              <h3 className="text-xl font-bold text-white font-display mb-6">{t('reports.resourceUsage')}</h3>
              <div className="flex-1 space-y-6">
                {data.resourceUsage.length === 0 ? (
                  <p className="text-sm text-[var(--c-muted)]">{t('common.noData')}</p>
                ) : (
                  data.resourceUsage.map((r) => (
                    <div key={r.label} className="space-y-2">
                      <div className="flex justify-between text-xs font-medium">
                        <span className="text-[var(--c-muted)]">{r.label}</span>
                        <span className="text-white">{r.percentage}%</span>
                      </div>
                      <div className="h-2 w-full bg-[var(--c-border)]/30 rounded-full overflow-hidden">
                        <div className="h-full bg-[#22D3EE] rounded-full" style={{ width: `${r.percentage}%` }} />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Kiritilgan ma'lumotlar — tahrirlash/o'chirish bilan (Vazifa 3C) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-12">
            {/* Daromadlar */}
            <div className="glass-panel rounded-2xl overflow-hidden">
              <div className="p-5 border-b border-[var(--c-border)]/40 flex items-center justify-between">
                <h3 className="font-bold text-white font-display">{t('reports.incomesTitle')}</h3>
                <button onClick={() => setModal({ tab: 'income' })} className="text-[12px] text-[#22D3EE] hover:underline flex items-center gap-1">
                  <Icon icon="lucide:plus" className="w-3.5 h-3.5" /> {t('common.add')}
                </button>
              </div>
              {incomes.length === 0 ? (
                <div className="p-8 text-center text-sm text-[var(--c-muted)]">{t('reports.noIncomes')}</div>
              ) : (
                <div className="divide-y divide-[var(--c-border)]/30 max-h-[320px] overflow-y-auto custom-scrollbar">
                  {incomes.map((row) => (
                    <div key={row.id} className="px-5 py-3 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm text-white truncate">{row.description || t('reports.incomeDefault')}</p>
                        <p className="text-[11px] text-[var(--c-muted)]">{fmtDate(row.date)}</p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <span className="text-sm font-bold text-[#10B981] mr-2">{fmt(rowUzs(row.amount, row.currency))}</span>
                        <button onClick={() => setModal({ tab: 'income', editIncome: row })} aria-label={t('common.edit')} className="w-9 h-9 inline-flex items-center justify-center rounded-lg text-[var(--c-muted)] hover:text-white hover:bg-white/5">
                          <Icon icon="lucide:pencil" className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => deleteIncome(row)} aria-label={t('common.delete')} className="w-9 h-9 inline-flex items-center justify-center rounded-lg text-[#E11919] hover:bg-[#E11919]/10">
                          <Icon icon="lucide:trash-2" className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Xarajatlar */}
            <div className="glass-panel rounded-2xl overflow-hidden">
              <div className="p-5 border-b border-[var(--c-border)]/40 flex items-center justify-between">
                <h3 className="font-bold text-white font-display">{t('reports.expensesTitle')}</h3>
                <button onClick={() => setModal({ tab: 'expense' })} className="text-[12px] text-[#22D3EE] hover:underline flex items-center gap-1">
                  <Icon icon="lucide:plus" className="w-3.5 h-3.5" /> {t('common.add')}
                </button>
              </div>
              {expenses.length === 0 ? (
                <div className="p-8 text-center text-sm text-[var(--c-muted)]">{t('reports.noExpenses')}</div>
              ) : (
                <div className="divide-y divide-[var(--c-border)]/30 max-h-[320px] overflow-y-auto custom-scrollbar">
                  {expenses.map((row) => (
                    <div key={row.id} className="px-5 py-3 flex items-center justify-between gap-3">
                      <div className="min-w-0 flex items-center gap-2">
                        {row.orderId && (
                          <span title={t('expenses.fromOrder')} className="w-6 h-6 rounded-lg bg-[#22D3EE]/10 border border-[#22D3EE]/20 flex items-center justify-center shrink-0">
                            <Icon icon="lucide:shopping-bag" className="w-3 h-3 text-[#22D3EE]" />
                          </span>
                        )}
                        <div className="min-w-0">
                          <p className="text-sm text-white truncate">{row.label}</p>
                          <p className="text-[11px] text-[var(--c-muted)]">
                            {t(`reports.pnlCat.${row.category === 'MATERIAL' ? 'materials' : row.category === 'LABOR' ? 'labor' : row.category === 'EQUIPMENT' ? 'equipment' : 'general'}`)}
                            {' · '}{fmtDate(row.spentAt ?? row.createdAt)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <span className="text-sm font-bold text-[#F97316] mr-2">{fmt(rowUzs(row.amount, row.currency))}</span>
                        <button onClick={() => setModal({ tab: 'expense', editExpense: row })} aria-label={t('common.edit')} className="w-9 h-9 inline-flex items-center justify-center rounded-lg text-[var(--c-muted)] hover:text-white hover:bg-white/5">
                          <Icon icon="lucide:pencil" className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => deleteExpense(row)} aria-label={t('common.delete')} className="w-9 h-9 inline-flex items-center justify-center rounded-lg text-[#E11919] hover:bg-[#E11919]/10">
                          <Icon icon="lucide:trash-2" className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {modal && (
        <AddDataModal
          state={modal}
          projects={projects}
          period={period}
          defaultProjectId={projectId || null}
          onClose={() => setModal(null)}
          onDone={(msg) => { setModal(null); flash('ok', msg); load(); }}
        />
      )}
    </div>
  );
}

// ─── Reja vs Fakt jadvali ────────────────────────────────────────────────
function PlanFaktTable({
  rows,
  period,
  projectId,
  onSaved,
  onError,
}: {
  rows: PlanFaktRow[];
  period: string;
  projectId: string | null;
  onSaved: () => void;
  onError: (m: string) => void;
}) {
  const { t } = useTranslation();
  const { fmt, currency, rate } = useCurrency();
  const [editing, setEditing] = useState<ExpenseCategory | null>(null);
  const [value, setValue] = useState('');
  const [saving, setSaving] = useState(false);

  const catLabel = (c: ExpenseCategory) =>
    t(`reports.pnlCat.${c === 'MATERIAL' ? 'materials' : c === 'LABOR' ? 'labor' : c === 'EQUIPMENT' ? 'equipment' : 'general'}`);

  function beginEdit(row: PlanFaktRow) {
    setEditing(row.category);
    // Joriy ko'rsatilayotgan valyutada tahrirlanadi
    setValue(String(currency === 'USD' ? Math.round((row.planned / rate) * 100) / 100 : Math.round(row.planned)));
  }

  async function savePlan(category: ExpenseCategory) {
    const num = parseFloat(value);
    if (Number.isNaN(num) || num < 0) return;
    setSaving(true);
    try {
      await api.put('/budget-plans', {
        projectId,
        category,
        plannedAmount: num,
        currency,
        period,
      });
      setEditing(null);
      onSaved();
    } catch (err) {
      onError(err instanceof ApiError ? err.message : t('common.saveError'));
    } finally {
      setSaving(false);
    }
  }

  // Rejani o'chirish — qator boshqaruvi (kiritish/tahrirlash/o'chirish to'liq)
  async function deletePlan(row: PlanFaktRow) {
    if (!row.planId) return;
    if (!confirm(t('reports.confirmDeletePlan'))) return;
    try {
      await api.delete(`/budget-plans/${row.planId}`);
      onSaved();
    } catch (err) {
      onError(err instanceof ApiError ? err.message : t('common.error'));
    }
  }

  return (
    <div className="glass-panel rounded-2xl overflow-hidden">
      <div className="p-6 border-b border-[var(--c-border)]/50 flex items-center justify-between gap-3">
        <div>
          <h3 className="text-xl font-bold text-white font-display">{t('reports.planFakt')}</h3>
          <p className="text-[12px] text-[var(--c-muted)] mt-0.5">{t('reports.planFaktSub')}</p>
        </div>
      </div>
      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full text-left border-separate border-spacing-0 min-w-[560px]">
          <thead>
            <tr className="bg-[var(--c-bg)]/20">
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-[var(--c-muted)]">{t('reports.category')}</th>
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-[var(--c-muted)]">{t('reports.colPlan')}</th>
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-[var(--c-muted)]">{t('reports.colFakt')}</th>
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-[var(--c-muted)]">{t('reports.colDiff')}</th>
              <th className="px-6 py-4" />
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--c-border)]/30">
            {CATEGORIES.map((cat) => {
              const row: PlanFaktRow =
                rows.find((r) => r.category === cat) ?? { category: cat, planned: 0, fakt: 0, diff: 0, planId: null };
              const over = row.planned > 0 && row.fakt > row.planned;
              const under = row.planned > 0 && row.fakt <= row.planned;
              return (
                <tr key={cat} className="hover:bg-white/5">
                  <td className="px-6 py-4 text-sm font-medium text-white">{catLabel(cat)}</td>
                  <td className="px-6 py-4 text-sm text-[var(--c-muted)]">
                    {editing === cat ? (
                      <div className="flex items-center gap-2">
                        <input
                          autoFocus
                          type="number"
                          value={value}
                          onChange={(e) => setValue(e.target.value)}
                          onKeyDown={(e) => { if (e.key === 'Enter') savePlan(cat); if (e.key === 'Escape') setEditing(null); }}
                          className="w-32 bg-[var(--c-bg)] border border-[#5555E7]/50 rounded-lg px-2.5 py-1.5 text-sm text-white outline-none"
                        />
                        <span className="text-[10px] text-[var(--c-muted)]">{currency}</span>
                        <button onClick={() => savePlan(cat)} disabled={saving} aria-label={t('common.save')} className="w-8 h-8 inline-flex items-center justify-center rounded-lg text-[#10B981] hover:bg-[#10B981]/10">
                          <Icon icon={saving ? 'lucide:loader' : 'lucide:check'} className={`w-4 h-4 ${saving ? 'animate-spin' : ''}`} />
                        </button>
                      </div>
                    ) : row.planId ? (
                      fmt(row.planned)
                    ) : (
                      <span className="text-[var(--c-muted)]/50">—</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm font-semibold text-white">{fmt(row.fakt)}</td>
                  <td className={`px-6 py-4 text-sm font-bold ${!row.planId ? 'text-[var(--c-muted)]/50' : over ? 'text-red-400' : under ? 'text-emerald-400' : 'text-[var(--c-muted)]'}`}>
                    {!row.planId ? '—' : `${row.diff >= 0 ? '+' : '−'}${fmt(Math.abs(row.diff))}`}
                  </td>
                  <td className="px-6 py-4 text-right">
                    {editing !== cat && (
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => beginEdit(row)} className="text-[12px] text-[#22D3EE] hover:underline whitespace-nowrap px-2 py-1">
                          {row.planId ? t('common.edit') : t('reports.enterPlan')}
                        </button>
                        {/* Reja mavjud bo'lsa — o'chirish */}
                        {row.planId && (
                          <button
                            onClick={() => deletePlan(row)}
                            aria-label={t('common.delete')}
                            className="w-8 h-8 inline-flex items-center justify-center rounded-lg text-[#E11919] hover:bg-[#E11919]/10"
                          >
                            <Icon icon="lucide:trash-2" className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── "+ Ma'lumot qo'shish" modali: Xarajat / Daromad / Reja ──────────────
function AddDataModal({
  state,
  projects,
  period,
  defaultProjectId,
  onClose,
  onDone,
}: {
  state: ModalState;
  projects: Project[];
  period: string;
  defaultProjectId: string | null;
  onClose: () => void;
  onDone: (msg: string) => void;
}) {
  const { t } = useTranslation();
  const [tab, setTab] = useState<ModalTab>(state.tab);
  const editExpense = state.editExpense;
  const editIncome = state.editIncome;

  // Xarajat formasi
  const [eLabel, setELabel] = useState(editExpense?.label ?? '');
  const [eAmount, setEAmount] = useState(editExpense ? String(editExpense.amount) : '');
  const [eCurrency, setECurrency] = useState<'UZS' | 'USD'>((editExpense?.currency as 'UZS' | 'USD') ?? 'UZS');
  const [eCategory, setECategory] = useState<ExpenseCategory>(editExpense?.category ?? 'GENERAL');
  const [eDate, setEDate] = useState((editExpense?.spentAt ?? new Date().toISOString()).slice(0, 10));
  const [eProject, setEProject] = useState(editExpense?.projectId ?? defaultProjectId ?? '');
  const [eNote, setENote] = useState(editExpense?.note ?? '');

  // Daromad formasi
  const [iAmount, setIAmount] = useState(editIncome ? String(editIncome.amount) : '');
  const [iCurrency, setICurrency] = useState<'UZS' | 'USD'>(editIncome?.currency ?? 'UZS');
  const [iDate, setIDate] = useState((editIncome?.date ?? new Date().toISOString()).slice(0, 10));
  const [iProject, setIProject] = useState(editIncome?.projectId ?? defaultProjectId ?? '');
  const [iDesc, setIDesc] = useState(editIncome?.description ?? '');

  // Reja formasi
  const [pCategory, setPCategory] = useState<ExpenseCategory>('MATERIAL');
  const [pAmount, setPAmount] = useState('');
  const [pCurrency, setPCurrency] = useState<'UZS' | 'USD'>('UZS');
  const [pPeriod, setPPeriod] = useState(period);
  const [pProject, setPProject] = useState(defaultProjectId ?? '');

  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const inp = 'w-full bg-[var(--c-bg)] border border-[var(--c-border)]/50 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-[#5555E7]/50';
  const catLabel = (c: ExpenseCategory) =>
    t(`reports.pnlCat.${c === 'MATERIAL' ? 'materials' : c === 'LABOR' ? 'labor' : c === 'EQUIPMENT' ? 'equipment' : 'general'}`);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setSaving(true);
    try {
      if (tab === 'expense') {
        const body = {
          label: eLabel.trim(),
          amount: parseFloat(eAmount) || 0,
          currency: eCurrency,
          category: eCategory,
          projectId: eProject || null,
          spentAt: eDate || null,
          note: eNote.trim() || null,
        };
        if (editExpense) await api.patch(`/expenses/${editExpense.id}`, body);
        else await api.post('/expenses/add', body);
        onDone(t('reports.expenseSaved'));
      } else if (tab === 'income') {
        const body = {
          amount: parseFloat(iAmount) || 0,
          currency: iCurrency,
          date: iDate || null,
          projectId: iProject || null,
          description: iDesc.trim() || null,
        };
        if (editIncome) await api.patch(`/incomes/${editIncome.id}`, body);
        else await api.post('/incomes', body);
        onDone(t('reports.incomeSaved'));
      } else {
        await api.put('/budget-plans', {
          projectId: pProject || null,
          category: pCategory,
          plannedAmount: parseFloat(pAmount) || 0,
          currency: pCurrency,
          period: pPeriod,
        });
        onDone(t('reports.planSaved'));
      }
    } catch (e2) {
      setErr(e2 instanceof ApiError ? e2.message : t('common.saveError'));
    } finally {
      setSaving(false);
    }
  }

  const isEdit = !!editExpense || !!editIncome;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <form onClick={(e) => e.stopPropagation()} onSubmit={submit} className="w-full max-w-md bg-[var(--c-panel)] border border-[var(--c-border)]/60 rounded-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto custom-scrollbar">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold text-white font-display">{t('reports.addData')}</h3>
          <button type="button" onClick={onClose} aria-label={t('common.close')} className="w-10 h-10 -mr-2 inline-flex items-center justify-center rounded-lg text-[var(--c-muted)] hover:text-white hover:bg-white/5">
            <Icon icon="lucide:x" className="w-5 h-5" />
          </button>
        </div>

        {/* Tab tanlash (tahrirda qulflangan) */}
        {!isEdit && (
          <div className="flex bg-[var(--c-bg)]/60 border border-[var(--c-border)]/40 rounded-xl p-1">
            {(['expense', 'income', 'plan'] as ModalTab[]).map((tb) => (
              <button
                key={tb}
                type="button"
                onClick={() => setTab(tb)}
                className={`flex-1 py-1.5 text-[12px] font-bold rounded-lg transition-colors ${tab === tb ? 'bg-[#5555E7] text-white' : 'text-[var(--c-muted)] hover:text-white'}`}
              >
                {t(`reports.tab_${tb}`)}
              </button>
            ))}
          </div>
        )}

        {err && <div className="px-4 py-2.5 bg-[#E11919]/10 border border-[#E11919]/30 rounded-lg text-[#ff6b6b] text-sm">{err}</div>}

        {tab === 'expense' && (
          <>
            <Field label={t('reports.fLabel')}><input value={eLabel} onChange={(e) => setELabel(e.target.value)} required minLength={1} placeholder={t('expenses.namePh')} className={inp} /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label={t('reports.fAmount')}><input type="number" step="any" min="0.01" value={eAmount} onChange={(e) => setEAmount(e.target.value)} required className={inp} /></Field>
              <Field label={t('reports.fCurrency')}>
                <select value={eCurrency} onChange={(e) => setECurrency(e.target.value as 'UZS' | 'USD')} className={inp}>
                  <option value="UZS" className="bg-[var(--c-panel)]">UZS</option>
                  <option value="USD" className="bg-[var(--c-panel)]">USD</option>
                </select>
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label={t('reports.fCategory')}>
                <select value={eCategory} onChange={(e) => setECategory(e.target.value as ExpenseCategory)} className={inp}>
                  {CATEGORIES.map((c) => <option key={c} value={c} className="bg-[var(--c-panel)]">{catLabel(c)}</option>)}
                </select>
              </Field>
              <Field label={t('reports.fDate')}><input type="date" value={eDate} onChange={(e) => setEDate(e.target.value)} className={`${inp} [color-scheme:dark]`} /></Field>
            </div>
            <Field label={t('reports.fProject')}>
              <select value={eProject} onChange={(e) => setEProject(e.target.value)} className={inp}>
                <option value="" className="bg-[var(--c-panel)]">{t('calc.noProject')}</option>
                {projects.map((p) => <option key={p.id} value={p.id} className="bg-[var(--c-panel)]">{p.title}</option>)}
              </select>
            </Field>
            <Field label={t('reports.fNote')}><input value={eNote} onChange={(e) => setENote(e.target.value)} className={inp} /></Field>
          </>
        )}

        {tab === 'income' && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <Field label={t('reports.fAmount')}><input type="number" step="any" min="0.01" value={iAmount} onChange={(e) => setIAmount(e.target.value)} required className={inp} /></Field>
              <Field label={t('reports.fCurrency')}>
                <select value={iCurrency} onChange={(e) => setICurrency(e.target.value as 'UZS' | 'USD')} className={inp}>
                  <option value="UZS" className="bg-[var(--c-panel)]">UZS</option>
                  <option value="USD" className="bg-[var(--c-panel)]">USD</option>
                </select>
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label={t('reports.fDate')}><input type="date" value={iDate} onChange={(e) => setIDate(e.target.value)} className={`${inp} [color-scheme:dark]`} /></Field>
              <Field label={t('reports.fProject')}>
                <select value={iProject} onChange={(e) => setIProject(e.target.value)} className={inp}>
                  <option value="" className="bg-[var(--c-panel)]">{t('calc.noProject')}</option>
                  {projects.map((p) => <option key={p.id} value={p.id} className="bg-[var(--c-panel)]">{p.title}</option>)}
                </select>
              </Field>
            </div>
            <Field label={t('reports.fDescription')}><input value={iDesc} onChange={(e) => setIDesc(e.target.value)} placeholder={t('reports.fDescriptionPh')} className={inp} /></Field>
          </>
        )}

        {tab === 'plan' && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <Field label={t('reports.fCategory')}>
                <select value={pCategory} onChange={(e) => setPCategory(e.target.value as ExpenseCategory)} className={inp}>
                  {CATEGORIES.map((c) => <option key={c} value={c} className="bg-[var(--c-panel)]">{catLabel(c)}</option>)}
                </select>
              </Field>
              <Field label={t('reports.fPeriod')}><input type="month" value={pPeriod} onChange={(e) => e.target.value && setPPeriod(e.target.value)} className={`${inp} [color-scheme:dark]`} /></Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label={t('reports.fPlanAmount')}><input type="number" step="any" min="0" value={pAmount} onChange={(e) => setPAmount(e.target.value)} required className={inp} /></Field>
              <Field label={t('reports.fCurrency')}>
                <select value={pCurrency} onChange={(e) => setPCurrency(e.target.value as 'UZS' | 'USD')} className={inp}>
                  <option value="UZS" className="bg-[var(--c-panel)]">UZS</option>
                  <option value="USD" className="bg-[var(--c-panel)]">USD</option>
                </select>
              </Field>
            </div>
            <Field label={t('reports.fProject')}>
              <select value={pProject} onChange={(e) => setPProject(e.target.value)} className={inp}>
                <option value="" className="bg-[var(--c-panel)]">{t('calc.noProject')}</option>
                {projects.map((p) => <option key={p.id} value={p.id} className="bg-[var(--c-panel)]">{p.title}</option>)}
              </select>
            </Field>
          </>
        )}

        <button disabled={saving} className="w-full py-3 bg-[#FF6B1A] hover:bg-[#e55a10] text-white font-bold rounded-xl disabled:opacity-60 flex items-center justify-center gap-2">
          {saving && <Icon icon="lucide:loader" className="w-4 h-4 animate-spin" />}
          {saving ? t('common.saving') : t('common.save')}
        </button>
      </form>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-[12px] font-medium text-[var(--c-muted)]">{label}</label>
      {children}
    </div>
  );
}

// Karta — trend null bo'lsa badge UMUMAN ko'rsatilmaydi (fake foiz taqiqlangan).
// invert: xarajat kartalarida o'sish salbiy (qizil) hisoblanadi.
function StatCard({
  icon,
  iconColor,
  label,
  value,
  trend,
  invert = false,
}: {
  icon: string;
  iconColor: string;
  label: string;
  value: string;
  trend: number | null;
  invert?: boolean;
}) {
  const up = (trend ?? 0) >= 0;
  const positive = invert ? !up : up;
  return (
    <div className="glass-panel rounded-2xl p-5 flex flex-col gap-3 hover:translate-y-[-2px] transition-transform duration-300">
      <div className="flex items-start justify-between">
        <div className={`w-10 h-10 rounded-xl bg-[var(--c-bg)]/50 border border-[var(--c-border)]/50 flex items-center justify-center ${iconColor}`}>
          <Icon icon={icon} className="w-5 h-5" />
        </div>
        {trend !== null && trend !== undefined && (
          <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${positive ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
            <Icon icon={up ? 'lucide:trending-up' : 'lucide:trending-down'} className="w-3 h-3" />
            {up ? '+' : ''}{trend}%
          </div>
        )}
      </div>
      <div>
        <p className="text-[12px] font-medium text-[var(--c-muted)]">{label}</p>
        <p className="text-lg font-bold text-white font-display mt-0.5 break-all">{value}</p>
      </div>
    </div>
  );
}

function ReportSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="glass-panel rounded-2xl p-5 h-[120px]">
            <div className="w-10 h-10 rounded-xl bg-[var(--c-border)]/40" />
            <div className="h-3 w-20 bg-[var(--c-border)]/40 rounded mt-4" />
            <div className="h-4 w-24 bg-[var(--c-border)]/40 rounded mt-2" />
          </div>
        ))}
      </div>
      <div className="glass-panel rounded-2xl h-[260px]" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-panel rounded-2xl min-h-[320px]" />
        <div className="glass-panel rounded-2xl min-h-[320px]" />
      </div>
    </div>
  );
}
