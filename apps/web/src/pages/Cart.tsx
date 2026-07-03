import { Link, useNavigate } from 'react-router-dom';
import { Icon } from '@iconify/react';
import { useTranslation } from 'react-i18next';
import { useCart } from '../lib/cart';
import { useCurrency } from '../lib/currency';

export function Cart() {
  const { t } = useTranslation();
  const { items, totalUzs, setQty, remove } = useCart();
  const { fmt } = useCurrency();
  const navigate = useNavigate();

  return (
    <div className="p-4 lg:p-10 max-w-[900px] mx-auto w-full space-y-6">
      <div className="flex items-center gap-3">
        <Icon icon="lucide:shopping-cart" className="w-8 h-8 text-[#FF6B1A]" />
        <h1 className="font-display text-3xl font-extrabold text-white tracking-tight">{t('cart.title')}</h1>
        {items.length > 0 && <span className="text-sm text-[#BCC0C7]">{t('cart.count', { count: items.length })}</span>}
      </div>

      {items.length === 0 ? (
        <div className="glass-panel rounded-2xl p-16 text-center space-y-4">
          <Icon icon="lucide:shopping-cart" className="w-14 h-14 text-[#5555E7]/60 mx-auto" />
          <div>
            <h3 className="text-lg font-bold text-white">{t('cart.empty')}</h3>
            <p className="text-sm text-[#BCC0C7] mt-1">{t('cart.emptyDesc')}</p>
          </div>
          <Link to="/app/materiallar" className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#5555E7] text-white rounded-xl text-sm font-bold hover:bg-[#4444d6]">
            <Icon icon="lucide:package" className="w-4 h-4" /> {t('cart.continueShopping')}
          </Link>
        </div>
      ) : (
        <>
          <div className="glass-panel rounded-2xl divide-y divide-[#343841]/30">
            {items.map((it) => (
              <div key={it.materialId} className="flex items-center gap-4 p-4">
                <div className="w-16 h-16 rounded-xl overflow-hidden bg-[#16181D] shrink-0 flex items-center justify-center">
                  {it.imageUrl ? <img src={it.imageUrl} alt={it.name} className="w-full h-full object-cover" /> : <Icon icon="lucide:package" className="w-7 h-7 text-white/30" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-white truncate">{it.name}</p>
                  <p className="text-xs text-[#BCC0C7]">{fmt(it.priceUzs)} / {it.unit}</p>
                </div>
                <div className="flex items-center gap-1 bg-[#16181D] border border-[#343841]/50 rounded-lg">
                  <button onClick={() => setQty(it.materialId, it.qty - 1)} className="w-8 h-8 inline-flex items-center justify-center text-[#BCC0C7] hover:text-white"><Icon icon="lucide:minus" className="w-3.5 h-3.5" /></button>
                  <input
                    type="number"
                    value={it.qty}
                    onChange={(e) => setQty(it.materialId, Number(e.target.value) || 1)}
                    className="w-12 bg-transparent text-center text-sm text-white outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <button onClick={() => setQty(it.materialId, it.qty + 1)} className="w-8 h-8 inline-flex items-center justify-center text-[#BCC0C7] hover:text-white"><Icon icon="lucide:plus" className="w-3.5 h-3.5" /></button>
                </div>
                <div className="w-28 text-right text-sm font-bold text-white hidden sm:block">{fmt(it.priceUzs * it.qty)}</div>
                <button onClick={() => remove(it.materialId)} aria-label={t('cart.remove')} className="w-9 h-9 inline-flex items-center justify-center rounded-lg text-[#E11919] hover:bg-[#E11919]/10 shrink-0"><Icon icon="lucide:trash-2" className="w-4 h-4" /></button>
              </div>
            ))}
          </div>

          <div className="glass-panel rounded-2xl p-6 flex items-center justify-between">
            <span className="text-lg font-bold text-white">{t('cart.total')}</span>
            <span className="text-2xl font-display font-black text-[#FF6B1A]">{fmt(totalUzs)}</span>
          </div>

          <div className="flex justify-end">
            <button onClick={() => navigate('/app/checkout')} className="flex items-center gap-2 px-8 py-3.5 bg-[#FF6B1A] text-white rounded-xl font-bold text-sm shadow-[0_0_20px_rgba(255,107,26,0.2)] hover:bg-[#e55a10]">
              {t('cart.checkout')} <Icon icon="lucide:arrow-right" className="w-4 h-4" />
            </button>
          </div>
        </>
      )}
    </div>
  );
}
