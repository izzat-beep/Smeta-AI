import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Icon } from '@iconify/react';
import { useTranslation } from 'react-i18next';
import type { Order, Project } from '@smeta/shared';
import { api, ApiError } from '../lib/api';
import { useCart } from '../lib/cart';
import { useCurrency } from '../lib/currency';

export function Checkout() {
  const { t } = useTranslation();
  const { items, totalUzs, clear } = useCart();
  const { fmt } = useCurrency();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [note, setNote] = useState('');
  // Vazifa 5: xarajat qaysi loyihaga (binoga) yozilsin; '' = umumiy bo'lim
  const [projectId, setProjectId] = useState('');
  const [projects, setProjects] = useState<Project[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.get<Project[]>('/projects').then(setProjects).catch(() => setProjects([]));
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const order = await api.post<Order>('/orders', {
        customerName: name.trim(),
        customerPhone: phone.trim(),
        address: address.trim() || null,
        note: note.trim() || null,
        projectId: projectId || null,
        currency: 'UZS', // savat baza valyutasi
        items: items.map((i) => ({ materialId: i.materialId, name: i.name, unit: i.unit, unitPrice: i.priceUzs, qty: i.qty })),
      });
      clear();
      navigate(`/app/tolov/${order.id}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('checkout.orderError'));
    } finally {
      setSaving(false);
    }
  }

  if (items.length === 0) {
    return (
      <div className="p-4 lg:p-10 max-w-[600px] mx-auto w-full">
        <div className="glass-panel rounded-2xl p-16 text-center space-y-4">
          <Icon icon="lucide:shopping-cart" className="w-14 h-14 text-[#5555E7]/60 mx-auto" />
          <h3 className="text-lg font-bold text-white">{t('checkout.emptyCart')}</h3>
          <Link to="/app/materiallar" className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#5555E7] text-white rounded-xl text-sm font-bold hover:bg-[#4444d6]">
            <Icon icon="lucide:package" className="w-4 h-4" /> {t('cart.continueShopping')}
          </Link>
        </div>
      </div>
    );
  }

  const inp = 'w-full bg-[var(--c-bg)]/50 border border-[var(--c-border)]/50 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-[#5555E7]/50';

  return (
    <div className="p-4 lg:p-10 max-w-[900px] mx-auto w-full space-y-6">
      <Link to="/app/savat" className="inline-flex items-center gap-2 text-sm text-[#22D3EE] hover:underline">
        <Icon icon="lucide:arrow-left" className="w-4 h-4" /> {t('checkout.back')}
      </Link>
      <div>
        <h1 className="font-display text-3xl font-extrabold text-white tracking-tight">{t('checkout.title')}</h1>
        <p className="text-[var(--c-muted)] mt-1">{t('checkout.subtitle')}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <form onSubmit={submit} className="lg:col-span-3 glass-panel rounded-2xl p-6 space-y-4">
          {error && <div className="px-4 py-2.5 bg-[#E11919]/10 border border-[#E11919]/30 rounded-lg text-[#ff6b6b] text-sm">{error}</div>}
          <div className="space-y-1.5">
            <label className="text-[12px] text-[var(--c-muted)]">{t('checkout.name')}</label>
            <input value={name} onChange={(e) => setName(e.target.value)} required minLength={2} placeholder={t('checkout.namePh')} className={inp} />
          </div>
          <div className="space-y-1.5">
            <label className="text-[12px] text-[var(--c-muted)]">{t('checkout.phone')}</label>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} required placeholder={t('checkout.phonePh')} className={inp} />
          </div>
          <div className="space-y-1.5">
            <label className="text-[12px] text-[var(--c-muted)]">{t('checkout.address')}</label>
            <input value={address} onChange={(e) => setAddress(e.target.value)} placeholder={t('checkout.addressPh')} className={inp} />
          </div>
          <div className="space-y-1.5">
            <label className="text-[12px] text-[var(--c-muted)]">{t('checkout.note')}</label>
            <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder={t('checkout.notePh')} rows={2} className={inp} />
          </div>
          {/* Xarajat qaysi loyihaga yozilsin (Vazifa 5) */}
          <div className="space-y-1.5">
            <label className="text-[12px] text-[var(--c-muted)]">{t('checkout.project')}</label>
            <select value={projectId} onChange={(e) => setProjectId(e.target.value)} className={inp}>
              <option value="" className="bg-[var(--c-panel)]">{t('checkout.projectNone')}</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id} className="bg-[var(--c-panel)]">{p.title}</option>
              ))}
            </select>
            <p className="text-[10px] text-[var(--c-muted)]/60">{t('checkout.projectHint')}</p>
          </div>
          <button disabled={saving} className="w-full py-3 bg-[#FF6B1A] hover:bg-[#e55a10] text-white font-bold rounded-xl disabled:opacity-60 flex items-center justify-center gap-2">
            {saving && <Icon icon="lucide:loader" className="w-4 h-4 animate-spin" />}
            {saving ? t('checkout.placing') : t('checkout.placeOrder')}
          </button>
        </form>

        <div className="lg:col-span-2 glass-panel rounded-2xl p-6 h-fit space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-widest text-[var(--c-muted)]">{t('checkout.summary')}</h3>
          <div className="space-y-2">
            {items.map((it) => (
              <div key={it.materialId} className="flex justify-between text-sm">
                <span className="text-[var(--c-muted)] truncate mr-2">{it.name} × {it.qty}</span>
                <span className="text-white font-medium whitespace-nowrap">{fmt(it.priceUzs * it.qty)}</span>
              </div>
            ))}
          </div>
          <div className="pt-4 border-t border-[var(--c-border)]/40 flex justify-between items-center">
            <span className="text-sm font-bold text-white">{t('checkout.total')}</span>
            <span className="text-xl font-display font-black text-[#FF6B1A]">{fmt(totalUzs)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
