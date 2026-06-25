import { useEffect, useState } from 'react';
import { Icon } from '@iconify/react';
import { api, ApiError } from '../lib/api';
import { fmtMoney, fmtDate } from '../lib/format';
import { Payment } from '../lib/payments';
import PaymentModal from '../components/PaymentModal';

type Currency = 'UZS' | 'USD';

interface RealtorRef { id: string; name: string; phone: string | null }

interface Sale {
  id: string;
  unitName: string;
  buyerName: string;
  buyerPhone: string | null;
  area: number;
  price: number;
  paid: number;
  currency: Currency;
  soldAt: string;
  realtorId: string | null;
  commissionAmount: number;
  realtor: RealtorRef | null;
  payments: Payment[];
  lastPaymentAt: string | null;
}
interface CurTotals { paid: number; remaining: number; commission: number }
interface SalesData {
  sales: Sale[];
  totalsByCurrency: Record<string, CurTotals>;
  count: number;
}

export function Sales() {
  const [data, setData] = useState<SalesData | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [cur, setCur] = useState<Currency>('UZS'); // statistika valyutasi (Task 3)
  const [query, setQuery] = useState(''); // honadon bo'yicha filtr
  const [sort, setSort] = useState<'soldAt' | 'lastPayment'>('soldAt');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [payFor, setPayFor] = useState<Sale | null>(null);

  async function load() {
    const params = new URLSearchParams();
    if (query.trim()) params.set('unit', query.trim());
    if (sort === 'lastPayment') params.set('sort', 'lastPayment');
    const qs = params.toString();
    setData(await api.get<SalesData>(`/sales${qs ? `?${qs}` : ''}`));
  }
  // Filtr/saralash o'zgarganda qayta yuklash (qidiruv uchun yengil debounce)
  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [query, sort]);

  async function remove(id: string, unit: string) {
    if (!confirm(`"${unit}" sotuvini o'chirilsinmi? Barcha to'lovlar tarixi ham o'chadi.`)) return;
    await api.delete(`/sales/${id}`);
    load();
  }

  const totals: CurTotals = data?.totalsByCurrency[cur] ?? { paid: 0, remaining: 0, commission: 0 };
  const availableCurrencies = Object.keys(data?.totalsByCurrency ?? {});

  return (
    <div className="p-4 lg:p-10 max-w-[1280px] mx-auto w-full space-y-8">
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

      {/* Statistika + valyuta selektori (Task 3) */}
      <div className="space-y-4">
        <div className="flex items-center justify-end gap-2">
          <span className="text-xs text-[#BCC0C7]">Valyuta:</span>
          <div className="flex bg-[#343841]/40 border border-[#343841]/40 rounded-xl p-1">
            {(['UZS', 'USD'] as Currency[]).map((c) => (
              <button
                key={c}
                onClick={() => setCur(c)}
                className={`px-4 py-1 text-xs font-bold rounded-lg transition-colors ${cur === c ? 'bg-[#191B1F] text-white shadow-sm' : 'text-[#BCC0C7]'}`}
              >
                {c}{availableCurrencies.includes(c) ? '' : ' ·'}
              </button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard label="Sotilgan honadonlar" value={`${data?.count ?? 0} ta`} icon="lucide:building" color="text-[#5555E7]" />
          <StatCard label={`Kelgan pul (${cur})`} value={fmtMoney(totals.paid, cur)} icon="lucide:wallet" color="text-[#10B981]" />
          <StatCard label={`Qoldiq (${cur})`} value={fmtMoney(totals.remaining, cur)} icon="lucide:clock" color="text-[#F97316]" />
        </div>
      </div>

      {/* Filtr paneli */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Icon icon="lucide:search" className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#BCC0C7]" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Honadon raqami / nomi bo'yicha qidirish..."
            className="w-full bg-[#16181D] border border-[#343841]/50 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white outline-none focus:border-[#FF6B1A]/50"
          />
        </div>
        <div className="flex bg-[#343841]/40 border border-[#343841]/40 rounded-xl p-1">
          <button onClick={() => setSort('soldAt')} className={`px-4 py-1.5 text-xs font-semibold rounded-lg ${sort === 'soldAt' ? 'bg-[#191B1F] text-white' : 'text-[#BCC0C7]'}`}>Sotilgan sana</button>
          <button onClick={() => setSort('lastPayment')} className={`px-4 py-1.5 text-xs font-semibold rounded-lg ${sort === 'lastPayment' ? 'bg-[#191B1F] text-white' : 'text-[#BCC0C7]'}`}>Oxirgi to'lov</button>
        </div>
      </div>

      {/* Jadval */}
      <div className="glass-panel rounded-2xl overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-[#16181D]/30 border-b border-[#343841]/40">
                {['', 'Honadon', 'Xaridor', 'Maydon', 'Narxi', "To'langan", 'Qoldiq', 'Makler', "Oxirgi to'lov", ''].map((h, i) => (
                  <th key={i} className="px-4 py-4 text-[10px] font-bold uppercase tracking-widest text-[#BCC0C7] whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#343841]/30">
              {data?.sales.map((x) => {
                const rem = x.price - x.paid;
                const isOpen = expanded === x.id;
                const lastPay = x.payments.length ? x.payments[x.payments.length - 1] : null;
                return (
                  <FragmentRow key={x.id}>
                    <tr className="hover:bg-white/5">
                      <td className="px-4 py-4">
                        <button onClick={() => setExpanded(isOpen ? null : x.id)} className="w-11 h-11 inline-flex items-center justify-center rounded-lg hover:bg-white/10 text-[#BCC0C7]" title="To'lovlar tarixi">
                          <Icon icon={isOpen ? 'lucide:chevron-down' : 'lucide:chevron-right'} className="w-4 h-4" />
                        </button>
                      </td>
                      <td className="px-4 py-4 text-sm font-medium text-white whitespace-nowrap">{x.unitName}</td>
                      <td className="px-4 py-4 text-sm whitespace-nowrap">
                        <div className="text-[#BCC0C7]">{x.buyerName}</div>
                        {x.buyerPhone && <div className="text-[11px] text-[#7A7F8A] flex items-center gap-1"><Icon icon="lucide:phone" className="w-3 h-3" />{x.buyerPhone}</div>}
                      </td>
                      <td className="px-4 py-4 text-sm text-[#BCC0C7] whitespace-nowrap">{x.area ? `${x.area} m²` : '—'}</td>
                      <td className="px-4 py-4 text-sm font-semibold text-white whitespace-nowrap">{fmtMoney(x.price, x.currency)}</td>
                      <td className="px-4 py-4 text-sm font-semibold text-[#10B981] whitespace-nowrap">{fmtMoney(x.paid, x.currency)}</td>
                      <td className={`px-4 py-4 text-sm font-semibold whitespace-nowrap ${rem > 0 ? 'text-[#F97316]' : 'text-[#10B981]'}`}>{rem > 0 ? fmtMoney(rem, x.currency) : "To'liq"}</td>
                      <td className="px-4 py-4 text-sm text-[#BCC0C7] whitespace-nowrap">
                        {x.realtor ? (
                          <div>
                            <div className="text-white">{x.realtor.name}</div>
                            <div className="text-[11px] text-[#F97316]">{fmtMoney(x.commissionAmount, x.currency)}</div>
                          </div>
                        ) : '—'}
                      </td>
                      <td className="px-4 py-4 text-sm text-[#BCC0C7] whitespace-nowrap">
                        {x.lastPaymentAt ? (
                          <div>
                            <div>{fmtDate(x.lastPaymentAt)}</div>
                            {lastPay?.location && <div className="text-[11px] text-[#7A7F8A]">{lastPay.location}</div>}
                          </div>
                        ) : '—'}
                      </td>
                      <td className="px-4 py-4 text-right whitespace-nowrap">
                        <button onClick={() => setPayFor(x)} className="w-11 h-11 inline-flex items-center justify-center rounded-lg text-[#FF6B1A] hover:bg-[#FF6B1A]/10" title="To'lovlarni boshqarish"><Icon icon="lucide:receipt-text" className="w-4 h-4" /></button>
                        <button onClick={() => remove(x.id, x.unitName)} className="w-11 h-11 inline-flex items-center justify-center rounded-lg text-[#E11919] hover:bg-[#E11919]/10" title="O'chirish"><Icon icon="lucide:trash-2" className="w-4 h-4" /></button>
                      </td>
                    </tr>
                    {isOpen && (
                      <tr className="bg-[#16181D]/40">
                        <td colSpan={10} className="px-6 py-4">
                          <PaymentHistory payments={x.payments} currency={x.currency} onAdd={() => setPayFor(x)} />
                        </td>
                      </tr>
                    )}
                  </FragmentRow>
                );
              })}
              {data && data.sales.length === 0 && (
                <tr><td colSpan={10} className="px-5 py-12 text-center text-[#BCC0C7]"><Icon icon="lucide:hand-coins" className="w-8 h-8 mx-auto mb-2 opacity-40" />{query ? 'Filtrga mos sotuv topilmadi' : "Hozircha sotuvlar yo'q"}</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showAdd && <AddModal onClose={() => setShowAdd(false)} onDone={() => { setShowAdd(false); load(); }} />}
      {payFor && (
        <PaymentModal
          saleId={payFor.id}
          unitName={payFor.unitName}
          currency={payFor.currency}
          onClose={() => setPayFor(null)}
          onUpdated={load}
        />
      )}
    </div>
  );
}

// React.Fragment'ni key bilan ishlatish uchun kichik yordamchi
function FragmentRow({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

// Bo'lib-bo'lib to'lovlar tarixi — vaqt bo'yicha o'sish tartibida (chronological)
function PaymentHistory({ payments, currency, onAdd }: { payments: Payment[]; currency: Currency; onAdd: () => void }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-bold uppercase tracking-widest text-[#BCC0C7] flex items-center gap-2">
          <Icon icon="lucide:history" className="w-4 h-4" /> To'lovlar tarixi
        </h4>
        <button onClick={onAdd} className="text-xs font-semibold text-[#FF6B1A] hover:underline flex items-center gap-1">
          <Icon icon="lucide:plus" className="w-3.5 h-3.5" /> To'lov qo'shish
        </button>
      </div>
      {payments.length === 0 ? (
        <p className="text-sm text-[#7A7F8A]">Hali to'lov kiritilmagan.</p>
      ) : (
        <div className="border border-[#343841]/40 rounded-xl overflow-hidden bg-[#191B1F]/40">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[10px] uppercase tracking-widest text-[#7A7F8A]">
                <th className="text-left px-4 py-2">#</th>
                <th className="text-left px-4 py-2">Sana</th>
                <th className="text-left px-4 py-2">Summa</th>
                <th className="text-left px-4 py-2">Qayerda</th>
                <th className="text-left px-4 py-2">Usul</th>
                <th className="text-left px-4 py-2">Izoh</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#343841]/30">
              {payments.map((p, i) => (
                <tr key={p.id}>
                  <td className="px-4 py-2 text-[#7A7F8A]">{i + 1}</td>
                  <td className="px-4 py-2 text-[#BCC0C7]">{fmtDate(p.paidAt)}</td>
                  <td className="px-4 py-2 font-semibold text-[#10B981]">{fmtMoney(Number(p.amount), p.currency)}</td>
                  <td className="px-4 py-2 text-[#BCC0C7]">{p.location || '—'}</td>
                  <td className="px-4 py-2 text-[#BCC0C7]">{p.method || '—'}</td>
                  <td className="px-4 py-2 text-[#BCC0C7]">{p.note || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
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
  const [f, setF] = useState({ unitName: '', buyerName: '', buyerPhone: '', area: '', price: '', paid: '', currency: 'UZS' as Currency, realtorId: '', commissionAmount: '' });
  const [realtors, setRealtors] = useState<RealtorRef[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get<{ realtors: RealtorRef[] }>('/realtors').then((r) => setRealtors(r.realtors)).catch(() => {});
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setSaving(true);
    try {
      await api.post('/sales', {
        unitName: f.unitName,
        buyerName: f.buyerName,
        buyerPhone: f.buyerPhone || undefined,
        area: Number(f.area) || 0,
        price: Number(f.price) || 0,
        paid: Number(f.paid) || 0,
        currency: f.currency,
        realtorId: f.realtorId || undefined,
        commissionAmount: f.realtorId ? Number(f.commissionAmount) || 0 : 0,
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
      <form onClick={(e) => e.stopPropagation()} onSubmit={submit} className="w-full max-w-md bg-[#191B1F] border border-[#343841]/60 rounded-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto custom-scrollbar">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold text-white font-display">Yangi sotuv</h3>
          <button type="button" onClick={onClose} aria-label="Yopish" className="w-11 h-11 -mr-2 inline-flex items-center justify-center rounded-lg text-[#BCC0C7] hover:text-white hover:bg-white/5"><Icon icon="lucide:x" className="w-5 h-5" /></button>
        </div>
        {err && <div className="px-4 py-2.5 bg-[#E11919]/10 border border-[#E11919]/30 rounded-lg text-[#ff6b6b] text-sm">{err}</div>}
        <div className="space-y-1.5">
          <label className="text-[12px] text-[#BCC0C7]">Honadon (raqami/nomi)</label>
          <input value={f.unitName} onChange={(e) => setF({ ...f, unitName: e.target.value })} required placeholder="12-honadon" className={inp} />
        </div>
        <div className="flex gap-3">
          <div className="flex-1 space-y-1.5">
            <label className="text-[12px] text-[#BCC0C7]">Xaridor</label>
            <input value={f.buyerName} onChange={(e) => setF({ ...f, buyerName: e.target.value })} required placeholder="F.I.O." className={inp} />
          </div>
          <div className="flex-1 space-y-1.5">
            <label className="text-[12px] text-[#BCC0C7]">Telefon</label>
            <input value={f.buyerPhone} onChange={(e) => setF({ ...f, buyerPhone: e.target.value })} placeholder="+998 90 123 45 67" className={inp} />
          </div>
        </div>
        <div className="flex gap-3">
          <div className="flex-1 space-y-1.5">
            <label className="text-[12px] text-[#BCC0C7]">Maydon (m²)</label>
            <input type="number" value={f.area} onChange={(e) => setF({ ...f, area: e.target.value })} placeholder="65" className={inp} />
          </div>
          <div className="w-28 space-y-1.5">
            <label className="text-[12px] text-[#BCC0C7]">Valyuta</label>
            <select value={f.currency} onChange={(e) => setF({ ...f, currency: e.target.value as Currency })} className={inp}>
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
            <label className="text-[12px] text-[#BCC0C7]">Boshlang'ich to'lov</label>
            <input type="number" value={f.paid} onChange={(e) => setF({ ...f, paid: e.target.value })} placeholder="200000000" className={inp} />
          </div>
        </div>
        {/* Makler (ixtiyoriy) — Task 4 */}
        <div className="space-y-1.5">
          <label className="text-[12px] text-[#BCC0C7]">Makler (ixtiyoriy)</label>
          <select value={f.realtorId} onChange={(e) => setF({ ...f, realtorId: e.target.value })} className={inp}>
            <option value="">— Maklersiz —</option>
            {realtors.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>
        </div>
        {f.realtorId && (
          <div className="space-y-1.5">
            <label className="text-[12px] text-[#BCC0C7]">Makler komissiyasi ({f.currency})</label>
            <input type="number" value={f.commissionAmount} onChange={(e) => setF({ ...f, commissionAmount: e.target.value })} placeholder="5000000" className={inp} />
          </div>
        )}
        <button disabled={saving} className="w-full py-3 bg-[#FF6B1A] hover:bg-[#FF6B1A]/90 text-white font-bold rounded-xl disabled:opacity-60">
          {saving ? 'Saqlanmoqda...' : "Qo'shish"}
        </button>
      </form>
    </div>
  );
}
