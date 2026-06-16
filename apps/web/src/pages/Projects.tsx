import { useEffect, useState, useCallback } from 'react';
import { Icon } from '@iconify/react';
import { api, ApiError } from '../lib/api';
import { fmtMoney, fmtDate, projectStatus } from '../lib/format';
import type { Project } from '@smeta/shared';

export function Projects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState('');
  const [modalOpen, setModalOpen] = useState(false);

  const fetchProjects = useCallback(async (query: string) => {
    setLoading(true);
    setError(null);
    try {
      const path = query.trim()
        ? `/projects?q=${encodeURIComponent(query.trim())}`
        : '/projects';
      const data = await api.get<Project[]>(path);
      setProjects(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Loyihalarni yuklashda xatolik');
      setProjects([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Boshlang'ich yuklash
  useEffect(() => {
    fetchProjects('');
  }, [fetchProjects]);

  // Qidiruv (debounce)
  useEffect(() => {
    const t = setTimeout(() => fetchProjects(q), 350);
    return () => clearTimeout(t);
  }, [q, fetchProjects]);

  function initials(name?: string | null): string {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/);
    return (parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '');
  }

  return (
    <div className="p-4 lg:p-10 max-w-7xl mx-auto w-full space-y-8">
      {/* Page Title & Actions */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <Icon icon="lucide:briefcase" className="w-8 h-8 text-[#FF6B1A]" />
            <h1 className="font-display text-3xl font-extrabold text-white tracking-tight">Loyihalar Boshqaruvi</h1>
          </div>
          <p className="text-[#BCC0C7] max-w-2xl">Barcha faol smeta va qurilish loyihalarini kuzatish va tahlil qilish.</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex p-1 bg-[#343841]/30 border border-[#343841]/40 rounded-xl backdrop-blur-sm">
            <button className="flex items-center gap-2 px-4 py-1.5 bg-[#343841] rounded-lg text-white text-sm font-medium">
              <Icon icon="lucide:layout-grid" className="w-4 h-4" />
              Karta
            </button>
            <button className="flex items-center gap-2 px-4 py-1.5 text-white/70 hover:text-white text-sm font-medium transition-colors">
              <Icon icon="lucide:table" className="w-4 h-4" />
              Jadval
            </button>
          </div>
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-2 px-6 py-2.5 bg-[#FF6B1A] hover:bg-[#FF6B1A]/90 text-white rounded-xl font-bold text-sm shadow-[0_0_20px_rgba(255,107,26,0.2)] transition-all active:scale-95"
          >
            <Icon icon="lucide:plus" className="w-5 h-5" />
            Yangi loyiha
          </button>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="p-4 bg-[#191B1F]/20 border border-[#343841]/30 rounded-2xl backdrop-blur-xl flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Icon icon="lucide:search" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#BCC0C7]" />
          <input
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Loyiha nomi yoki mijoz bo'yicha qidirish..."
            className="w-full bg-[#16181D]/50 border border-[#343841]/40 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:border-[#5555E7]/50 transition-colors text-white placeholder:text-[#BCC0C7]/60"
          />
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 px-4 py-2.5 bg-[#16181D] border border-[#343841]/50 rounded-xl text-sm font-medium hover:bg-[#16181D]/80 transition-colors">
            <Icon icon="lucide:sliders-horizontal" className="w-4 h-4" />
            Filtrlar
          </button>
          <button className="p-2.5 hover:bg-white/5 rounded-xl transition-colors">
            <Icon icon="lucide:ellipsis-vertical" className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Project Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-64 bg-[#191B1F]/40 border border-white/5 rounded-2xl animate-pulse backdrop-blur-3xl"
            />
          ))}
        </div>
      ) : error ? (
        <div className="p-10 bg-[#191B1F]/40 border border-[#E11919]/20 rounded-2xl text-center space-y-4 backdrop-blur-3xl">
          <Icon icon="lucide:triangle-alert" className="w-10 h-10 text-[#E11919] mx-auto" />
          <p className="text-[#BCC0C7]">{error}</p>
          <button
            onClick={() => fetchProjects(q)}
            className="px-5 py-2 bg-[#343841] hover:bg-[#343841]/70 rounded-xl text-sm font-medium text-white transition-colors"
          >
            Qayta urinish
          </button>
        </div>
      ) : projects.length === 0 ? (
        <div className="p-12 bg-[#191B1F]/40 border border-white/5 rounded-2xl text-center space-y-5 backdrop-blur-3xl">
          <div className="w-16 h-16 bg-[#FF6B1A]/10 rounded-2xl flex items-center justify-center mx-auto">
            <Icon icon="lucide:folder-open" className="w-8 h-8 text-[#FF6B1A]" />
          </div>
          <div className="space-y-1.5">
            <h3 className="text-lg font-bold text-white">Hozircha loyihalar yo'q</h3>
            <p className="text-sm text-[#BCC0C7] max-w-md mx-auto">
              {q.trim()
                ? "Qidiruvga mos loyiha topilmadi. Boshqa kalit so'z bilan urinib ko'ring."
                : 'Birinchi smeta loyihangizni yaratib, hisob-kitobni boshlang.'}
            </p>
          </div>
          <button
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#FF6B1A] hover:bg-[#FF6B1A]/90 text-white rounded-xl font-bold text-sm shadow-[0_0_20px_rgba(255,107,26,0.2)] transition-all active:scale-95"
          >
            <Icon icon="lucide:plus" className="w-5 h-5" />
            Yangi loyiha
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {projects.map((project) => {
            const st = projectStatus(project.status);
            return (
              <div
                key={project.id}
                className="group relative bg-[#191B1F]/40 border border-white/5 rounded-2xl p-6 shadow-2xl backdrop-blur-3xl card-hover-effect overflow-hidden"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <input type="checkbox" className="w-4 h-4 rounded border-[#565d6d] bg-white accent-[#5555E7]" />
                    <span className="text-[10px] font-bold tracking-wider text-[#BCC0C7] uppercase">{project.code}</span>
                  </div>
                  <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${st.cls}`}>
                    {st.label}
                  </span>
                </div>

                <div className="space-y-1 mb-4">
                  <h3 className="text-lg font-bold text-white leading-tight group-hover:text-[#5555E7] transition-colors">{project.title}</h3>
                  <p className="text-sm text-[#BCC0C7]">{project.clientName}</p>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-[#BCC0C7] uppercase">
                      <Icon icon="lucide:trending-up" className="w-3 h-3 text-[#22D3EE]" />
                      Tahminiy qiymat
                    </div>
                    <div className="text-sm font-semibold text-white">{fmtMoney(project.value, project.currency)}</div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-[#BCC0C7] uppercase">
                      <Icon icon="lucide:calendar" className="w-3 h-3 text-[#F97316]" />
                      Muddat
                    </div>
                    <div className="text-sm font-semibold text-white">{fmtDate(project.deadline)}</div>
                  </div>
                </div>

                <div className="space-y-2 mb-6">
                  <div className="flex justify-between text-[12px]">
                    <span className="text-[#BCC0C7]">Progress</span>
                    <span className="font-bold text-[#22D3EE]">{project.progress}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-[#efeffd] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#5555E7] rounded-full transition-all duration-500"
                      style={{ width: `${project.progress}%` }}
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-[#343841]/20 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {project.manager?.avatarUrl ? (
                      <img src={project.manager.avatarUrl} alt={project.manager.fullName} className="w-6 h-6 rounded-full object-cover" />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-[#5555E7]/20 border border-[#5555E7]/30 flex items-center justify-center text-[10px] font-bold text-[#5555E7] uppercase">
                        {initials(project.manager?.fullName)}
                      </div>
                    )}
                    <span className="text-[12px] text-[#BCC0C7]">{project.manager?.fullName ?? 'Tayinlanmagan'}</span>
                  </div>
                  <span className="text-[10px] font-semibold px-3 py-1 bg-[#343841]/50 rounded-full text-[#BCC0C7]">
                    {project.category}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {!loading && !error && projects.length > 0 && (
        <div className="pt-6 border-t border-[#343841]/20 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-[#BCC0C7]">
            Jami {projects.length} tadan 1-{projects.length} gacha ko'rsatilmoqda
          </p>
          <div className="flex items-center gap-2">
            <button className="px-3 py-1.5 bg-[#16181D] border border-[#343841]/40 rounded-lg text-sm font-medium opacity-50 cursor-not-allowed">Oldingi</button>
            <button className="w-8 h-8 bg-[#343841] rounded-lg text-sm font-medium text-white">1</button>
            <button className="px-3 py-1.5 bg-[#16181D] border border-[#343841]/40 rounded-lg text-sm font-medium opacity-50 cursor-not-allowed">Keyingi</button>
          </div>
        </div>
      )}

      {/* New Project Modal */}
      {modalOpen && (
        <NewProjectModal
          onClose={() => setModalOpen(false)}
          onCreated={() => {
            setModalOpen(false);
            fetchProjects(q);
          }}
        />
      )}
    </div>
  );
}

function NewProjectModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [title, setTitle] = useState('');
  const [clientName, setClientName] = useState('');
  const [category, setCategory] = useState('');
  const [value, setValue] = useState('');
  const [currency, setCurrency] = useState<'UZS' | 'USD'>('UZS');
  const [deadline, setDeadline] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError('Loyiha nomini kiriting');
      return;
    }
    if (!clientName.trim()) {
      setError('Buyurtmachi nomini kiriting');
      return;
    }
    const numValue = Number(value);
    if (!value || Number.isNaN(numValue) || numValue < 0) {
      setError("Tahminiy qiymat to'g'ri son bo'lishi kerak");
      return;
    }

    setSubmitting(true);
    try {
      await api.post<Project>('/projects', {
        title: title.trim(),
        clientName: clientName.trim(),
        category: category.trim(),
        value: numValue,
        currency,
        deadline: deadline || null,
      });
      onCreated();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Loyihani yaratishda xatolik');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8 bg-[#16181D]/60 backdrop-blur-md"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-[#191B1F]/40 border border-white/10 rounded-2xl shadow-2xl backdrop-blur-[40px] overflow-hidden flex flex-col max-h-full"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-8 bg-white/5 border-b border-white/5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-[#F97316]/10 rounded-xl flex items-center justify-center shrink-0">
                <Icon icon="lucide:plus" className="w-6 h-6 text-[#F97316]" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white font-display">Yangi loyiha yaratish</h2>
                <p className="text-sm text-[#BCC0C7] mt-1">Loyiha parametrlarini sozlang va hisob-kitobni boshlang</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="self-start md:self-center p-2 hover:bg-white/5 rounded-lg transition-colors text-[#BCC0C7] hover:text-white"
            >
              <Icon icon="lucide:x" className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 p-8 overflow-y-auto custom-scrollbar grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Form Fields */}
            <div className="space-y-6">
              <div className="space-y-2.5">
                <label className="text-sm font-medium text-[#BCC0C7]">Loyiha nomi</label>
                <div className="relative flex items-center bg-[#343841]/20 border border-[#343841]/40 rounded-xl px-4 py-3 focus-within:border-[#22D3EE]/50 transition-all">
                  <Icon icon="lucide:folder" className="w-4 h-4 text-[#BCC0C7]/60 mr-3 shrink-0" />
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Masalan: Golden House kvartira ta'miri"
                    className="bg-transparent border-none outline-none text-sm text-white w-full placeholder:text-[#BCC0C7]/50"
                  />
                </div>
              </div>

              <div className="space-y-2.5">
                <label className="text-sm font-medium text-[#BCC0C7]">Buyurtmachi (Mijoz)</label>
                <div className="relative flex items-center bg-[#343841]/20 border border-[#343841]/40 rounded-xl px-4 py-3 focus-within:border-[#22D3EE]/50 transition-all">
                  <Icon icon="lucide:user" className="w-4 h-4 text-[#BCC0C7]/60 mr-3 shrink-0" />
                  <input
                    type="text"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder="Ism yoki Kompaniya nomi"
                    className="bg-transparent border-none outline-none text-sm text-white w-full placeholder:text-[#BCC0C7]/50"
                  />
                </div>
              </div>

              <div className="space-y-2.5">
                <label className="text-sm font-medium text-[#BCC0C7]">Kategoriya</label>
                <div className="relative flex items-center bg-[#343841]/20 border border-[#343841]/40 rounded-xl px-4 py-3 focus-within:border-[#22D3EE]/50 transition-all">
                  <Icon icon="lucide:tag" className="w-4 h-4 text-[#BCC0C7]/60 mr-3 shrink-0" />
                  <input
                    type="text"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="Masalan: Ko'p qavatli bino"
                    className="bg-transparent border-none outline-none text-sm text-white w-full placeholder:text-[#BCC0C7]/50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2.5">
                  <label className="text-sm font-medium text-[#BCC0C7]">Tahminiy qiymat</label>
                  <div className="relative flex items-center bg-[#343841]/20 border border-[#343841]/40 rounded-xl px-4 py-3 focus-within:border-[#22D3EE]/50 transition-all">
                    <Icon icon="lucide:trending-up" className="w-4 h-4 text-[#22D3EE]/70 mr-3 shrink-0" />
                    <input
                      type="number"
                      min="0"
                      value={value}
                      onChange={(e) => setValue(e.target.value)}
                      placeholder="0"
                      className="bg-transparent border-none outline-none text-sm text-white w-full placeholder:text-[#BCC0C7]/50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                  </div>
                </div>
                <div className="space-y-2.5">
                  <label className="text-sm font-medium text-[#BCC0C7]">Muddat</label>
                  <div className="relative flex items-center bg-[#343841]/20 border border-[#343841]/40 rounded-xl px-4 py-3 focus-within:border-[#22D3EE]/50 transition-all">
                    <Icon icon="lucide:calendar" className="w-4 h-4 text-[#F97316]/70 mr-3 shrink-0" />
                    <input
                      type="date"
                      value={deadline}
                      onChange={(e) => setDeadline(e.target.value)}
                      className="bg-transparent border-none outline-none text-sm text-white w-full placeholder:text-[#BCC0C7]/50 [color-scheme:dark]"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Currency Settings Card */}
            <div className="bg-[#0C0C55]/10 border border-[#5555E7]/20 rounded-2xl p-6 flex flex-col gap-4 h-fit">
              <div className="flex items-center gap-3">
                <Icon icon="lucide:wallet" className="w-5 h-5 text-[#5555E7]" />
                <span className="text-base font-semibold text-[#5555E7]">Valyuta sozlamalari</span>
              </div>
              <p className="text-xs leading-relaxed text-[#BCC0C7]">
                Smeta hisob-kitoblari asosiy valyutada amalga oshiriladi. Keyinchalik USD/UZS kursini yangilashingiz mumkin.
              </p>
              <div className="grid grid-cols-2 gap-3 mt-2">
                <button
                  type="button"
                  onClick={() => setCurrency('UZS')}
                  className={`py-3.5 rounded-xl text-sm font-medium transition-all duration-200 border-2 ${
                    currency === 'UZS'
                      ? 'bg-[#5555E7] border-[#5555E7] text-[#16181D] shadow-[0_8px_16px_rgba(85,85,231,0.2)]'
                      : 'bg-[#343841]/20 border-[#343841]/40 text-white hover:bg-[#343841]/40'
                  }`}
                >
                  UZS (So'm)
                </button>
                <button
                  type="button"
                  onClick={() => setCurrency('USD')}
                  className={`py-3.5 rounded-xl text-sm font-medium transition-all duration-200 border-2 ${
                    currency === 'USD'
                      ? 'bg-[#5555E7] border-[#5555E7] text-[#16181D] shadow-[0_8px_16px_rgba(85,85,231,0.2)]'
                      : 'bg-[#343841]/20 border-[#343841]/40 text-white hover:bg-[#343841]/40'
                  }`}
                >
                  USD (Dollar)
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

          {/* Modal Footer */}
          <div className="p-8 bg-white/5 border-t border-white/5 flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="flex items-center gap-2 px-8 py-3.5 bg-[#16181D] border border-[#343841]/50 rounded-xl text-[#BCC0C7] text-sm font-medium hover:text-white transition-all"
            >
              <Icon icon="lucide:x" className="w-5 h-5" />
              Bekor qilish
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 px-8 py-3.5 bg-[#06B6D4] rounded-xl text-white text-sm font-medium shadow-[0_8px_16px_rgba(6,182,212,0.2)] hover:bg-[#0891b2] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <Icon icon="lucide:loader-circle" className="w-5 h-5 animate-spin" />
                  Saqlanmoqda...
                </>
              ) : (
                <>
                  <Icon icon="lucide:check" className="w-5 h-5" />
                  Yaratish
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
