import { useEffect, useState } from 'react';
import { Icon } from '@iconify/react';
import { useTranslation } from 'react-i18next';
import type { Vendor } from '@smeta/shared';
import { api, ApiError } from '../lib/api';
import { fmtDate } from '../lib/format';
import { Spinner } from './Stats';

export function Vendors() {
  const { t } = useTranslation();
  const [vendors, setVendors] = useState<Vendor[] | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [created, setCreated] = useState<{ login: string; password: string } | null>(null);

  function load() {
    api.get<Vendor[]>('/vendors').then(setVendors).catch(() => setVendors([]));
  }
  useEffect(() => { load(); }, []);

  async function toggleBlock(v: Vendor) {
    await api.patch(`/vendors/${v.id}`, { status: v.status === 'ACTIVE' ? 'BLOCKED' : 'ACTIVE' });
    load();
  }
  async function resetPw(v: Vendor) {
    const pw = prompt(t('vendors.resetTitle'));
    if (!pw) return;
    await api.patch(`/vendors/${v.id}`, { password: pw });
    alert(`${v.login} — ${pw}`);
  }
  async function remove(v: Vendor) {
    if (!confirm(t('vendors.confirmDelete', { name: v.name }))) return;
    await api.delete(`/vendors/${v.id}`);
    load();
  }

  if (!vendors) return <Spinner />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white font-display tracking-tight">{t('vendors.title')}</h1>
          <p className="text-[#BCC0C7] mt-1">{t('vendors.subtitle')}</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 px-5 py-2.5 bg-[#5555E7] hover:bg-[#4444d6] text-white rounded-xl text-sm font-bold">
          <Icon icon="lucide:plus" className="w-4 h-4" /> {t('vendors.add')}
        </button>
      </div>

      {created && (
        <div className="glass-panel rounded-2xl p-4 border border-[#10B981]/30 bg-[#10B981]/5 flex items-center justify-between gap-3">
          <div className="text-sm text-[#BCC0C7]">
            <span className="text-white font-semibold">{created.login}</span> · {t('vendors.modal.password')}: <span className="font-mono text-[#10B981]">{created.password}</span>
          </div>
          <button onClick={() => setCreated(null)} className="text-[#BCC0C7] hover:text-white"><Icon icon="lucide:x" className="w-4 h-4" /></button>
        </div>
      )}

      <div className="glass-panel rounded-2xl overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-[#16181D]/30 border-b border-[#343841]/40">
                {[t('vendors.name'), t('vendors.shop'), t('vendors.login'), t('vendors.phone'), t('vendors.products'), t('vendors.status'), t('vendors.actions')].map((h) => (
                  <th key={h} className="px-5 py-4 text-[10px] font-bold uppercase tracking-widest text-[#BCC0C7] whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#343841]/30">
              {vendors.map((v) => (
                <tr key={v.id} className="hover:bg-white/5">
                  <td className="px-5 py-4 text-sm font-medium text-white whitespace-nowrap">{v.name}</td>
                  <td className="px-5 py-4 text-sm text-[#BCC0C7] whitespace-nowrap">{v.shopName ?? '—'}</td>
                  <td className="px-5 py-4 text-sm text-[#BCC0C7] whitespace-nowrap">{v.login}</td>
                  <td className="px-5 py-4 text-sm text-[#BCC0C7] whitespace-nowrap">{v.phone ?? '—'}</td>
                  <td className="px-5 py-4 text-sm text-[#BCC0C7] whitespace-nowrap">{v.productCount ?? 0}</td>
                  <td className="px-5 py-4 whitespace-nowrap">
                    <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${v.status === 'ACTIVE' ? 'text-[#10B981] bg-[#10B981]/10 border-[#10B981]/20' : 'text-[#E11919] bg-[#E11919]/10 border-[#E11919]/20'}`}>
                      {v.status === 'ACTIVE' ? t('common.active') : t('common.blocked')}
                    </span>
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap">
                    <div className="flex gap-1">
                      <button onClick={() => toggleBlock(v)} title={v.status === 'ACTIVE' ? t('vendors.block') : t('vendors.unblock')} className="w-9 h-9 inline-flex items-center justify-center rounded-lg text-[#F97316] hover:bg-[#F97316]/10"><Icon icon={v.status === 'ACTIVE' ? 'lucide:ban' : 'lucide:circle-check'} className="w-4 h-4" /></button>
                      <button onClick={() => resetPw(v)} title={t('vendors.resetPw')} className="w-9 h-9 inline-flex items-center justify-center rounded-lg text-[#22D3EE] hover:bg-[#22D3EE]/10"><Icon icon="lucide:key-round" className="w-4 h-4" /></button>
                      <button onClick={() => remove(v)} title={t('common.delete')} className="w-9 h-9 inline-flex items-center justify-center rounded-lg text-[#E11919] hover:bg-[#E11919]/10"><Icon icon="lucide:trash-2" className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {vendors.length === 0 && (
                <tr><td colSpan={7} className="px-5 py-12 text-center text-[#BCC0C7]"><Icon icon="lucide:store" className="w-8 h-8 mx-auto mb-2 opacity-40" />{t('vendors.none')}</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showAdd && <AddVendorModal onClose={() => setShowAdd(false)} onDone={(login, password) => { setShowAdd(false); setCreated({ login, password }); load(); }} />}
    </div>
  );
}

function AddVendorModal({ onClose, onDone }: { onClose: () => void; onDone: (login: string, password: string) => void }) {
  const { t } = useTranslation();
  const [f, setF] = useState({ name: '', shopName: '', phone: '', login: '', password: '', logoUrl: '' });
  const [err, setErr] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setSaving(true);
    try {
      await api.post('/vendors', {
        name: f.name, shopName: f.shopName || null, phone: f.phone || null,
        login: f.login, password: f.password, logoUrl: f.logoUrl || null,
      });
      onDone(f.login, f.password);
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
          <h3 className="text-xl font-bold text-white font-display">{t('vendors.modal.title')}</h3>
          <button type="button" onClick={onClose} className="w-9 h-9 inline-flex items-center justify-center rounded-lg text-[#BCC0C7] hover:text-white hover:bg-white/5"><Icon icon="lucide:x" className="w-5 h-5" /></button>
        </div>
        {err && <div className="px-4 py-2.5 bg-[#E11919]/10 border border-[#E11919]/30 rounded-lg text-[#ff6b6b] text-sm">{err}</div>}
        <Field label={t('vendors.modal.name')} value={f.name} onChange={(v) => setF({ ...f, name: v })} ph={t('vendors.modal.namePh')} req inp={inp} />
        <Field label={t('vendors.modal.shop')} value={f.shopName} onChange={(v) => setF({ ...f, shopName: v })} ph={t('vendors.modal.shopPh')} inp={inp} />
        <Field label={t('vendors.modal.phone')} value={f.phone} onChange={(v) => setF({ ...f, phone: v })} ph="+998 90 123 45 67" inp={inp} />
        <Field label={t('vendors.modal.login')} value={f.login} onChange={(v) => setF({ ...f, login: v })} ph={t('vendors.modal.loginPh')} req inp={inp} />
        <Field label={t('vendors.modal.password')} value={f.password} onChange={(v) => setF({ ...f, password: v })} ph={t('vendors.modal.passwordPh')} req inp={inp} />
        <Field label={t('vendors.modal.logo')} value={f.logoUrl} onChange={(v) => setF({ ...f, logoUrl: v })} ph="https://..." inp={inp} />
        <button disabled={saving} className="w-full py-3 bg-[#5555E7] hover:bg-[#4444d6] text-white font-bold rounded-xl disabled:opacity-60">
          {saving ? t('common.saving') : t('vendors.modal.create')}
        </button>
      </form>
    </div>
  );
}

function Field({ label, value, onChange, ph, req, inp }: { label: string; value: string; onChange: (v: string) => void; ph?: string; req?: boolean; inp: string }) {
  return (
    <div className="space-y-1.5">
      <label className="text-[12px] text-[#BCC0C7]">{label}</label>
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={ph} required={req} className={inp} />
    </div>
  );
}
