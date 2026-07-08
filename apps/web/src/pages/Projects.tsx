import { useEffect, useState, useCallback } from 'react';
import { Icon } from '@iconify/react';
import { useTranslation } from 'react-i18next';
import { api, ApiError } from '../lib/api';
import { fmtMoney, fmtDate, projectStatus } from '../lib/format';
import type { Project } from '@smeta/shared';

export function Projects() {
  const { t } = useTranslation();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState('');
  const [modalOpen, setModalOpen] = useState(false);

  const fetchProjects = useCallback(async (query: string) => {
    setLoading(true);
    setError(null);
    try {
      const path = query.trim() ? `/projects?q=${encodeURIComponent(query.trim())}` : '/projects';
      const data = await api.get<Project[]>(path);
      setProjects(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'load_error');
      setProjects([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchProjects(''); }, [fetchProjects]);
  useEffect(() => {
    const tm = setTimeout(() => fetchProjects(q), 350);
    return () => clearTimeout(tm);
  }, [q, fetchProjects]);

  function initials(name?: string | null): string {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/);
    return (parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '');
  }

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

        <div className="flex items-center gap-3">
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-2 px-6 py-2.5 bg-[#FF6B1A] hover:bg-[#e55a10] text-white rounded-xl font-bold text-sm shadow-[0_0_20px_rgba(255,107,26,0.2)] transition-all active:scale-95"
          >
            <Icon icon="lucide:plus" className="w-5 h-5" />
            {t('projects.newProject')}
          </button>
        </div>
      </div>

      <div className="p-4 bg-[var(--c-panel)]/20 border border-[var(--c-border)]/30 rounded-2xl backdrop-blur-xl flex flex-col md:flex-row gap-4">
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
          <button onClick={() => fetchProjects(q)} className="px-5 py-2 bg-[var(--c-border)] hover:bg-[var(--c-border)]/70 rounded-xl text-sm font-medium text-white transition-colors">
            {t('projects.retry')}
          </button>
        </div>
      ) : projects.length === 0 ? (
        <div className="p-12 bg-[var(--c-panel)]/40 border border-white/5 rounded-2xl text-center space-y-5 backdrop-blur-3xl">
          <div className="w-16 h-16 bg-[#FF6B1A]/10 rounded-2xl flex items-center justify-center mx-auto">
            <Icon icon="lucide:folder-open" className="w-8 h-8 text-[#FF6B1A]" />
          </div>
          <div className="space-y-1.5">
            <h3 className="text-lg font-bold text-white">{t('projects.noProjectsTitle')}</h3>
            <p className="text-sm text-[var(--c-muted)] max-w-md mx-auto">
              {q.trim() ? t('projects.noProjectsSearch') : t('projects.noProjectsEmpty')}
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
          {projects.map((project) => {
            const st = projectStatus(project.status);
            return (
              <div key={project.id} className="group relative bg-[var(--c-panel)]/40 border border-white/5 rounded-2xl p-6 shadow-2xl backdrop-blur-3xl card-hover-effect overflow-hidden">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-bold tracking-wider text-[var(--c-muted)] uppercase">{project.code}</span>
                  </div>
                  <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${st.cls}`}>
                    {t(`projects.statuses.${project.status}`)}
                  </span>
                </div>

                <div className="space-y-1 mb-4">
                  <h3 className="text-lg font-bold text-white leading-tight group-hover:text-[#5555E7] transition-colors">{project.title}</h3>
                  <p className="text-sm text-[var(--c-muted)]">{project.clientName}</p>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-[var(--c-muted)] uppercase">
                      <Icon icon="lucide:trending-up" className="w-3 h-3 text-[#22D3EE]" />
                      {t('projects.estValue')}
                    </div>
                    <div className="text-sm font-semibold text-white">{fmtMoney(project.value, project.currency)}</div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-[var(--c-muted)] uppercase">
                      <Icon icon="lucide:calendar" className="w-3 h-3 text-[#F97316]" />
                      {t('projects.deadline')}
                    </div>
                    <div className="text-sm font-semibold text-white">{fmtDate(project.deadline)}</div>
                  </div>
                </div>

                <div className="space-y-2 mb-6">
                  <div className="flex justify-between text-[12px]">
                    <span className="text-[var(--c-muted)]">{t('projects.progress')}</span>
                    <span className="font-bold text-[#22D3EE]">{project.progress}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-[#efeffd] rounded-full overflow-hidden">
                    <div className="h-full bg-[#5555E7] rounded-full transition-all duration-500" style={{ width: `${project.progress}%` }} />
                  </div>
                </div>

                <div className="pt-4 border-t border-[var(--c-border)]/20 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {project.manager?.avatarUrl ? (
                      <img src={project.manager.avatarUrl} alt={project.manager.fullName} className="w-6 h-6 rounded-full object-cover" />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-[#5555E7]/20 border border-[#5555E7]/30 flex items-center justify-center text-[10px] font-bold text-[#5555E7] uppercase">
                        {initials(project.manager?.fullName)}
                      </div>
                    )}
                    <span className="text-[12px] text-[var(--c-muted)]">{project.manager?.fullName ?? t('projects.unassigned')}</span>
                  </div>
                  <span className="text-[10px] font-semibold px-3 py-1 bg-[var(--c-border)]/50 rounded-full text-[var(--c-muted)]">
                    {project.category}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!loading && !error && projects.length > 0 && (
        <div className="pt-6 border-t border-[var(--c-border)]/20 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-[var(--c-muted)]">{t('projects.showing', { total: projects.length })}</p>
        </div>
      )}

      {modalOpen && (
        <NewProjectModal onClose={() => setModalOpen(false)} onCreated={() => { setModalOpen(false); fetchProjects(q); }} />
      )}
    </div>
  );
}

function NewProjectModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const { t } = useTranslation();
  const [title, setTitle] = useState('');
  const [clientName, setClientName] = useState('');
  const [category, setCategory] = useState('');
  const [value, setValue] = useState('');
  const [currency, setCurrency] = useState<'UZS' | 'USD'>('UZS');
  const [deadline, setDeadline] = useState('');
  const [totalUnits, setTotalUnits] = useState('');
  const [purchasePrice, setPurchasePrice] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!title.trim()) { setError(t('projects.modal.errName')); return; }
    if (!clientName.trim()) { setError(t('projects.modal.errClient')); return; }
    const numValue = Number(value);
    if (!value || Number.isNaN(numValue) || numValue < 0) { setError(t('projects.modal.errValue')); return; }

    setSubmitting(true);
    try {
      await api.post<Project>('/projects', {
        title: title.trim(),
        clientName: clientName.trim(),
        category: category.trim(),
        value: numValue,
        currency,
        deadline: deadline || null,
        totalUnits: Number(totalUnits) || 0,
        purchasePrice: Number(purchasePrice) || 0,
      });
      onCreated();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('projects.modal.createError'));
    } finally {
      setSubmitting(false);
    }
  }

  const fieldWrap = 'relative flex items-center bg-[var(--c-border)]/20 border border-[var(--c-border)]/40 rounded-xl px-4 py-3 focus-within:border-[#22D3EE]/50 transition-all';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8 bg-[var(--c-bg)]/60 backdrop-blur-md" onClick={onClose}>
      <div className="w-full max-w-2xl bg-[var(--c-panel)]/40 border border-white/10 rounded-2xl shadow-2xl backdrop-blur-[40px] overflow-hidden flex flex-col max-h-full" onClick={(e) => e.stopPropagation()}>
        <div className="p-8 bg-white/5 border-b border-white/5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-[#F97316]/10 rounded-xl flex items-center justify-center shrink-0">
                <Icon icon="lucide:plus" className="w-6 h-6 text-[#F97316]" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white font-display">{t('projects.modal.title')}</h2>
                <p className="text-sm text-[var(--c-muted)] mt-1">{t('projects.modal.sub')}</p>
              </div>
            </div>
            <button onClick={onClose} className="self-start md:self-center p-2 hover:bg-white/5 rounded-lg transition-colors text-[var(--c-muted)] hover:text-white">
              <Icon icon="lucide:x" className="w-5 h-5" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 p-8 overflow-y-auto custom-scrollbar grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="space-y-2.5">
                <label className="text-sm font-medium text-[var(--c-muted)]">{t('projects.modal.name')}</label>
                <div className={fieldWrap}>
                  <Icon icon="lucide:folder" className="w-4 h-4 text-[var(--c-muted)]/60 mr-3 shrink-0" />
                  <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder={t('projects.modal.namePh')} className="bg-transparent border-none outline-none text-sm text-white w-full placeholder:text-[var(--c-muted)]/50" />
                </div>
              </div>

              <div className="space-y-2.5">
                <label className="text-sm font-medium text-[var(--c-muted)]">{t('projects.modal.client')}</label>
                <div className={fieldWrap}>
                  <Icon icon="lucide:user" className="w-4 h-4 text-[var(--c-muted)]/60 mr-3 shrink-0" />
                  <input type="text" value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder={t('projects.modal.clientPh')} className="bg-transparent border-none outline-none text-sm text-white w-full placeholder:text-[var(--c-muted)]/50" />
                </div>
              </div>

              <div className="space-y-2.5">
                <label className="text-sm font-medium text-[var(--c-muted)]">{t('projects.modal.category')}</label>
                <div className={fieldWrap}>
                  <Icon icon="lucide:tag" className="w-4 h-4 text-[var(--c-muted)]/60 mr-3 shrink-0" />
                  <input type="text" value={category} onChange={(e) => setCategory(e.target.value)} placeholder={t('projects.modal.categoryPh')} className="bg-transparent border-none outline-none text-sm text-white w-full placeholder:text-[var(--c-muted)]/50" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2.5">
                  <label className="text-sm font-medium text-[var(--c-muted)]">{t('projects.modal.value')}</label>
                  <div className={fieldWrap}>
                    <Icon icon="lucide:trending-up" className="w-4 h-4 text-[#22D3EE]/70 mr-3 shrink-0" />
                    <input type="number" min="0" value={value} onChange={(e) => setValue(e.target.value)} placeholder="0" className="bg-transparent border-none outline-none text-sm text-white w-full placeholder:text-[var(--c-muted)]/50" />
                  </div>
                </div>
                <div className="space-y-2.5">
                  <label className="text-sm font-medium text-[var(--c-muted)]">{t('projects.modal.deadline')}</label>
                  <div className={fieldWrap}>
                    <Icon icon="lucide:calendar" className="w-4 h-4 text-[#F97316]/70 mr-3 shrink-0" />
                    <input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} className="bg-transparent border-none outline-none text-sm text-white w-full placeholder:text-[var(--c-muted)]/50 [color-scheme:dark]" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2.5">
                  <label className="text-sm font-medium text-[var(--c-muted)]">{t('projects.modal.totalUnits')}</label>
                  <div className={fieldWrap}>
                    <Icon icon="lucide:building" className="w-4 h-4 text-[#5555E7]/70 mr-3 shrink-0" />
                    <input type="number" min="0" value={totalUnits} onChange={(e) => setTotalUnits(e.target.value)} placeholder="69" className="bg-transparent border-none outline-none text-sm text-white w-full placeholder:text-[var(--c-muted)]/50" />
                  </div>
                </div>
                <div className="space-y-2.5">
                  <label className="text-sm font-medium text-[var(--c-muted)]">{t('projects.modal.purchasePrice')}</label>
                  <div className={fieldWrap}>
                    <Icon icon="lucide:tag" className="w-4 h-4 text-[#22D3EE]/70 mr-3 shrink-0" />
                    <input type="number" min="0" value={purchasePrice} onChange={(e) => setPurchasePrice(e.target.value)} placeholder="0" className="bg-transparent border-none outline-none text-sm text-white w-full placeholder:text-[var(--c-muted)]/50" />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-[#0C0C55]/10 border border-[#5555E7]/20 rounded-2xl p-6 flex flex-col gap-4 h-fit">
              <div className="flex items-center gap-3">
                <Icon icon="lucide:wallet" className="w-5 h-5 text-[#5555E7]" />
                <span className="text-base font-semibold text-[#5555E7]">{t('projects.modal.currencyTitle')}</span>
              </div>
              <p className="text-xs leading-relaxed text-[var(--c-muted)]">{t('projects.modal.currencyDesc')}</p>
              <div className="grid grid-cols-2 gap-3 mt-2">
                <button type="button" onClick={() => setCurrency('UZS')} className={`py-3.5 rounded-xl text-sm font-medium transition-all duration-200 border-2 ${currency === 'UZS' ? 'bg-[#5555E7] border-[#5555E7] text-[var(--c-bg)] shadow-[0_8px_16px_rgba(85,85,231,0.2)]' : 'bg-[var(--c-border)]/20 border-[var(--c-border)]/40 text-white hover:bg-[var(--c-border)]/40'}`}>
                  {t('projects.modal.uzsFull')}
                </button>
                <button type="button" onClick={() => setCurrency('USD')} className={`py-3.5 rounded-xl text-sm font-medium transition-all duration-200 border-2 ${currency === 'USD' ? 'bg-[#5555E7] border-[#5555E7] text-[var(--c-bg)] shadow-[0_8px_16px_rgba(85,85,231,0.2)]' : 'bg-[var(--c-border)]/20 border-[var(--c-border)]/40 text-white hover:bg-[var(--c-border)]/40'}`}>
                  {t('projects.modal.usdFull')}
                </button>
              </div>
            </div>
          </div>

          {error && (
            <div className="px-8 pb-2">
              <div className="flex items-center gap-2 px-4 py-3 bg-[#E11919]/10 border border-[#E11919]/20 rounded-xl text-sm text-[#E11919]">
                <Icon icon="lucide:circle-alert" className="w-4 h-4 shrink-0" />
                {error}
              </div>
            </div>
          )}

          <div className="p-8 bg-white/5 border-t border-white/5 flex items-center justify-between">
            <button type="button" onClick={onClose} className="flex items-center gap-2 px-8 py-3.5 bg-[var(--c-bg)] border border-[var(--c-border)]/50 rounded-xl text-[var(--c-muted)] text-sm font-medium hover:text-white transition-all">
              <Icon icon="lucide:x" className="w-5 h-5" />
              {t('projects.modal.cancel')}
            </button>
            <button type="submit" disabled={submitting} className="flex items-center gap-2 px-8 py-3.5 bg-[#06B6D4] rounded-xl text-white text-sm font-medium shadow-[0_8px_16px_rgba(6,182,212,0.2)] hover:bg-[#0891b2] transition-all disabled:opacity-50 disabled:cursor-not-allowed">
              {submitting ? (
                <><Icon icon="lucide:loader-circle" className="w-5 h-5 animate-spin" />{t('projects.modal.saving')}</>
              ) : (
                <><Icon icon="lucide:check" className="w-5 h-5" />{t('projects.modal.create')}</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
