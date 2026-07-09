// Loyihalar ro'yxati (T2, brief v3): qidiruv + status filtri + saralash,
// kartalarda budjet vs sarflangan progress (real, /projects/summaries'dan),
// karta bosilganda loyiha sahifasi ochiladi. Modal yaratish/tahrirlash uchun umumiy.
import { useEffect, useState, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Icon } from '@iconify/react';
import { useTranslation } from 'react-i18next';
import { api, ApiError } from '../lib/api';
import { fmtDate, projectStatus } from '../lib/format';
import { useCurrency } from '../lib/currency';
import type { Project, ProjectSummaries, ProjectStatus } from '@smeta/shared';

const STATUS_TABS = ['ALL', 'PLANNED', 'IN_PROGRESS', 'COMPLETED', 'ARCHIVED'] as const;
type SortKey = 'newest' | 'budget' | 'name';

export function Projects() {
  const { t } = useTranslation();
  const { fmt, rate } = useCurrency();
  const [projects, setProjects] = useState<Project[]>([]);
  const [summaries, setSummaries] = useState<ProjectSummaries>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState<(typeof STATUS_TABS)[number]>('ALL');
  const [sort, setSort] = useState<SortKey>('newest');
  const [modalOpen, setModalOpen] = useState(false);

  const fetchProjects = useCallback(async (query: string, st: string) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (query.trim()) params.set('q', query.trim());
      if (st !== 'ALL') params.set('status', st);
      const [data, sums] = await Promise.all([
        api.get<Project[]>(`/projects${params.toString() ? `?${params}` : ''}`),
        api.get<ProjectSummaries>('/projects/summaries'),
      ]);
      setProjects(data);
      setSummaries(sums);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'load_error');
      setProjects([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const tm = setTimeout(() => fetchProjects(q, status), q ? 350 : 0);
    return () => clearTimeout(tm);
  }, [q, status, fetchProjects]);

  // UZS'ga normallashtirilgan budjet (progress % uchun)
  const budgetUzs = useCallback(
    (p: Project) => (p.currency === 'USD' ? p.value * rate : p.value),
    [rate],
  );

  const sorted = useMemo(() => {
    const arr = [...projects];
    if (sort === 'budget') arr.sort((a, b) => budgetUzs(b) - budgetUzs(a));
    else if (sort === 'name') arr.sort((a, b) => a.title.localeCompare(b.title));
    // 'newest' — server allaqachon createdAt desc qaytaradi
    return arr;
  }, [projects, sort, budgetUzs]);

  return (
    <div className="p-4 lg:p-10 max-w-7xl mx-auto w-full space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <Icon icon="lucide:briefcase" className="w-8 h-8 text-[#FF6B1A]" />
            <h1 className="font-display text-3xl font-extrabold text-white tracking-tight">{t('projects.title')}</h1>
          </div>
          <p className="text-[var(--c-muted)] max-w-2xl">{t('projects.subtitle')}</p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 px-6 py-2.5 bg-[#FF6B1A] hover:bg-[#e55a10] text-white rounded-xl font-bold text-sm shadow-[0_0_20px_rgba(255,107,26,0.2)] transition-all active:scale-95 self-start md:self-auto"
        >
          <Icon icon="lucide:plus" className="w-5 h-5" />
          {t('projects.newProject')}
        </button>
      </div>

      {/* Qidiruv + status filtri + saralash */}
      <div className="p-4 bg-[var(--c-panel)]/20 border border-[var(--c-border)]/30 rounded-2xl backdrop-blur-xl flex flex-col lg:flex-row gap-4">
        <div className="flex-1 relative">
          <Icon icon="lucide:search" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--c-muted)]" />
          <input
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t('projects.searchPh')}
            className="w-full bg-[var(--c-bg)]/50 border border-[var(--c-border)]/40 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:border-[#5555E7]/50 transition-colors text-white placeholder:text-[var(--c-muted)]/60"
          />
        </div>
        <div className="flex gap-1 bg-[var(--c-bg)]/40 border border-[var(--c-border)]/40 rounded-xl p-1 overflow-x-auto no-scrollbar">
          {STATUS_TABS.map((st) => (
            <button
              key={st}
              onClick={() => setStatus(st)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${status === st ? 'bg-[#5555E7] text-white' : 'text-[var(--c-muted)] hover:text-white'}`}
            >
              {st === 'ALL' ? t('common.all') : t(`projects.statuses.${st}`)}
            </button>
          ))}
        </div>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as SortKey)}
          className="bg-[var(--c-bg)]/50 border border-[var(--c-border)]/40 rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:border-[#5555E7]/50"
        >
          <option value="newest" className="bg-[var(--c-panel)]">{t('projects.sortNewest')}</option>
          <option value="budget" className="bg-[var(--c-panel)]">{t('projects.sortBudget')}</option>
          <option value="name" className="bg-[var(--c-panel)]">{t('projects.sortName')}</option>
        </select>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-64 bg-[var(--c-panel)]/40 border border-white/5 rounded-2xl animate-pulse backdrop-blur-3xl" />
          ))}
        </div>
      ) : error ? (
        <div className="p-10 bg-[var(--c-panel)]/40 border border-[#E11919]/20 rounded-2xl text-center space-y-4 backdrop-blur-3xl">
          <Icon icon="lucide:triangle-alert" className="w-10 h-10 text-[#E11919] mx-auto" />
          <p className="text-[var(--c-muted)]">{t('projects.loadError')}</p>
          <button onClick={() => fetchProjects(q, status)} className="px-5 py-2 bg-[var(--c-border)] hover:bg-[var(--c-border)]/70 rounded-xl text-sm font-medium text-white transition-colors">
            {t('projects.retry')}
          </button>
        </div>
      ) : sorted.length === 0 ? (
        <div className="p-12 bg-[var(--c-panel)]/40 border border-white/5 rounded-2xl text-center space-y-5 backdrop-blur-3xl">
          <div className="w-16 h-16 bg-[#FF6B1A]/10 rounded-2xl flex items-center justify-center mx-auto">
            <Icon icon="lucide:folder-open" className="w-8 h-8 text-[#FF6B1A]" />
          </div>
          <div className="space-y-1.5">
            <h3 className="text-lg font-bold text-white">{t('projects.noProjectsTitle')}</h3>
            <p className="text-sm text-[var(--c-muted)] max-w-md mx-auto">
              {q.trim() || status !== 'ALL' ? t('projects.noProjectsSearch') : t('projects.noProjectsEmpty')}
            </p>
          </div>
          <button
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#FF6B1A] hover:bg-[#e55a10] text-white rounded-xl font-bold text-sm shadow-[0_0_20px_rgba(255,107,26,0.2)] transition-all active:scale-95"
          >
            <Icon icon="lucide:plus" className="w-5 h-5" />
            {t('projects.newProject')}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {sorted.map((project) => {
            const st = projectStatus(project.status as ProjectStatus);
            const sum = summaries[project.id];
            const spent = sum?.spent ?? 0;
            const budget = budgetUzs(project);
            const usedPct = budget > 0 ? Math.min(100, Math.round((spent / budget) * 100)) : 0;
            const over = budget > 0 && spent > budget;
            return (
              <Link
                key={project.id}
                to={`/app/loyihalar/${project.id}`}
                className="group relative bg-[var(--c-panel)]/40 border border-white/5 rounded-2xl p-6 shadow-2xl backdrop-blur-3xl card-hover-effect overflow-hidden block"
              >
                <div className="flex justify-between items-start mb-4">
                  <span className="text-[10px] font-bold tracking-wider text-[var(--c-muted)] uppercase">{project.code}</span>
                  <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${st.cls}`}>
                    {t(`projects.statuses.${project.status}`)}
                  </span>
                </div>

                <div className="space-y-1 mb-4">
                  <h3 className="text-lg font-bold text-white leading-tight group-hover:text-[#5555E7] transition-colors">{project.title}</h3>
                  <p className="text-sm text-[var(--c-muted)]">{project.clientName}</p>
                </div>

                {/* Budjet vs sarflangan — real summalar */}
                <div className="space-y-2 mb-5">
                  <div className="flex justify-between text-[12px]">
                    <span className="text-[var(--c-muted)]">{t('projects.spent')}</span>
                    <span className={`font-bold ${over ? 'text-red-400' : 'text-[#22D3EE]'}`}>
                      {fmt(spent)}{budget > 0 ? ` / ${fmt(budget)}` : ''}
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-[var(--c-border)]/40 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${over ? 'bg-[#E11919]' : 'bg-[#5555E7]'}`}
                      style={{ width: `${budget > 0 ? usedPct : 0}%` }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-5">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-[var(--c-muted)] uppercase">
                      <Icon icon="lucide:file-text" className="w-3 h-3 text-[#F97316]" />
                      {t('projects.estimatesCount')}
                    </div>
                    <div className="text-sm font-semibold text-white">{sum?.estimatesCount ?? 0}</div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-[var(--c-muted)] uppercase">
                      <Icon icon="lucide:calendar" className="w-3 h-3 text-[#F97316]" />
                      {t('projects.deadline')}
                    </div>
                    <div className="text-sm font-semibold text-white">{fmtDate(project.deadline)}</div>
                  </div>
                </div>

                <div className="pt-4 border-t border-[var(--c-border)]/20 flex items-center justify-between">
                  <span className="text-[11px] text-[var(--c-muted)]">
                    {t('projects.lastActivity')}: {fmtDate(project.updatedAt ?? project.createdAt)}
                  </span>
                  <Icon icon="lucide:arrow-right" className="w-4 h-4 text-[var(--c-muted)] group-hover:text-[#5555E7] group-hover:translate-x-1 transition-all" />
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {!loading && !error && sorted.length > 0 && (
        <div className="pt-6 border-t border-[var(--c-border)]/20">
          <p className="text-sm text-[var(--c-muted)]">{t('projects.showing', { total: sorted.length })}</p>
        </div>
      )}

      {modalOpen && (
        <ProjectModal onClose={() => setModalOpen(false)} onSaved={() => { setModalOpen(false); fetchProjects(q, status); }} />
      )}
    </div>
  );
}

// Yaratish/tahrirlash modali — ProjectDetail'da ham ishlatiladi.
export function ProjectModal({
  initial,
  onClose,
  onSaved,
}: {
  initial?: Project;
  onClose: () => void;
  onSaved: (p?: Project) => void;
}) {
  const { t } = useTranslation();
  const isEdit = !!initial;
  const [title, setTitle] = useState(initial?.title ?? '');
  const [clientName, setClientName] = useState(initial?.clientName ?? '');
  const [category, setCategory] = useState(initial?.category === 'Umumiy' ? '' : initial?.category ?? '');
  const [address, setAddress] = useState(initial?.address ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [value, setValue] = useState(initial ? String(initial.value) : '');
  const [currency, setCurrency] = useState<'UZS' | 'USD'>((initial?.currency as 'UZS' | 'USD') ?? 'UZS');
  const [startDate, setStartDate] = useState(initial?.startDate ? initial.startDate.slice(0, 10) : '');
  const [deadline, setDeadline] = useState(initial?.deadline ? initial.deadline.slice(0, 10) : '');
  const [status, setStatus] = useState<ProjectStatus>((initial?.status as ProjectStatus) ?? 'PLANNED');
  const [totalUnits, setTotalUnits] = useState(initial ? String(initial.totalUnits) : '');
  const [purchasePrice, setPurchasePrice] = useState(initial ? String(initial.purchasePrice) : '');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!title.trim()) { setError(t('projects.modal.errName')); return; }
    if (!clientName.trim()) { setError(t('projects.modal.errClient')); return; }
    const numValue = Number(value);
    if (value !== '' && (Number.isNaN(numValue) || numValue < 0)) { setError(t('projects.modal.errValue')); return; }
    if (startDate && deadline && startDate > deadline) { setError(t('projects.modal.errDates')); return; }

    setSubmitting(true);
    try {
      const body = {
        title: title.trim(),
        clientName: clientName.trim(),
        category: category.trim() || undefined,
        address: address.trim() || null,
        description: description.trim() || null,
        value: numValue || 0,
        currency,
        startDate: startDate || null,
        deadline: deadline || null,
        status,
        totalUnits: Number(totalUnits) || 0,
        purchasePrice: Number(purchasePrice) || 0,
      };
      const saved = isEdit
        ? await api.patch<Project>(`/projects/${initial!.id}`, body)
        : await api.post<Project>('/projects', body);
      onSaved(saved);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('projects.modal.createError'));
    } finally {
      setSubmitting(false);
    }
  }

  const fieldWrap = 'relative flex items-center bg-[var(--c-border)]/20 border border-[var(--c-border)]/40 rounded-xl px-4 py-3 focus-within:border-[#22D3EE]/50 transition-all';
  const inpCls = 'bg-transparent border-none outline-none text-sm text-white w-full placeholder:text-[var(--c-muted)]/50';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8 bg-[var(--c-bg)]/60 backdrop-blur-md" onClick={onClose}>
      <div className="w-full max-w-2xl bg-[var(--c-panel)]/60 border border-white/10 rounded-2xl shadow-2xl backdrop-blur-[40px] overflow-hidden flex flex-col max-h-full" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 md:p-8 bg-white/5 border-b border-white/5 flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-[#F97316]/10 rounded-xl flex items-center justify-center shrink-0">
              <Icon icon={isEdit ? 'lucide:pencil' : 'lucide:plus'} className="w-6 h-6 text-[#F97316]" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white font-display">{isEdit ? t('projects.modal.editTitle') : t('projects.modal.title')}</h2>
              <p className="text-sm text-[var(--c-muted)] mt-1">{t('projects.modal.sub')}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-lg transition-colors text-[var(--c-muted)] hover:text-white">
            <Icon icon="lucide:x" className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 p-6 md:p-8 overflow-y-auto custom-scrollbar space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <ModalField label={t('projects.modal.name')} required>
                <div className={fieldWrap}>
                  <Icon icon="lucide:folder" className="w-4 h-4 text-[var(--c-muted)]/60 mr-3 shrink-0" />
                  <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder={t('projects.modal.namePh')} className={inpCls} />
                </div>
              </ModalField>
              <ModalField label={t('projects.modal.client')} required>
                <div className={fieldWrap}>
                  <Icon icon="lucide:user" className="w-4 h-4 text-[var(--c-muted)]/60 mr-3 shrink-0" />
                  <input type="text" value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder={t('projects.modal.clientPh')} className={inpCls} />
                </div>
              </ModalField>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <ModalField label={t('projects.modal.address')}>
                <div className={fieldWrap}>
                  <Icon icon="lucide:map-pin" className="w-4 h-4 text-[var(--c-muted)]/60 mr-3 shrink-0" />
                  <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} placeholder={t('projects.modal.addressPh')} className={inpCls} />
                </div>
              </ModalField>
              <ModalField label={t('projects.modal.category')}>
                <div className={fieldWrap}>
                  <Icon icon="lucide:tag" className="w-4 h-4 text-[var(--c-muted)]/60 mr-3 shrink-0" />
                  <input type="text" value={category} onChange={(e) => setCategory(e.target.value)} placeholder={t('projects.modal.categoryPh')} className={inpCls} />
                </div>
              </ModalField>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
              <ModalField label={t('projects.modal.value')}>
                <div className={fieldWrap}>
                  <input type="number" min="0" value={value} onChange={(e) => setValue(e.target.value)} placeholder="0" className={inpCls} />
                </div>
              </ModalField>
              <ModalField label={t('projects.modal.currency')}>
                <div className={fieldWrap}>
                  <select value={currency} onChange={(e) => setCurrency(e.target.value as 'UZS' | 'USD')} className={`${inpCls} appearance-none`}>
                    <option value="UZS" className="bg-[var(--c-panel)]">UZS</option>
                    <option value="USD" className="bg-[var(--c-panel)]">USD</option>
                  </select>
                </div>
              </ModalField>
              <ModalField label={t('projects.modal.startDate')}>
                <div className={fieldWrap}>
                  <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className={`${inpCls} [color-scheme:dark]`} />
                </div>
              </ModalField>
              <ModalField label={t('projects.modal.deadline')}>
                <div className={fieldWrap}>
                  <input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} className={`${inpCls} [color-scheme:dark]`} />
                </div>
              </ModalField>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <ModalField label={t('projects.modal.status')}>
                <div className={fieldWrap}>
                  <select value={status} onChange={(e) => setStatus(e.target.value as ProjectStatus)} className={`${inpCls} appearance-none`}>
                    {(['PLANNED', 'IN_PROGRESS', 'COMPLETED', 'ARCHIVED'] as ProjectStatus[]).map((st) => (
                      <option key={st} value={st} className="bg-[var(--c-panel)]">{t(`projects.statuses.${st}`)}</option>
                    ))}
                  </select>
                </div>
              </ModalField>
              <ModalField label={t('projects.modal.totalUnits')}>
                <div className={fieldWrap}>
                  <input type="number" min="0" value={totalUnits} onChange={(e) => setTotalUnits(e.target.value)} placeholder="0" className={inpCls} />
                </div>
              </ModalField>
              <ModalField label={t('projects.modal.purchasePrice')}>
                <div className={fieldWrap}>
                  <input type="number" min="0" value={purchasePrice} onChange={(e) => setPurchasePrice(e.target.value)} placeholder="0" className={inpCls} />
                </div>
              </ModalField>
            </div>

            <ModalField label={t('projects.modal.description')}>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder={t('projects.modal.descriptionPh')}
                className="w-full bg-[var(--c-border)]/20 border border-[var(--c-border)]/40 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-[#22D3EE]/50 placeholder:text-[var(--c-muted)]/50"
              />
            </ModalField>
          </div>

          {error && (
            <div className="px-6 md:px-8 pb-2">
              <div className="flex items-center gap-2 px-4 py-3 bg-[#E11919]/10 border border-[#E11919]/20 rounded-xl text-sm text-[#E11919]">
                <Icon icon="lucide:circle-alert" className="w-4 h-4 shrink-0" />
                {error}
              </div>
            </div>
          )}

          <div className="p-6 md:p-8 bg-white/5 border-t border-white/5 flex items-center justify-between gap-3">
            <button type="button" onClick={onClose} className="px-6 py-3 bg-[var(--c-bg)] border border-[var(--c-border)]/50 rounded-xl text-[var(--c-muted)] text-sm font-medium hover:text-white transition-all">
              {t('projects.modal.cancel')}
            </button>
            <button type="submit" disabled={submitting} className="flex items-center gap-2 px-8 py-3 bg-[#06B6D4] rounded-xl text-white text-sm font-medium shadow-[0_8px_16px_rgba(6,182,212,0.2)] hover:bg-[#0891b2] transition-all disabled:opacity-50">
              {submitting ? (
                <><Icon icon="lucide:loader-circle" className="w-5 h-5 animate-spin" />{t('projects.modal.saving')}</>
              ) : (
                <><Icon icon="lucide:check" className="w-5 h-5" />{isEdit ? t('common.save') : t('projects.modal.create')}</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ModalField({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-[var(--c-muted)]">
        {label} {required && <span className="text-[#FF6B1A]">*</span>}
      </label>
      {children}
    </div>
  );
}
