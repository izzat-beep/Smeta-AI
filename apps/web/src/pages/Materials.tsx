import { useEffect, useState } from 'react';
import { Icon } from '@iconify/react';
import { useTranslation } from 'react-i18next';
import { api } from '../lib/api';
import { fmtNumber } from '../lib/format';
import { useCurrency } from '../lib/currency';
import type { Material } from '@smeta/shared';

export function Materials() {
  const { t } = useTranslation();
  const [categories, setCategories] = useState<string[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [activeCategory, setActiveCategory] = useState('Barchasi');

  useEffect(() => {
    api
      .get<string[]>('/materials/categories')
      .then(setCategories)
      .catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const path =
      '/materials?q=' +
      encodeURIComponent(q) +
      '&category=' +
      encodeURIComponent(activeCategory === 'Barchasi' ? '' : activeCategory);
    api
      .get<Material[]>(path)
      .then((data) => {
        if (!cancelled) setMaterials(data);
      })
      .catch(() => {
        if (!cancelled) setMaterials([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [q, activeCategory]);

  const filterBadges = ['Barchasi', ...categories];

  return (
    <div className="p-4 lg:p-10 max-w-[1200px] mx-auto w-full">
      {/* Hero Section */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-10">
        <div className="max-w-xl">
          <h1 className="text-4xl lg:text-5xl font-black mb-4 tracking-tight">
            <span className="text-white">{t('materials.titlePrefix')}</span>
            <span className="text-[#5555E7] font-sans">{t('materials.titleSuffix')}</span>
          </h1>
          <p className="text-base leading-relaxed">{t('materials.heroDesc')}</p>
        </div>
        <div className="flex gap-px bg-white/5 border border-white/5 rounded-2xl overflow-hidden backdrop-blur-xl">
          <div className="px-6 py-4 border-r border-white/5">
            <p className="text-[10px] font-bold uppercase tracking-widest mb-1">{t('materials.totalTypes')}</p>
            <p className="font-oxanium text-2xl font-black text-[#22D3EE]">{fmtNumber(materials.length)}</p>
          </div>
          <div className="px-6 py-4">
            <p className="text-[10px] font-bold uppercase tracking-widest mb-1">{t('materials.updated')}</p>
            <p className="font-oxanium text-2xl font-black text-[#F97316]">{t('common.today')}</p>
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="glass-panel rounded-2xl p-6 mb-10 shadow-2xl">
        <div className="flex flex-col lg:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Icon icon="lucide:search" className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#BCC0C7]" />
            <input
              type="text"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={t('materials.searchPh')}
              className="w-full bg-[#16181D]/50 border border-white/10 rounded-xl py-4 pl-12 pr-4 focus:outline-none focus:border-[#5555E7]/50 transition-colors"
            />
          </div>
          <div className="grid grid-cols-3 gap-2 sm:flex sm:gap-3">
            <button className="flex items-center justify-center gap-2 px-3 sm:px-6 py-3.5 bg-[#16181D]/30 border border-white/10 rounded-xl hover:bg-white/5 transition-colors min-w-0">
              <Icon icon="lucide:arrow-up-down" className="w-5 h-5 text-[#22D3EE] shrink-0" />
              <span className="text-sm font-medium text-white truncate">{t('materials.sort')}</span>
            </button>
            <button className="flex items-center justify-center gap-2 px-3 sm:px-6 py-3.5 bg-[#00F0FF]/10 border border-[#00F0FF]/20 rounded-xl text-[#00F0FF] hover:bg-[#00F0FF]/20 transition-colors min-w-0">
              <Icon icon="lucide:upload" className="w-5 h-5 shrink-0" />
              <span className="text-sm font-medium truncate">{t('materials.import')}</span>
            </button>
            <button className="flex items-center justify-center gap-2 px-3 sm:px-6 py-3.5 bg-[#5555E7] rounded-xl text-white shadow-[0_0_20px_rgba(85,85,231,0.4)] hover:bg-[#4444d6] transition-colors min-w-0">
              <Icon icon="lucide:download" className="w-5 h-5 shrink-0" />
              <span className="text-sm font-bold truncate">{t('materials.export')}</span>
            </button>
          </div>
        </div>

        <div className="flex items-center gap-4 overflow-x-auto pb-2 no-scrollbar">
          <div className="flex items-center gap-2 shrink-0">
            <img src="/assets/materials/IMG_18.svg" alt="" className="w-4 h-4" />
            <span className="text-sm font-medium">{t('materials.filter')}</span>
          </div>
          <div className="flex gap-2">
            {filterBadges.map((label) => (
              <FilterBadge
                key={label}
                label={label === 'Barchasi' ? t('common.all') : label}
                active={activeCategory === label}
                onClick={() => setActiveCategory(label)}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Grid of Materials */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="glass-panel rounded-xl overflow-hidden flex flex-col h-full animate-pulse">
              <div className="h-48 bg-white/5"></div>
              <div className="p-5 flex-1 flex flex-col gap-4">
                <div className="h-5 bg-white/5 rounded w-3/4"></div>
                <div className="h-3 bg-white/5 rounded w-1/2"></div>
                <div className="h-8 bg-white/5 rounded w-2/3 mt-4"></div>
                <div className="h-10 bg-white/5 rounded mt-auto"></div>
              </div>
            </div>
          ))}
        </div>
      ) : materials.length === 0 ? (
        <div className="glass-panel rounded-2xl p-16 mb-16 flex flex-col items-center justify-center text-center">
          <Icon icon="lucide:package-search" className="w-14 h-14 text-[#5555E7]/60 mb-5" />
          <h4 className="text-lg font-bold text-white mb-2">{t('materials.notFoundTitle')}</h4>
          <p className="text-sm max-w-sm">{t('materials.notFoundDesc')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {materials.map((m) => (
            <MaterialCard key={m.id} material={m} />
          ))}
        </div>
      )}

      {/* Promo Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-20">
        <div className="lg:col-span-4 p-8 rounded-2xl bg-gradient-to-br from-[#5555E7]/10 to-transparent border border-[#5555E7]/20 flex flex-col justify-between">
          <div>
            <Icon icon="lucide:zap" className="w-10 h-10 text-[#5555E7] mb-6" />
            <h3 className="text-xl font-black text-white mb-3">{t('materials.quickCalcTitle')}</h3>
            <p className="text-sm leading-relaxed mb-8">{t('materials.quickCalcDesc')}</p>
          </div>
          <button className="w-full py-3 bg-[#16181D] border border-[#5555E7]/50 rounded-xl text-[#5555E7] font-medium hover:bg-[#5555E7]/5 transition-colors">
            {t('materials.goToCalc')}
          </button>
        </div>

        <div className="lg:col-span-8 p-8 rounded-2xl bg-[#191B1F]/40 border border-white/10 relative overflow-hidden flex flex-col lg:flex-row items-center justify-between gap-8">
          <div className="relative z-10 max-w-md">
            <h3 className="text-2xl font-black text-white mb-4">{t('materials.partnerTitle')}</h3>
            <p className="text-base leading-relaxed mb-8">{t('materials.partnerDesc')}</p>
            <div className="flex items-center gap-4">
              <div className="flex -space-x-3">
                {[34, 35, 36, 37].map((n) => (
                  <img
                    key={n}
                    src={`/assets/materials/IMG_${n}.webp`}
                    alt="Partner"
                    className="w-10 h-10 rounded-full border-2 border-[#16181D]"
                  />
                ))}
                <div className="w-10 h-10 rounded-full bg-[#5555E7]/20 border-2 border-[#16181D] flex items-center justify-center text-[10px] font-bold text-[#5555E7]">
                  +12
                </div>
              </div>
              <button className="px-6 py-3 bg-[#06B6D4] rounded-xl text-white font-bold hover:bg-[#05a1bc] transition-colors">
                {t('materials.apply')}
              </button>
            </div>
          </div>
          <div className="absolute right-0 top-0 h-full w-1/3 bg-gradient-to-l from-[#06B6D4]/10 to-transparent pointer-events-none"></div>
          <Icon icon="lucide:layers" className="hidden lg:block absolute -right-10 -bottom-10 w-48 h-48 text-white/5 rotate-12" />
        </div>
      </div>

      {/* Footer */}
      <footer className="pt-16 border-t border-[#343841]/40">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-[#5555E7] rounded-lg flex items-center justify-center">
                <img src="/assets/materials/IMG_11.svg" alt="Logo" className="w-6 h-6" />
              </div>
              <span className="font-oxanium text-2xl font-bold text-[#5555E7]">Smeta AI</span>
            </div>
            <p className="text-sm leading-relaxed max-w-xs">
              Qurilish kompaniyalari va mutaxassislari uchun eng zamonaviy smeta va loyiha boshqaruvi tizimi.
            </p>
          </div>

          <div>
            <h4 className="font-oxanium text-white text-base mb-6">Mahsulot</h4>
            <ul className="space-y-3 text-sm">
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Biz haqimizda
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Xizmatlar
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Yordam
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Maxfiylik siyosati
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-oxanium text-white text-base mb-6">Kompaniya</h4>
            <ul className="space-y-3 text-sm">
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Biz haqimizda
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Blog
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Vakansiyalar
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-oxanium text-white text-base mb-6">Yordam</h4>
            <div className="flex items-center gap-3 mb-6">
              <button className="w-10 h-10 rounded-full border border-[#22D3EE] flex items-center justify-center text-[#22D3EE] hover:bg-[#22D3EE]/10 transition-colors">
                <Icon icon="lucide:message-square" className="w-4.5 h-4.5" />
              </button>
              <span className="text-sm">24/7 Qo'llab-quvvatlash</span>
            </div>
            <p className="text-xs leading-relaxed opacity-60">Toshkent sh., Yunusobod tumani, 12-uy</p>
          </div>
        </div>

        <div className="pt-8 border-t border-[#343841]/40 flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] font-bold tracking-widest uppercase opacity-60 pb-10">
          <span>© 2026 SMETA AI</span>
          <div className="flex gap-8">
            <span>UZS (SO'M)</span>
            <span>USD (DOLLAR)</span>
            <span>METRIC (M/KG)</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FilterBadge({ label, active = false, onClick }: { label: string; active?: boolean; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`px-5 py-2 rounded-xl text-sm font-semibold transition-all shrink-0 ${
        active
          ? 'bg-[#5555E7]/20 border border-[#5555E7] text-[#5555E7] shadow-[0_0_15px_rgba(85,85,231,0.2)]'
          : 'bg-[#16181D]/40 border border-white/5 text-[#BCC0C7] hover:border-white/20'
      }`}
    >
      {label}
    </button>
  );
}

function MaterialCard({ material }: { material: Material }) {
  const { t } = useTranslation();
  const { fmt } = useCurrency();
  const { name, provider, priceUzs, stock, unit, rating, imageUrl } = material;
  return (
    <div className="glass-panel rounded-xl overflow-hidden hover-card-glow flex flex-col h-full">
      <div className="relative h-48 overflow-hidden">
        {imageUrl ? (
          <img src={imageUrl} alt={name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#5555E7]/30 to-[#06B6D4]/20">
            <Icon icon="lucide:package" className="w-14 h-14 text-white/40" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#16181D] to-transparent opacity-60"></div>
        <div className="absolute top-4 right-4 px-2.5 py-0.5 bg-[#16181D]/80 backdrop-blur-md border border-[#22D3EE]/20 rounded-full">
          <span className="text-xs font-bold text-[#22D3EE]">{unit}</span>
        </div>
        <div className="absolute bottom-4 left-4 flex items-center gap-1.5 px-2 py-1 bg-black/40 backdrop-blur-md rounded-lg">
          <Icon icon="lucide:trending-up" className="w-3 h-3 text-[#F97316]" />
          <span className="text-xs text-white">{rating}</span>
        </div>
      </div>

      <div className="p-5 flex-1 flex flex-col">
        <h4 className="text-lg font-bold text-white mb-2 line-clamp-2 leading-tight">{name}</h4>
        <div className="flex items-center gap-2 text-xs mb-6">
          <Icon icon="lucide:box" className="w-3 h-3" />
          <span>{provider ?? '—'}</span>
        </div>

        <div className="flex justify-between items-end mb-6">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest mb-1">{t('materials.priceUnit')}</p>
            <p className="font-oxanium text-xl font-black text-[#F97316] drop-shadow-[0_0_10px_rgba(249,115,22,0.3)]">
              {fmt(priceUzs)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-bold uppercase tracking-widest mb-1">{t('materials.inStock')}</p>
            <div className="flex items-center justify-end gap-1.5">
              <Icon icon="lucide:circle-check" className="w-3 h-3 text-white" />
              <span className="text-sm font-bold text-white">
                {fmtNumber(stock)} {unit}
              </span>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-white/5 flex gap-2">
          <button className="w-10 h-10 flex items-center justify-center bg-[#16181D] border border-white/10 rounded-lg hover:bg-white/5 transition-colors">
            <Icon icon="lucide:info" className="w-4 h-4" />
          </button>
          <button className="flex-1 flex items-center justify-center gap-2 bg-[#5555E7] text-white text-sm font-bold rounded-lg hover:bg-[#4444d6] transition-colors">
            <Icon icon="lucide:plus" className="w-3 h-3" />
            {t('materials.addToProject')}
          </button>
        </div>
      </div>
    </div>
  );
}
