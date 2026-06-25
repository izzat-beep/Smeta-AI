import { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import { getPayments, addPayment, deletePayment, Payment } from '@/lib/payments';
import { fmtMoney, fmtDate } from '@/lib/format';

const LOCATIONS = ['Ofis', 'Qurilish maydoni', "Bank o'tkazma", 'Boshqa'];
const METHODS = ['Naqd', 'Karta', "O'tkazma"];

interface Props {
  saleId: string;
  unitName: string;
  currency: 'UZS' | 'USD';
  onClose: () => void;
  onUpdated: () => void; // tashqi ro'yxatni (Sales) yangilash uchun
}

export default function PaymentModal({ saleId, unitName, currency, onClose, onUpdated }: Props) {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [amount, setAmount] = useState('');
  const [location, setLocation] = useState(LOCATIONS[0]);
  const [method, setMethod] = useState(METHODS[0]);
  const [note, setNote] = useState('');
  const [paidAt, setPaidAt] = useState(new Date().toISOString().slice(0, 10));
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    setPayments(await getPayments(saleId)); // xronologik (o'sish) tartibida keladi
    setLoading(false);
  }
  useEffect(() => { load(); }, [saleId]);

  async function handleAdd() {
    if (!amount || Number(amount) <= 0) return;
    setSaving(true);
    try {
      await addPayment(saleId, { amount: Number(amount), currency, location, method, note, paidAt });
      setAmount('');
      setNote('');
      await load();
      onUpdated();
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("To'lov o'chirilsinmi?")) return;
    await deletePayment(id);
    await load();
    onUpdated();
  }

  const total = payments.reduce((sum, p) => sum + Number(p.amount), 0);
  const inp = 'bg-[#16181D] border border-[#343841]/50 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-[#FF6B1A]/50';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#16181D]/70 backdrop-blur-sm" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-2xl bg-[#191B1F] border border-[#343841]/60 rounded-2xl p-6 space-y-5 max-h-[90vh] overflow-y-auto custom-scrollbar">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon icon="lucide:receipt-text" className="w-5 h-5 text-[#FF6B1A]" />
            <h3 className="text-lg font-bold text-white font-display">{unitName} — To'lovlar tarixi</h3>
          </div>
          <button onClick={onClose} aria-label="Yopish" className="w-11 h-11 -mr-2 inline-flex items-center justify-center rounded-lg text-[#BCC0C7] hover:text-white hover:bg-white/5"><Icon icon="lucide:x" className="w-5 h-5" /></button>
        </div>

        {/* Yangi to'lov qo'shish */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5 p-4 bg-[#16181D]/50 border border-[#343841]/40 rounded-xl">
          <input type="number" placeholder="Summa" value={amount} onChange={(e) => setAmount(e.target.value)} className={`${inp} col-span-2 md:col-span-1`} />
          <select value={location} onChange={(e) => setLocation(e.target.value)} className={inp}>
            {LOCATIONS.map((l) => <option key={l} value={l}>{l}</option>)}
          </select>
          <select value={method} onChange={(e) => setMethod(e.target.value)} className={inp}>
            {METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
          <input type="date" value={paidAt} onChange={(e) => setPaidAt(e.target.value)} className={inp} />
          <input placeholder="Izoh (ixtiyoriy)" value={note} onChange={(e) => setNote(e.target.value)} className={`${inp} col-span-2 md:col-span-1`} />
          <button onClick={handleAdd} disabled={saving} className="col-span-2 md:col-span-1 bg-[#FF6B1A] hover:bg-[#FF6B1A]/90 rounded-lg py-2 font-semibold text-white text-sm disabled:opacity-50 flex items-center justify-center gap-1.5">
            <Icon icon="lucide:plus" className="w-4 h-4" /> {saving ? 'Saqlanmoqda...' : "To'lov qo'shish"}
          </button>
        </div>

        {/* Tarix — vaqt bo'yicha o'sish tartibida */}
        <div className="border border-[#343841]/40 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#16181D]/40 text-[10px] uppercase tracking-widest text-[#BCC0C7]">
                <th className="text-left px-4 py-2.5">Sana</th>
                <th className="text-left px-4 py-2.5">Summa</th>
                <th className="text-left px-4 py-2.5">Qayerda</th>
                <th className="text-left px-4 py-2.5">Usul</th>
                <th className="text-left px-4 py-2.5">Izoh</th>
                <th className="px-4 py-2.5"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#343841]/30">
              {loading ? (
                <tr><td colSpan={6} className="px-4 py-6 text-center text-[#BCC0C7]">Yuklanmoqda...</td></tr>
              ) : payments.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-6 text-center text-[#BCC0C7]">Hali to'lov kiritilmagan</td></tr>
              ) : (
                payments.map((p, i) => (
                  <tr key={p.id} className="hover:bg-white/5">
                    <td className="px-4 py-2.5 text-[#BCC0C7]">{i + 1}. {fmtDate(p.paidAt)}</td>
                    <td className="px-4 py-2.5 font-semibold text-[#10B981]">{fmtMoney(Number(p.amount), p.currency)}</td>
                    <td className="px-4 py-2.5 text-[#BCC0C7]">{p.location || '—'}</td>
                    <td className="px-4 py-2.5 text-[#BCC0C7]">{p.method || '—'}</td>
                    <td className="px-4 py-2.5 text-[#BCC0C7]">{p.note || '—'}</td>
                    <td className="px-4 py-2.5 text-right">
                      <button onClick={() => handleDelete(p.id)} aria-label="O'chirish" className="w-10 h-10 inline-flex items-center justify-center rounded-lg text-[#E11919] hover:bg-[#E11919]/10"><Icon icon="lucide:trash-2" className="w-4 h-4" /></button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex justify-end items-center gap-2 text-sm">
          <span className="text-[#BCC0C7]">Jami to'langan:</span>
          <span className="font-bold text-[#10B981] text-base">{fmtMoney(total, currency)}</span>
        </div>
      </div>
    </div>
  );
}
