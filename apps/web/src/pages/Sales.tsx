import { useEffect, useState } from 'react';
import { Icon } from '@iconify/react';
import { api, ApiError } from '../lib/api';
import { fmtMoney, fmtDate } from '../lib/format';

interface Sale {
  id: string;
  unitName: string;
  buyerName: string;
  area: number;
  price: number;
  paid: number;
  currency: 'UZS' | 'USD';
  soldAt: string;
}
interface SalesData {
  sales: Sale[];
  totalPrice: number;
  totalPaid: number;
  remaining: number;
  count: number;
}

export function Sales() {
  const [data, setData] = useState<SalesData | null>(null);
  const [showAdd, setShowAdd] = useState(false);

  async function load() {
    setData(await api.get<SalesData>('/sales'));
  }
  useEffect(() => { load(); }, []);

  async function remove(id: string, unit: string) {
    if (!confirm(`"${unit}" sotuvini o'chirilsinmi?`)) return;
    await api.delete(`/sales/${id}`);
    load();
  }

  return (
    <div className="p-4 lg:p-10 max-w-[1200px] mx-auto w-full space-y-8">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <Icon icon="lucide:hand-coins" className="w-8 h-8 text-[#FF6B1A]" />
            <h1 className="font-display text-3xl font-extrabold text-white tracking-tight">Kelgan pullar</h1>
          </div>
          <p className="text-[#BCC0C7]">Sotilgan honadonlar va tushgan to'lovlar.</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 px-6 py-2.5 bg-[#FF6B1A] hover:bg-[#FF6B1A]/90 text-white rounded-xl font-bold text-sm shadow-[0_0_20px_rgba(255,107,26,0.2)]">
          <Icon icon="lucide:plus" className="w-5 h-5" /> Sotuv qo'shish
        </button>
      </div>

      {/* Statistika */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Sotilgan honadonlar" value={`${data?.count ?? 0} ta`} icon="lucide:building" color="text-[#5555E7]" />
        <StatCard label="Kelgan pul (to'langan)" value={fmtMoney(data?.totalPaid ?? 0)} icon="lucide:wallet" color="text-[#10B981]" />
        <StatCard label="Qoldiq (kutilmoqda)" value={fmtMoney(data?.remaining ?? 0)} icon="lucide:clock" color="text-[#F97316]" />
      </div>

      {/* Jadval */}
      <div className="glass-panel rounded-2xl overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-[#16181D]/30 border-b border-[#343841]/40">
                {['Honadon', 'Xaridor', 'Maydon', 'Narxi', "To'langan", 'Qoldiq', 'Sana', ''].map((h) => (
                  <th key={h} className="px-5 py-4 text-[10px] font-bold uppercase tracking-widest text-[#BCC0C7]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#343841]/30">
              {data?.sales.map((x) => {
                const rem = x.price - x.paid;
                return (
                  <tr key={x.id} className="hover:bg-white/5">
                    <td className="px-5 py-4 text-sm font-medium text-white">{x.unitName}</td>
                    <td className="px-5 py-4 text-sm text-[#BCC0C7]">{x.buyerName}</td>
                    <td className="px-5 py-4 text-sm text-[#BCC0C7]">{x.area ? `${x.area} m²` : '—'}</td>
                    <td className="px-5 py-4 text-sm font-semibold text-white">{fmtMoney(x.price, x.currency)}</td>
                    <td className="px-5 py-4 text-sm font-semibold text-[#10B981]">{fmtMoney(x.paid, x.currency)}</td>
                    <td className={`px-5 py-4 text-sm font-semibold ${rem > 0 ? 'text-[#F97316]' : 'text-[#10B981]'}`}>{rem > 0 ? fmtMoney(rem, x.currency) : "To'liq"}</td>
                    <td className="px-5 py-4 text-sm text-[#BCC0C7]">{fmtDate(x.soldAt)}</td>
                    <td className="px-5 py-4 text-right">
                      <button onClick={() => remove(x.id, x.unitName)} className="p-2 rounded-lg text-[#E11919] hover:bg-[#E11919]/10"><Icon icon="lucide:trash-2" className="w-4 h-4" /></button>
                    </td>
                  </tr>
                );
              })}
              {data && data.sales.length === 0 && (
                <tr><td colSpan={8} className="px-5 py-12 text-center text-[#BCC0C7]"><Icon icon="lucide:hand-coins" className="w-8 h-8 mx-auto mb-2 opacity-40" />Hozircha sotuvlar yo'q</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showAdd && <AddModal onClose={() => setShowAdd(false)} onDone={() => { setShowAdd(false); load(); }} />}
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

function AddModal({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const [f, setF] = useState({ unitName: '', buyerName: '', area: '', price: '', paid: '', currency: 'UZS' as 'UZS' | 'USD' });
  const [err, setErr] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setSaving(true);
    try {
      await api.post('/sales', {
        unitName: f.unitName,
        buyerName: f.buyerName,
        area: Number(f.area) || 0,
        price: Number(f.price) || 0,
        paid: Number(f.paid) || 0,
        currency: f.currency,
      });
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
          <h3 className="text-xl font-bold text-white font-display">Yangi sotuv</h3>
          <button type="button" onClick={onClose} className="text-[#BCC0C7] hover:text-white"><Icon icon="lucide:x" className="w-5 h-5" /></button>
        </div>
        {err && <div className="px-4 py-2.5 bg-[#E11919]/10 border border-[#E11919]/30 rounded-lg text-[#ff6b6b] text-sm">{err}</div>}
        <div className="space-y-1.5">
          <label className="text-[12px] text-[#BCC0C7]">Honadon (raqami/nomi)</label>
          <input value={f.unitName} onChange={(e) => setF({ ...f, unitName: e.target.value })} required placeholder="12-honadon" className={inp} />
        </div>
        <div className="space-y-1.5">
          <label className="text-[12px] text-[#BCC0C7]">Xaridor</label>
          <input value={f.buyerName} onChange={(e) => setF({ ...f, buyerName: e.target.value })} required placeholder="F.I.O." className={inp} />
        </div>
        <div className="flex gap-3">
          <div className="flex-1 space-y-1.5">
            <label className="text-[12px] text-[#BCC0C7]">Maydon (m²)</label>
            <input type="number" value={f.area} onChange={(e) => setF({ ...f, area: e.target.value })} placeholder="65" className={inp} />
          </div>
          <div className="w-28 space-y-1.5">
            <label className="text-[12px] text-[#BCC0C7]">Valyuta</label>
            <select value={f.currency} onChange={(e) => setF({ ...f, currency: e.target.value as 'UZS' | 'USD' })} className={inp}>
              <option value="UZS">UZS</option>
              <option value="USD">USD</option>
            </select>
          </div>
        </div>
        <div className="flex gap-3">
          <div className="flex-1 space-y-1.5">
            <label className="text-[12px] text-[#BCC0C7]">Narxi (jami)</label>
            <input type="number" value={f.price} onChange={(e) => setF({ ...f, price: e.target.value })} required placeholder="500000000" className={inp} />
          </div>
          <div className="flex-1 space-y-1.5">
            <label className="text-[12px] text-[#BCC0C7]">To'langan</label>
            <input type="number" value={f.paid} onChange={(e) => setF({ ...f, paid: e.target.value })} placeholder="200000000" className={inp} />
          </div>
        </div>
        <button disabled={saving} className="w-full py-3 bg-[#FF6B1A] hover:bg-[#FF6B1A]/90 text-white font-bold rounded-xl disabled:opacity-60">
          {saving ? 'Saqlanmoqda...' : "Qo'shish"}
        </button>
      </form>
    </div>
  );
}
