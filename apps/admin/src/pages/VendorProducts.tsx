import { useEffect, useState } from 'react';
import { Icon } from '@iconify/react';
import { useTranslation } from 'react-i18next';
import type { Material } from '@smeta/shared';
import { api, ApiError } from '../lib/api';
import { fmtMoney } from '../lib/format';
import { Spinner } from './Stats';

export function VendorProducts() {
  const { t } = useTranslation();
  const [products, setProducts] = useState<Material[] | null>(null);
  const [edit, setEdit] = useState<Material | 'new' | null>(null);

  function load() {
    api.get<Material[]>('/vendor/products').then(setProducts).catch(() => setProducts([]));
  }
  useEffect(() => { load(); }, []);

  async function toggle(m: Material) {
    await api.patch(`/vendor/products/${m.id}`, { isActive: !m.isActive });
    load();
  }
  async function remove(m: Material) {
    if (!confirm(t('products.confirmDelete', { name: m.name }))) return;
    await api.delete(`/vendor/products/${m.id}`);
    load();
  }

  if (!products) return <Spinner />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white font-display tracking-tight">{t('products.title')}</h1>
          <p className="text-[#BCC0C7] mt-1">{t('products.subtitle')}</p>
        </div>
        <button onClick={() => setEdit('new')} className="flex items-center gap-2 px-5 py-2.5 bg-[#5555E7] hover:bg-[#4444d6] text-white rounded-xl text-sm font-bold">
          <Icon icon="lucide:plus" className="w-4 h-4" /> {t('products.add')}
        </button>
      </div>

      <div className="glass-panel rounded-2xl overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-[#16181D]/30 border-b border-[#343841]/40">
                {[t('products.name'), t('products.category'), t('products.price'), t('products.stock'), t('products.status'), t('products.actions')].map((h) => (
                  <th key={h} className="px-5 py-4 text-[10px] font-bold uppercase tracking-widest text-[#BCC0C7] whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#343841]/30">
              {products.map((m) => (
                <tr key={m.id} className="hover:bg-white/5">
                  <td className="px-5 py-4 text-sm font-medium text-white whitespace-nowrap">{m.name}</td>
                  <td className="px-5 py-4 text-sm text-[#BCC0C7] whitespace-nowrap">{m.category}</td>
                  <td className="px-5 py-4 text-sm text-white whitespace-nowrap">{fmtMoney(m.priceUzs)} <span className="text-[#BCC0C7]">/ {m.unit}</span></td>
                  <td className="px-5 py-4 text-sm text-[#BCC0C7] whitespace-nowrap">{m.stock}</td>
                  <td className="px-5 py-4 whitespace-nowrap">
                    <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${m.isActive ? 'text-[#10B981] bg-[#10B981]/10 border-[#10B981]/20' : 'text-[#BCC0C7] bg-[#343841]/40 border-[#343841]'}`}>
                      {m.isActive ? t('products.active') : t('products.inactive')}
                    </span>
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap">
                    <div className="flex gap-1">
                      <button onClick={() => toggle(m)} title={m.isActive ? t('products.deactivate') : t('products.activate')} className="w-9 h-9 inline-flex items-center justify-center rounded-lg text-[#F97316] hover:bg-[#F97316]/10"><Icon icon={m.isActive ? 'lucide:eye-off' : 'lucide:eye'} className="w-4 h-4" /></button>
                      <button onClick={() => setEdit(m)} title={t('common.edit')} className="w-9 h-9 inline-flex items-center justify-center rounded-lg text-[#22D3EE] hover:bg-[#22D3EE]/10"><Icon icon="lucide:pencil" className="w-4 h-4" /></button>
                      <button onClick={() => remove(m)} title={t('common.delete')} className="w-9 h-9 inline-flex items-center justify-center rounded-lg text-[#E11919] hover:bg-[#E11919]/10"><Icon icon="lucide:trash-2" className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {products.length === 0 && (
                <tr><td colSpan={6} className="px-5 py-12 text-center text-[#BCC0C7]"><Icon icon="lucide:package" className="w-8 h-8 mx-auto mb-2 opacity-40" />{t('products.none')}</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {edit && <ProductModal product={edit === 'new' ? null : edit} onClose={() => setEdit(null)} onDone={() => { setEdit(null); load(); }} />}
    </div>
  );
}

function ProductModal({ product, onClose, onDone }: { product: Material | null; onClose: () => void; onDone: () => void }) {
  const { t } = useTranslation();
  const [f, setF] = useState({
    name: product?.name ?? '',
    category: product?.category ?? '',
    description: product?.description ?? '',
    unit: product?.unit ?? 'dona',
    priceUzs: product ? String(product.priceUzs) : '',
    priceUsd: product ? String(product.priceUsd) : '',
    stock: product ? String(product.stock) : '',
    imageUrl: product?.imageUrl ?? '',
  });
  const [err, setErr] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setSaving(true);
    const body = {
      name: f.name, category: f.category || undefined, description: f.description || null,
      unit: f.unit || 'dona', priceUzs: Number(f.priceUzs) || 0, priceUsd: Number(f.priceUsd) || 0,
      stock: Number(f.stock) || 0, imageUrl: f.imageUrl || null,
    };
    try {
      if (product) await api.patch(`/vendor/products/${product.id}`, body);
      else await api.post('/vendor/products', body);
      onDone();
    } catch (e2) {
      setErr(e2 instanceof ApiError ? e2.message : t('common.error'));
    } finally {
      setSaving(false);
    }
  }
  const inp = 'w-full bg-[#16181D] border border-[#343841]/50 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-[#5555E7]/50';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#16181D]/70 backdrop-blur-sm" onClick={onClose}>
      <form onClick={(e) => e.stopPropagation()} onSubmit={submit} className="w-full max-w-md bg-[#191B1F] border border-[#343841]/60 rounded-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto custom-scrollbar">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold text-white font-display">{product ? t('products.modal.editTitle') : t('products.modal.addTitle')}</h3>
          <button type="button" onClick={onClose} className="w-9 h-9 inline-flex items-center justify-center rounded-lg text-[#BCC0C7] hover:text-white hover:bg-white/5"><Icon icon="lucide:x" className="w-5 h-5" /></button>
        </div>
        {err && <div className="px-4 py-2.5 bg-[#E11919]/10 border border-[#E11919]/30 rounded-lg text-[#ff6b6b] text-sm">{err}</div>}
        <div className="space-y-1.5">
          <label className="text-[12px] text-[#BCC0C7]">{t('products.modal.name')}</label>
          <input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} required placeholder={t('products.modal.namePh')} className={inp} />
        </div>
        <div className="flex gap-3">
          <div className="flex-1 space-y-1.5">
            <label className="text-[12px] text-[#BCC0C7]">{t('products.modal.category')}</label>
            <input value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })} placeholder={t('products.modal.categoryPh')} className={inp} />
          </div>
          <div className="w-24 space-y-1.5">
            <label className="text-[12px] text-[#BCC0C7]">{t('products.modal.unit')}</label>
            <input value={f.unit} onChange={(e) => setF({ ...f, unit: e.target.value })} placeholder="dona" className={inp} />
          </div>
        </div>
        <div className="flex gap-3">
          <div className="flex-1 space-y-1.5">
            <label className="text-[12px] text-[#BCC0C7]">{t('products.modal.priceUzs')}</label>
            <input type="number" value={f.priceUzs} onChange={(e) => setF({ ...f, priceUzs: e.target.value })} placeholder="50000" className={inp} />
          </div>
          <div className="flex-1 space-y-1.5">
            <label className="text-[12px] text-[#BCC0C7]">{t('products.modal.priceUsd')}</label>
            <input type="number" value={f.priceUsd} onChange={(e) => setF({ ...f, priceUsd: e.target.value })} placeholder="4" className={inp} />
          </div>
        </div>
        <div className="flex gap-3">
          <div className="flex-1 space-y-1.5">
            <label className="text-[12px] text-[#BCC0C7]">{t('products.modal.stock')}</label>
            <input type="number" value={f.stock} onChange={(e) => setF({ ...f, stock: e.target.value })} placeholder="100" className={inp} />
          </div>
          <div className="flex-1 space-y-1.5">
            <label className="text-[12px] text-[#BCC0C7]">{t('products.modal.imageUrl')}</label>
            <input value={f.imageUrl} onChange={(e) => setF({ ...f, imageUrl: e.target.value })} placeholder="https://..." className={inp} />
          </div>
        </div>
        <div className="space-y-1.5">
          <label className="text-[12px] text-[#BCC0C7]">{t('products.modal.description')}</label>
          <textarea value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} rows={2} placeholder={t('products.modal.descriptionPh')} className={inp} />
        </div>
        <button disabled={saving} className="w-full py-3 bg-[#5555E7] hover:bg-[#4444d6] text-white font-bold rounded-xl disabled:opacity-60">
          {saving ? t('common.saving') : t('common.save')}
        </button>
      </form>
    </div>
  );
}
