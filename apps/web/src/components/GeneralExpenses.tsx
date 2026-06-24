import { useMemo, useRef, useState } from 'react';
import { Icon } from '@iconify/react';
import { fmtMoney } from '../lib/format';

type Currency = 'UZS' | 'USD';
interface Row { id: number; name: string; amount: string }

// Umumiy harajatlar — foydalanuvchi ixtiyoriy xarajat qatorlarini (nomi + summa)
// qo'shib/o'chirib ketadi, pastda umumiy summa avtomatik hisoblanadi.
export function GeneralExpenses() {
  const nextId = useRef(3);
  const [currency, setCurrency] = useState<Currency>('UZS');
  const [rows, setRows] = useState<Row[]>([
    { id: 1, name: '', amount: '' },
    { id: 2, name: '', amount: '' },
  ]);

  const total = useMemo(
    () => rows.reduce((sum, r) => sum + (parseFloat(r.amount) || 0), 0),
    [rows],
  );

  function update(id: number, patch: Partial<Row>) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }
  function addRow() {
    setRows((prev) => [...prev, { id: nextId.current++, name: '', amount: '' }]);
  }
  function removeRow(id: number) {
    setRows((prev) => (prev.length > 1 ? prev.filter((r) => r.id !== id) : prev));
  }

  const inp = 'bg-[#16181D] border border-[#343841]/50 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-[#FF6B1A]/50';

  return (
    <div className="bg-[#191B1F]/40 backdrop-blur-3xl border border-[#343841]/40 rounded-2xl p-6 space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-[#FF6B1A]/10 border border-[#FF6B1A]/20 rounded-xl flex items-center justify-center">
            <Icon icon="lucide:wallet" className="w-5 h-5 text-[#FF6B1A]" />
          </div>
          <div>
            <h3 className="font-display font-bold text-lg text-white">Umumiy harajatlar</h3>
            <p className="text-[12px] text-[#BCC0C7]">Qo'shimcha xarajatlarni qator-qator kiriting</p>
          </div>
        </div>
        <div className="flex bg-[#343841]/40 border border-[#343841]/40 rounded-xl p-1">
          {(['UZS', 'USD'] as Currency[]).map((c) => (
            <button key={c} type="button" onClick={() => setCurrency(c)} className={`px-3 py-1 text-xs font-bold rounded-lg ${currency === c ? 'bg-[#191B1F] text-white' : 'text-[#BCC0C7]'}`}>{c}</button>
          ))}
        </div>
      </div>

      {/* Qatorlar */}
      <div className="space-y-2.5">
        {rows.map((r, i) => (
          <div key={r.id} className="flex items-center gap-2.5">
            <span className="w-6 text-center text-xs text-[#7A7F8A] shrink-0">{i + 1}</span>
            <input
              value={r.name}
              onChange={(e) => update(r.id, { name: e.target.value })}
              placeholder="Xarajat nomi (masalan: Transport)"
              className={`${inp} flex-1`}
            />
            <input
              type="number"
              value={r.amount}
              onChange={(e) => update(r.id, { amount: e.target.value })}
              placeholder="Summa"
              className={`${inp} w-40`}
            />
            <button
              type="button"
              onClick={() => removeRow(r.id)}
              disabled={rows.length <= 1}
              className="p-2 rounded-lg text-[#E11919] hover:bg-[#E11919]/10 disabled:opacity-30 disabled:cursor-not-allowed shrink-0"
              title="Qatorni o'chirish"
            >
              <Icon icon="lucide:trash-2" className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={addRow}
        className="w-full py-2.5 border border-dashed border-[#343841] hover:border-[#FF6B1A]/40 text-[#BCC0C7] hover:text-[#FF6B1A] rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-colors"
      >
        <Icon icon="lucide:plus" className="w-4 h-4" /> Qator qo'shish
      </button>

      {/* Avtomatik jami summa */}
      <div className="flex items-center justify-between pt-4 border-t border-[#343841]/40">
        <span className="text-sm font-bold text-white">Umumiy summa:</span>
        <span className="text-2xl font-display font-black text-[#FF6B1A]">{fmtMoney(total, currency)}</span>
      </div>
    </div>
  );
}
