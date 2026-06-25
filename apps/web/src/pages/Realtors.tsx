import { useEffect, useState } from 'react';
import { Icon } from '@iconify/react';
import { api, ApiError } from '../lib/api';
import { fmtMoney, fmtDate } from '../lib/format';

type Currency = 'UZS' | 'USD';

interface Realtor {
  id: string;
  name: string;
  phone: string | null;
  salesCount: number;
  totalsByCurrency: Record<string, { commission: number; sales: number }>;
  createdAt: string;
}
interface RealtorSale {
  id: string;
  unitName: string;
  buyerName: string;
  price: number;
  currency: Currency;
  commissionAmount: number;
  soldAt: string;
  realtor: { id: string; name: string } | null;
}

export function Realtors() {
  const [realtors, setRealtors] = useState<Realtor[]>([]);
  const [sales, setSales] = useState<RealtorSale[]>([]);
  const [cur, setCur] = useState<Currency>('UZS');
  const [edit, setEdit] = useState<Realtor | 'new' | null>(null);

  async function load() {
    const [r, s] = await Promise.all([
      api.get<{ realtors: Realtor[] }>('/realtors'),
      api.get<{ sales: RealtorSale[] }>('/sales'),
    ]);
    setRealtors(r.realtors);
    setSales(s.sales.filter((x) => x.realtor)); // faqat makler orqali sotilganlar
  }
  useEffect(() => { load(); }, []);

  async function removeRealtor(id: string, name: string) {
    if (!confirm(`"${name}" makleri o'chirilsinmi? (Sotuvlardagi bog'lanish bekor qilinadi)`)) return;
    await api.delete(`/realtors/${id}`);
    load();
  }

  const totalCommission = realtors.reduce((sum, r) => sum + (r.totalsByCurrency[cur]?.commission ?? 0), 0);

  return (
    <div className="p-4 lg:p-10 max-w-[1280px] mx-auto w-full space-y-8">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <Icon icon="lucide:user-round-cog" className="w-8 h-8 text-[#FF6B1A]" />
            <h1 className="font-display text-3xl font-extrabold text-white tracking-tight">Maklerlar</h1>
          </div>
          <p className="text-[#BCC0C7]">Makler/realtorlar orqali sotilgan uylar va komissiyalar.</p>
        </div>
        <button onClick={() => setEdit('new')} className="flex items-center gap-2 px-6 py-2.5 bg-[#FF6B1A] hover:bg-[#FF6B1A]/90 text-white rounded-xl font-bold text-sm shadow-[0_0_20px_rgba(255,107,26,0.2)]">
          <Icon icon="lucide:plus" className="w-5 h-5" /> Makler qo'shish
        </button>
      </div>

      {/* Statistika + valyuta */}
      <div className="space-y-4">
        <div className="flex items-center justify-end gap-2">
          <span className="text-xs text-[#BCC0C7]">Valyuta:</span>
          <div className="flex bg-[#343841]/40 border border-[#343841]/40 rounded-xl p-1">
            {(['UZS', 'USD'] as Currency[]).map((c) => (
              <button key={c} onClick={() => setCur(c)} className={`px-4 py-1 text-xs font-bold rounded-lg ${cur === c ? 'bg-[#191B1F] text-white shadow-sm' : 'text-[#BCC0C7]'}`}>{c}</button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard label="Maklerlar" value={`${realtors.length} ta`} icon="lucide:users" color="text-[#5555E7]" />
          <StatCard label="Makler orqali sotuvlar" value={`${sales.length} ta`} icon="lucide:home" color="text-[#10B981]" />
          <StatCard label={`Umumiy komissiya (${cur})`} value={fmtMoney(totalCommission, cur)} icon="lucide:badge-percent" color="text-[#F97316]" />
        </div>
      </div>

      {/* Maklerlar ro'yxati */}
      <div>
        <h2 className="text-sm font-bold uppercase tracking-widest text-[#BCC0C7] mb-3">Maklerlar ro'yxati</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {realtors.map((r) => (
            <div key={r.id} className="glass-panel rounded-2xl p-5 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-white font-bold">{r.name}</h3>
                  {r.phone && <p className="text-[12px] text-[#BCC0C7] flex items-center gap-1"><Icon icon="lucide:phone" className="w-3 h-3" />{r.phone}</p>}
                </div>
                <div className="flex gap-1">
                  <button onClick={() => setEdit(r)} aria-label="Tahrirlash" className="w-10 h-10 inline-flex items-center justify-center rounded-lg text-[#22D3EE] hover:bg-[#22D3EE]/10"><Icon icon="lucide:pencil" className="w-4 h-4" /></button>
                  <button onClick={() => removeRealtor(r.id, r.name)} aria-label="O'chirish" className="w-10 h-10 inline-flex items-center justify-center rounded-lg text-[#E11919] hover:bg-[#E11919]/10"><Icon icon="lucide:trash-2" className="w-4 h-4" /></button>
                </div>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <span className="text-[#BCC0C7]"><span className="text-white font-semibold">{r.salesCount}</span> ta sotuv</span>
              </div>
              <div className="pt-2 border-t border-[#343841]/40 space-y-1">
                {Object.keys(r.totalsByCurrency).length === 0 ? (
                  <p className="text-[12px] text-[#7A7F8A]">Hozircha komissiya yo'q</p>
                ) : (
                  Object.entries(r.totalsByCurrency).map(([c, t]) => (
                    <div key={c} className="flex justify-between text-[12px]">
                      <span className="text-[#BCC0C7]">Komissiya ({c}):</span>
                      <span className="text-[#F97316] font-semibold">{fmtMoney(t.commission, c as Currency)}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          ))}
          {realtors.length === 0 && (
            <div className="col-span-full glass-panel rounded-2xl p-10 text-center text-[#BCC0C7]">
              <Icon icon="lucide:user-round-plus" className="w-8 h-8 mx-auto mb-2 opacity-40" />
              Hozircha makler qo'shilmagan
            </div>
          )}
        </div>
      </div>

      {/* Maklerlar orqali sotuvlar */}
      <div>
        <h2 className="text-sm font-bold uppercase tracking-widest text-[#BCC0C7] mb-3">Makler orqali sotilgan uylar</h2>
        <div className="glass-panel rounded-2xl overflow-hidden">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-[#16181D]/30 border-b border-[#343841]/40">
                  {['Makler', 'Honadon', 'Xaridor', 'Narxi', 'Komissiya', 'Sana'].map((h) => (
                    <th key={h} className="px-5 py-4 text-[10px] font-bold uppercase tracking-widest text-[#BCC0C7] whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#343841]/30">
                {sales.map((x) => (
                  <tr key={x.id} className="hover:bg-white/5">
                    <td className="px-5 py-4 text-sm font-medium text-white whitespace-nowrap">{x.realtor?.name}</td>
                    <td className="px-5 py-4 text-sm text-[#BCC0C7] whitespace-nowrap">{x.unitName}</td>
                    <td className="px-5 py-4 text-sm text-[#BCC0C7] whitespace-nowrap">{x.buyerName}</td>
                    <td className="px-5 py-4 text-sm font-semibold text-white whitespace-nowrap">{fmtMoney(x.price, x.currency)}</td>
                    <td className="px-5 py-4 text-sm font-semibold text-[#F97316] whitespace-nowrap">{fmtMoney(x.commissionAmount, x.currency)}</td>
                    <td className="px-5 py-4 text-sm text-[#BCC0C7] whitespace-nowrap">{fmtDate(x.soldAt)}</td>
                  </tr>
                ))}
                {sales.length === 0 && (
                  <tr><td colSpan={6} className="px-5 py-12 text-center text-[#BCC0C7]"><Icon icon="lucide:home" className="w-8 h-8 mx-auto mb-2 opacity-40" />Makler orqali sotuvlar yo'q</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {edit && <RealtorModal realtor={edit === 'new' ? null : edit} onClose={() => setEdit(null)} onDone={() => { setEdit(null); load(); }} />}
    </div>
  );
}

function StatCard({ label, value, icon, color }: { label: string; value: string; icon: string; color: string }) {
  return (
    <div className="p-6 glass-panel rounded-2xl">
      <div className="w-10 h-10 bg-[#16181D]/50 border border-[#343841]/50 rounded-xl flex items-center justify-center mb-4">
        <Icon icon={icon} className={`w-5 h-5 ${color}`} />
      </div>
      <p className="text-sm font-medium text-[#BCC0C7]">{label}</p>
      <h3 className={`text-2xl font-bold font-display mt-1 ${color}`}>{value}</h3>
    </div>
  );
}

function RealtorModal({ realtor, onClose, onDone }: { realtor: Realtor | null; onClose: () => void; onDone: () => void }) {
  const [name, setName] = useState(realtor?.name ?? '');
  const [phone, setPhone] = useState(realtor?.phone ?? '');
  const [err, setErr] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setSaving(true);
    try {
      const body = { name, phone: phone || undefined };
      if (realtor) await api.patch(`/realtors/${realtor.id}`, body);
      else await api.post('/realtors', body);
      onDone();
    } catch (e2) {
      setErr(e2 instanceof ApiError ? e2.message : 'Xatolik');
    } finally {
      setSaving(false);
    }
  }
  const inp = 'w-full bg-[#16181D] border border-[#343841]/50 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-[#FF6B1A]/50';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#16181D]/70 backdrop-blur-sm" onClick={onClose}>
      <form onClick={(e) => e.stopPropagation()} onSubmit={submit} className="w-full max-w-md bg-[#191B1F] border border-[#343841]/60 rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold text-white font-display">{realtor ? 'Maklerni tahrirlash' : 'Yangi makler'}</h3>
          <button type="button" onClick={onClose} aria-label="Yopish" className="w-11 h-11 -mr-2 inline-flex items-center justify-center rounded-lg text-[#BCC0C7] hover:text-white hover:bg-white/5"><Icon icon="lucide:x" className="w-5 h-5" /></button>
        </div>
        {err && <div className="px-4 py-2.5 bg-[#E11919]/10 border border-[#E11919]/30 rounded-lg text-[#ff6b6b] text-sm">{err}</div>}
        <div className="space-y-1.5">
          <label className="text-[12px] text-[#BCC0C7]">Ism</label>
          <input value={name} onChange={(e) => setName(e.target.value)} required placeholder="Makler ismi" className={inp} />
        </div>
        <div className="space-y-1.5">
          <label className="text-[12px] text-[#BCC0C7]">Telefon</label>
          <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+998 90 123 45 67" className={inp} />
        </div>
        <button disabled={saving} className="w-full py-3 bg-[#FF6B1A] hover:bg-[#FF6B1A]/90 text-white font-bold rounded-xl disabled:opacity-60">
          {saving ? 'Saqlanmoqda...' : 'Saqlash'}
        </button>
      </form>
    </div>
  );
}
