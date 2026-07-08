import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Icon } from '@iconify/react';
import { useTranslation } from 'react-i18next';
import type { Material } from '@smeta/shared';
import { api } from '../lib/api';
import { fmtNumber } from '../lib/format';
import { useCurrency } from '../lib/currency';
import { useCart } from '../lib/cart';

export function MaterialDetail() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const { fmt } = useCurrency();
  const { add } = useCart();
  const navigate = useNavigate();
  const [m, setM] = useState<Material | null>(null);
  const [loading, setLoading] = useState(true);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    api.get<Material>(`/materials/${id}`).then((d) => { if (active) setM(d); }).catch(() => { if (active) setM(null); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id]);

  function addToCart() {
    if (!m) return;
    add({ materialId: m.id, name: m.name, unit: m.unit, priceUzs: m.priceUzs, imageUrl: m.imageUrl });
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1500);
  }

  return (
    <div className="p-4 lg:p-10 max-w-[1000px] mx-auto w-full">
      <Link to="/app/materiallar" className="inline-flex items-center gap-2 text-sm text-[#22D3EE] hover:underline mb-6">
        <Icon icon="lucide:arrow-left" className="w-4 h-4" /> {t('materials.back')}
      </Link>

      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-pulse">
          <div className="h-80 bg-[var(--c-panel)]/50 rounded-2xl" />
          <div className="space-y-4"><div className="h-8 w-2/3 bg-[var(--c-border)]/40 rounded" /><div className="h-4 w-1/3 bg-[var(--c-border)]/40 rounded" /><div className="h-24 bg-[var(--c-border)]/30 rounded" /></div>
        </div>
      ) : !m ? (
        <div className="glass-panel rounded-2xl p-16 text-center">
          <Icon icon="lucide:package-x" className="w-14 h-14 text-[#5555E7]/60 mb-4 mx-auto" />
          <h3 className="text-lg font-bold text-white">{t('materials.notFound')}</h3>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="glass-panel rounded-2xl overflow-hidden h-80 lg:h-full min-h-[320px] flex items-center justify-center">
            {m.imageUrl ? (
              <img src={m.imageUrl} alt={m.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#5555E7]/30 to-[#06B6D4]/20">
                <Icon icon="lucide:package" className="w-20 h-20 text-white/40" />
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#22D3EE] bg-[#22D3EE]/10 px-2.5 py-1 rounded-full">{m.category}</span>
              <h1 className="text-3xl font-black text-white mt-3">{m.name}</h1>
              <div className="flex items-center gap-4 mt-2 text-sm text-[var(--c-muted)]">
                <span className="flex items-center gap-1.5"><Icon icon="lucide:box" className="w-4 h-4" />{m.provider ?? '—'}</span>
                <span className="flex items-center gap-1.5"><Icon icon="lucide:star" className="w-4 h-4 text-[#F97316]" />{m.rating}</span>
              </div>
            </div>

            <div className="glass-panel rounded-2xl p-5 flex items-end justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--c-muted)] mb-1">{t('materials.priceUnit')}</p>
                <p className="font-oxanium text-3xl font-black text-[#F97316]">{fmt(m.priceUzs)}</p>
                <p className="text-xs text-[var(--c-muted)] mt-1">1 {m.unit}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--c-muted)] mb-1">{t('materials.availability')}</p>
                {m.stock > 0 ? (
                  <span className="text-sm font-bold text-[#10B981] flex items-center justify-end gap-1"><Icon icon="lucide:circle-check" className="w-4 h-4" />{fmtNumber(m.stock)} {m.unit}</span>
                ) : (
                  <span className="text-sm font-bold text-[#E11919]">{t('materials.outOfStock')}</span>
                )}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-bold uppercase tracking-widest text-[var(--c-muted)] mb-2">{t('materials.description')}</h3>
              <p className="text-sm text-[var(--c-muted)] leading-relaxed">{m.description || t('materials.noDescription')}</p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={addToCart}
                className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-bold transition-colors ${added ? 'bg-[#10B981] text-white' : 'bg-[#5555E7] text-white hover:bg-[#4444d6]'}`}
              >
                <Icon icon={added ? 'lucide:check' : 'lucide:shopping-cart'} className="w-4 h-4" />
                {added ? t('materials.added') : t('materials.addToCart')}
              </button>
              <button onClick={() => { addToCart(); navigate('/app/savat'); }} className="px-6 py-3.5 bg-[#FF6B1A] text-white rounded-xl text-sm font-bold hover:bg-[#e55a10] transition-colors">
                {t('cart.checkout')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
