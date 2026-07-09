// Loyiha sahifasi (T2, brief v3): Umumiy (hisoblangan KPI) / Smetalar
// (bog'lash-uzish) / Xarajatlar (inline CRUD). Tahrirlash/Arxivlash/O'chirish.
// Barcha raqamlar /projects/:id/summary'dan — statik qiymat yo'q.
import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Icon } from '@iconify/react';
import { useTranslation } from 'react-i18next';
import { api, ApiError } from '../lib/api';
import { fmtDate, projectStatus } from '../lib/format';
import { useCurrency } from '../lib/currency';
import { ProjectModal } from './Projects';
import type { Project, ProjectSummary, Estimate, ExpenseItem, ExpenseCategory } from '@smeta/shared';

type Tab = 'overview' | 'estimates' | 'expenses';

export function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const { fmt, rate } = useCurrency();
  const navigate = useNavigate();

  const [project, setProject] = useState<Project | null>(null);
  const [summary, setSummary] = useState<ProjectSummary | null>(null);
  const [estimates, setEstimates] = useState<Estimate[] | null>(null);
  const [unlinked, setUnlinked] = useState<Estimate[]>([]);
  const [expenses, setExpenses] = useState<ExpenseItem[] | null>(null);
  const [tab, setTab] = useState<Tab>('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [toast, setToast] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);

  const flash = useCallback((kind: 'ok' | 'err', text: string) => {
    setToast({ kind, text });
    window.setTimeout(() => setToast(null), 2500);
  }, []);

  const load = useCallback(async () => {
    if (!id) return;
    setError(null);
    try {
      const [p, sum, ests, unl, exps] = await Promise.all([
        api.get<Project>(`/projects/${id}`),
        api.get<ProjectSummary>(`/projects/${id}/summary`),
        api.get<Estimate[]>(`/estimates?projectId=${id}`),
        api.get<Estimate[]>('/estimates?projectId=none'),
        api.get<ExpenseItem[]>(`/expenses/list?projectId=${id}`),
      ]);
      setProject(p);
      setSummary(sum);
      setEstimates(ests);
      setUnlinked(unl);
      setExpenses(exps);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('common.loadError'));
    } finally {
      setLoading(false);
    }
  }, [id, t]);

  useEffect(() => { load(); }, [load]);

  async function archive() {
    if (!project) return;
    try {
      await api.patch(`/projects/${project.id}`, { status: 'ARCHIVED' });
      flash('ok', t('projects.detail.archived'));
      load();
    } catch (err) {
      flash('err', err instanceof ApiError ? err.message : t('common.error'));
    }
  }

  async function doDelete() {
    if (!project) return;
    setConfirmDelete(false);
    try {
      await api.delete(`/projects/${project.id}`);
      navigate('/app/loyihalar');
    } catch (err) {
      // 409 — smetalari bor: arxivlash tavsiya qilinadi
      flash('err', err instanceof ApiError ? err.message : t('common.error'));
    }
  }

  async function unlinkEstimate(est: Estimate) {
    try {
      await api.patch(`/estimates/${est.id}`, { projectId: null });
      flash('ok', t('projects.detail.unlinked'));
      load();
    } catch (err) {
      flash('err', err instanceof ApiError ? err.message : t('common.error'));
    }
  }

  async function linkEstimate(estId: string) {
    if (!estId) return;
    try {
      await api.patch(`/estimates/${estId}`, { projectId: id });
      flash('ok', t('projects.detail.linked'));
      load();
    } catch (err) {
      flash('err', err instanceof ApiError ? err.message : t('common.error'));
    }
  }

  if (loading) {
    return (
      <div className="p-4 lg:p-10 max-w-6xl mx-auto w-full space-y-6 animate-pulse">
        <div className="h-8 w-64 bg-[var(--c-border)]/30 rounded" />
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-28 bg-[var(--c-panel)]/40 rounded-2xl" />)}
        </div>
        <div className="h-64 bg-[var(--c-panel)]/40 rounded-2xl" />
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="p-4 lg:p-10 max-w-6xl mx-auto w-full">
        <div className="p-10 bg-[var(--c-panel)]/40 border border-[#E11919]/20 rounded-2xl text-center space-y-4">
          <Icon icon="lucide:triangle-alert" className="w-10 h-10 text-[#E11919] mx-auto" />
          <p className="text-[var(--c-muted)]">{error ?? t('common.loadError')}</p>
          <Link to="/app/loyihalar" className="inline-block px-5 py-2 bg-[var(--c-border)] rounded-xl text-sm text-white">{t('projects.detail.back')}</Link>
        </div>
      </div>
    );
  }

  const st = projectStatus(project.status);
  const budgetUzs = project.currency === 'USD' ? project.value * rate : project.value;

  return (
    <div className="p-4 lg:p-10 max-w-6xl mx-auto w-full space-y-6">
      <Link to="/app/loyihalar" className="inline-flex items-center gap-2 text-sm text-[var(--c-muted)] hover:text-white transition-colors">
        <Icon icon="lucide:arrow-left" className="w-4 h-4" /> {t('projects.detail.back')}
      </Link>

      {/* Sarlavha + amallar */}
      <div className="glass-panel rounded-2xl p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="font-display text-2xl md:text-3xl font-extrabold text-white tracking-tight">{project.title}</h1>
            <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${st.cls}`}>{t(`projects.statuses.${project.status}`)}</span>
          </div>
          <p className="text-sm text-[var(--c-muted)] mt-1">
            {project.code} · {project.clientName}
            {project.address ? ` · ${project.address}` : ''}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <button onClick={() => setEditOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-[#5555E7] hover:bg-[#4444d6] text-white rounded-xl text-sm font-bold">
            <Icon icon="lucide:pencil" className="w-4 h-4" /> {t('common.edit')}
          </button>
          {project.status !== 'ARCHIVED' && (
            <button onClick={archive} className="flex items-center gap-2 px-4 py-2 border border-[var(--c-border)]/60 text-[var(--c-muted)] hover:text-white rounded-xl text-sm font-medium hover:bg-white/5">
              <Icon icon="lucide:archive" className="w-4 h-4" /> {t('projects.detail.archive')}
            </button>
          )}
          <button onClick={() => setConfirmDelete(true)} className="flex items-center gap-2 px-4 py-2 border border-[#E11919]/40 text-[#E11919] rounded-xl text-sm font-medium hover:bg-[#E11919]/10">
            <Icon icon="lucide:trash-2" className="w-4 h-4" /> {t('common.delete')}
          </button>
        </div>
      </div>

      {toast && (
        <div className={`toast-in px-4 py-2.5 rounded-xl border text-sm ${toast.kind === 'ok' ? 'text-[#10B981] bg-[#10B981]/10 border-[#10B981]/20' : 'text-[#ff6b6b] bg-[#E11919]/10 border-[#E11919]/30'}`}>
          {toast.text}
        </div>
      )}

      {/* Tablar */}
      <div className="flex bg-[var(--c-panel)]/40 border border-[var(--c-border)]/40 rounded-xl p-1 w-fit">
        {([['overview', 'lucide:layout-dashboard'], ['estimates', 'lucide:file-text'], ['expenses', 'lucide:wallet']] as const).map(([key, icon]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${tab === key ? 'bg-[#5555E7]/20 text-[#5555E7]' : 'text-[var(--c-muted)] hover:text-white'}`}
          >
            <Icon icon={icon} className="w-4 h-4" />
            {t(`projects.detail.tab_${key}`)}
          </button>
        ))}
      </div>

      {/* Umumiy — hisoblangan KPI'lar */}
      {tab === 'overview' && summary && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <Kpi icon="lucide:piggy-bank" color="text-[#5555E7]" label={t('projects.detail.kpiBudget')} value={budgetUzs > 0 ? fmt(budgetUzs) : '—'} />
            <Kpi icon="lucide:dollar-sign" color="text-[#F97316]" label={t('projects.detail.kpiExpenses')} value={fmt(summary.totalExpenses)} />
            <Kpi icon="lucide:wallet" color="text-[#10B981]" label={t('projects.detail.kpiIncome')} value={fmt(summary.totalIncome)} />
            <Kpi icon="lucide:trending-up" color={summary.netProfit >= 0 ? 'text-[#34D399]' : 'text-[#E11919]'} label={t('projects.detail.kpiProfit')} value={fmt(summary.netProfit)} />
            <Kpi
              icon="lucide:gauge"
              color={summary.budgetUsedPercent !== null && summary.budgetUsedPercent > 100 ? 'text-[#E11919]' : 'text-[#22D3EE]'}
              label={t('projects.detail.kpiBudgetUsed')}
              value={summary.budgetUsedPercent === null ? '—' : `${summary.budgetUsedPercent}%`}
            />
          </div>

          {/* Ma'lumotlar bloki */}
          <div className="glass-panel rounded-2xl p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <InfoRow icon="lucide:user" label={t('projects.modal.client')} value={project.clientName} />
              <InfoRow icon="lucide:map-pin" label={t('projects.modal.address')} value={project.address || '—'} />
              <InfoRow icon="lucide:tag" label={t('projects.modal.category')} value={project.category} />
            </div>
            <div className="space-y-3">
              <InfoRow icon="lucide:calendar" label={t('projects.modal.startDate')} value={fmtDate(project.startDate)} />
              <InfoRow icon="lucide:calendar-check" label={t('projects.modal.deadline')} value={fmtDate(project.deadline)} />
              <InfoRow icon="lucide:file-text" label={t('projects.detail.kpiEstimates')} value={String(summary.estimatesCount)} />
            </div>
            {project.description && (
              <p className="md:col-span-2 text-sm text-[var(--c-muted)] leading-relaxed border-t border-[var(--c-border)]/30 pt-4">{project.description}</p>
            )}
          </div>
        </div>
      )}

      {/* Smetalar — bog'lash/uzish */}
      {tab === 'estimates' && (
        <div className="glass-panel rounded-2xl overflow-hidden">
          <div className="p-5 border-b border-[var(--c-border)]/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h3 className="font-bold text-white font-display">{t('projects.detail.tab_estimates')}</h3>
            {unlinked.length > 0 && (
              <div className="flex items-center gap-2">
                <select
                  defaultValue=""
                  onChange={(e) => { linkEstimate(e.target.value); e.target.value = ''; }}
                  className="bg-[var(--c-bg)] border border-[var(--c-border)]/50 rounded-xl px-3 py-2 text-sm text-white outline-none max-w-[260px]"
                >
                  <option value="" className="bg-[var(--c-panel)]">{t('projects.detail.linkEstimate')}</option>
                  {unlinked.map((e) => (
                    <option key={e.id} value={e.id} className="bg-[var(--c-panel)]">{e.title}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
          {!estimates || estimates.length === 0 ? (
            <div className="p-10 text-center space-y-3">
              <Icon icon="lucide:file-plus-2" className="w-10 h-10 mx-auto text-[var(--c-muted)]/40" />
              <p className="text-sm text-[var(--c-muted)]">{t('projects.detail.noEstimates')}</p>
              <Link to="/app/kalkulyator" className="inline-flex items-center gap-2 px-5 py-2 bg-[#5555E7] text-white rounded-xl text-sm font-bold">
                <Icon icon="lucide:calculator" className="w-4 h-4" /> {t('projects.detail.goCalculator')}
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-[var(--c-border)]/30">
              {estimates.map((e) => (
                <div key={e.id} className="px-5 py-4 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{e.title}</p>
                    <p className="text-[11px] text-[var(--c-muted)]">{fmtDate(e.createdAt)} · {t('calc.positions', { count: e.items.length })}</p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-sm font-display font-bold text-[#FF6B1A]">{fmt(e.total)}</span>
                    <button
                      onClick={() => unlinkEstimate(e)}
                      title={t('projects.detail.unlink')}
                      className="w-9 h-9 inline-flex items-center justify-center rounded-lg text-[var(--c-muted)] hover:text-[#E11919] hover:bg-[#E11919]/10"
                    >
                      <Icon icon="lucide:unlink" className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Xarajatlar — inline CRUD */}
      {tab === 'expenses' && (
        <ProjectExpenses
          projectId={project.id}
          expenses={expenses ?? []}
          onChanged={() => { load(); }}
          flash={flash}
        />
      )}

      {editOpen && (
        <ProjectModal initial={project} onClose={() => setEditOpen(false)} onSaved={() => { setEditOpen(false); flash('ok', t('common.saved')); load(); }} />
      )}

      {/* O'chirish tasdiqlash */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setConfirmDelete(false)}>
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-sm bg-[var(--c-panel)] border border-[var(--c-border)]/60 rounded-2xl p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-[#E11919]/15 flex items-center justify-center shrink-0">
                <Icon icon="lucide:trash-2" className="w-5 h-5 text-[#E11919]" />
              </div>
              <h3 className="font-display font-bold text-white text-lg">{t('projects.detail.deleteTitle')}</h3>
            </div>
            <p className="text-sm text-[var(--c-muted)] leading-relaxed">
              {(estimates?.length ?? 0) > 0 ? t('projects.detail.deleteBlocked') : t('projects.detail.deleteConfirm')}
            </p>
            <div className="flex gap-3 pt-1">
              <button onClick={() => setConfirmDelete(false)} className="flex-1 py-2.5 rounded-xl text-sm font-medium border border-[var(--c-border)]/60 text-[var(--c-muted)] hover:text-white hover:bg-white/5">
                {t('common.cancel')}
              </button>
              {(estimates?.length ?? 0) > 0 ? (
                <button onClick={() => { setConfirmDelete(false); archive(); }} className="flex-1 py-2.5 rounded-xl text-sm font-bold bg-[#5555E7] hover:bg-[#4444d6] text-white">
                  {t('projects.detail.archive')}
                </button>
              ) : (
                <button onClick={doDelete} className="flex-1 py-2.5 rounded-xl text-sm font-bold bg-[#E11919] hover:bg-[#c41616] text-white">
                  {t('common.delete')}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Kpi({ icon, color, label, value }: { icon: string; color: string; label: string; value: string }) {
  return (
    <div className="glass-panel rounded-2xl p-5">
      <Icon icon={icon} className={`w-5 h-5 mb-3 ${color}`} />
      <p className="text-[11px] text-[var(--c-muted)]">{label}</p>
      <p className="text-base font-bold font-display text-white mt-1 break-all">{value}</p>
    </div>
  );
}

function InfoRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3">
      <Icon icon={icon} className="w-4 h-4 text-[#22D3EE] shrink-0" />
      <span className="text-[12px] text-[var(--c-muted)] w-40 shrink-0">{label}</span>
      <span className="text-sm text-white truncate">{value}</span>
    </div>
  );
}

// Loyiha xarajatlari tab'i — qo'shish/tahrirlash/o'chirish inline.
function ProjectExpenses({
  projectId,
  expenses,
  onChanged,
  flash,
}: {
  projectId: string;
  expenses: ExpenseItem[];
  onChanged: () => void;
  flash: (kind: 'ok' | 'err', text: string) => void;
}) {
  const { t } = useTranslation();
  const { fmt, rate } = useCurrency();
  const [editing, setEditing] = useState<ExpenseItem | null>(null);
  const [label, setLabel] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState<'UZS' | 'USD'>('UZS');
  const [category, setCategory] = useState<ExpenseCategory>('GENERAL');
  const [saving, setSaving] = useState(false);

  const rowUzs = (v: number, cur: string) => (cur === 'USD' ? v * rate : v);

  function beginEdit(row: ExpenseItem) {
    setEditing(row);
    setLabel(row.label);
    setAmount(String(row.amount));
    setCurrency((row.currency as 'UZS' | 'USD') ?? 'UZS');
    setCategory(row.category);
  }
  function resetForm() {
    setEditing(null);
    setLabel('');
    setAmount('');
    setCategory('GENERAL');
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const num = parseFloat(amount);
    if (!label.trim() || Number.isNaN(num) || num <= 0) return;
    setSaving(true);
    try {
      const body = { label: label.trim(), amount: num, currency, category, projectId };
      if (editing) await api.patch(`/expenses/${editing.id}`, body);
      else await api.post('/expenses/add', body);
      flash('ok', t('reports.expenseSaved'));
      resetForm();
      onChanged();
    } catch (err) {
      flash('err', err instanceof ApiError ? err.message : t('common.saveError'));
    } finally {
      setSaving(false);
    }
  }

  async function remove(row: ExpenseItem) {
    if (!confirm(t('reports.confirmDeleteRow'))) return;
    try {
      await api.delete(`/expenses/${row.id}`);
      flash('ok', t('reports.rowDeleted'));
      onChanged();
    } catch (err) {
      flash('err', err instanceof ApiError ? err.message : t('common.error'));
    }
  }

  const catLabel = (c: ExpenseCategory) =>
    t(`reports.pnlCat.${c === 'MATERIAL' ? 'materials' : c === 'LABOR' ? 'labor' : c === 'EQUIPMENT' ? 'equipment' : 'general'}`);
  const inp = 'bg-[var(--c-bg)] border border-[var(--c-border)]/50 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-[#5555E7]/50';

  return (
    <div className="glass-panel rounded-2xl overflow-hidden">
      {/* Inline qo'shish/tahrirlash formasi */}
      <form onSubmit={submit} className="p-5 border-b border-[var(--c-border)]/40 grid grid-cols-2 md:grid-cols-5 gap-3 items-end">
        <div className="col-span-2 md:col-span-1">
          <label className="block text-[11px] text-[var(--c-muted)] mb-1">{t('reports.fLabel')}</label>
          <input value={label} onChange={(e) => setLabel(e.target.value)} required placeholder={t('expenses.namePh')} className={`${inp} w-full`} />
        </div>
        <div>
          <label className="block text-[11px] text-[var(--c-muted)] mb-1">{t('reports.fAmount')}</label>
          <input type="number" step="any" min="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} required className={`${inp} w-full`} />
        </div>
        <div>
          <label className="block text-[11px] text-[var(--c-muted)] mb-1">{t('reports.fCurrency')}</label>
          <select value={currency} onChange={(e) => setCurrency(e.target.value as 'UZS' | 'USD')} className={`${inp} w-full`}>
            <option value="UZS" className="bg-[var(--c-panel)]">UZS</option>
            <option value="USD" className="bg-[var(--c-panel)]">USD</option>
          </select>
        </div>
        <div>
          <label className="block text-[11px] text-[var(--c-muted)] mb-1">{t('reports.fCategory')}</label>
          <select value={category} onChange={(e) => setCategory(e.target.value as ExpenseCategory)} className={`${inp} w-full`}>
            {(['MATERIAL', 'LABOR', 'EQUIPMENT', 'GENERAL'] as ExpenseCategory[]).map((c) => (
              <option key={c} value={c} className="bg-[var(--c-panel)]">{catLabel(c)}</option>
            ))}
          </select>
        </div>
        <div className="flex gap-2">
          <button type="submit" disabled={saving} className="flex-1 py-2 bg-[#FF6B1A] hover:bg-[#e55a10] text-white rounded-xl text-sm font-bold disabled:opacity-50 flex items-center justify-center gap-1.5">
            <Icon icon={saving ? 'lucide:loader' : editing ? 'lucide:check' : 'lucide:plus'} className={`w-4 h-4 ${saving ? 'animate-spin' : ''}`} />
            {editing ? t('common.save') : t('common.add')}
          </button>
          {editing && (
            <button type="button" onClick={resetForm} className="px-3 py-2 border border-[var(--c-border)]/60 rounded-xl text-sm text-[var(--c-muted)] hover:text-white">
              <Icon icon="lucide:x" className="w-4 h-4" />
            </button>
          )}
        </div>
      </form>

      {expenses.length === 0 ? (
        <div className="p-10 text-center text-sm text-[var(--c-muted)]">{t('reports.noExpenses')}</div>
      ) : (
        <div className="divide-y divide-[var(--c-border)]/30">
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
                  <p className="text-[11px] text-[var(--c-muted)]">{catLabel(row.category)} · {fmtDate(row.spentAt ?? row.createdAt)}</p>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <span className="text-sm font-bold text-[#F97316] mr-2">{fmt(rowUzs(row.amount, row.currency))}</span>
                <button onClick={() => beginEdit(row)} aria-label={t('common.edit')} className="w-9 h-9 inline-flex items-center justify-center rounded-lg text-[var(--c-muted)] hover:text-white hover:bg-white/5">
                  <Icon icon="lucide:pencil" className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => remove(row)} aria-label={t('common.delete')} className="w-9 h-9 inline-flex items-center justify-center rounded-lg text-[#E11919] hover:bg-[#E11919]/10">
                  <Icon icon="lucide:trash-2" className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
