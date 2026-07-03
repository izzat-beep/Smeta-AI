import { useEffect, useMemo, useRef, useState } from 'react';
import { Icon } from '@iconify/react';
import { useTranslation } from 'react-i18next';
import { api, ApiError } from '../lib/api';
import { fmtMoney } from '../lib/format';

type Currency = 'UZS' | 'USD';
interface Row { id: number; name: string; amount: string }

const DEFAULT_ROWS: Row[] = [
  { id: 1, name: '', amount: '' },
  { id: 2, name: '', amount: '' },
];

interface ExpensesResponse {
  items: { id: number; label: string; amount: number }[];
  currency: Currency;
}

// Umumiy harajatlar — xarajat qatorlarini (nomi + summa) qo'shib/o'chirib ketadi,
// jami summa avtomatik hisoblanadi. Ma'lumot SERVERGA (tenant profiliga) saqlanadi,
// shuning uchun boshqa qurilmadan kirilganda ham ko'rinadi.
export function GeneralExpenses() {
  const { t } = useTranslation();
  const [currency, setCurrency] = useState<Currency>('UZS');
  const [rows, setRows] = useState<Row[]>(DEFAULT_ROWS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const nextId = useRef(3);

  // Serverdan yuklash (boshqa qurilmalarda ham bir xil ko'rinadi)
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const data = await api.get<ExpensesResponse>('/expenses');
        if (!active) return;
        if (data.items.length) {
          const loaded = data.items.map((it, i) => ({ id: i + 1, name: it.label, amount: String(it.amount) }));
          setRows(loaded);
          nextId.current = loaded.length + 1;
          setCurrency(data.currency === 'USD' ? 'USD' : 'UZS');
        }
      } catch {
        /* yuklab bo'lmadi — standart bo'sh qatorlar qoladi */
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  // Float precision xatolaridan qochish uchun summani CENTda (butun son) hisoblaymiz.
  // Masalan 100.10 + 0.10: float'da 100.19999... bo'lardi; centda 10010 + 10 = 10020 → 100.20.
  const total = useMemo(
    () => rows.reduce((cents, r) => cents + Math.round((parseFloat(r.amount) || 0) * 100), 0) / 100,
    [rows],
  );

  function update(id: number, patch: Partial<Row>) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
    setSaved(false);
  }
  function addRow() {
    setRows((prev) => [...prev, { id: nextId.current++, name: '', amount: '' }]);
    setSaved(false);
  }
  function removeRow(id: number) {
    setRows((prev) => (prev.length > 1 ? prev.filter((r) => r.id !== id) : prev));
    setSaved(false);
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      await api.post('/expenses', {
        currency,
        rows: rows.map((r) => ({ name: r.name, amount: r.amount })),
      });
      setSaved(true);
      window.setTimeout(() => setSaved(false), 2500);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Saqlashda xatolik yuz berdi');
    } finally {
      setSaving(false);
    }
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
            <h3 className="font-display font-bold text-lg text-white">{t('expenses.title')}</h3>
            <p className="text-[12px] text-[#BCC0C7]">{t('expenses.subtitle')}</p>
          </div>
        </div>
        <div className="flex bg-[#343841]/40 border border-[#343841]/40 rounded-xl p-1">
          {(['UZS', 'USD'] as Currency[]).map((c) => (
            <button key={c} type="button" onClick={() => { setCurrency(c); setSaved(false); }} className={`px-3 py-1.5 text-xs font-bold rounded-lg ${currency === c ? 'bg-[#191B1F] text-white' : 'text-[#BCC0C7]'}`}>{c}</button>
          ))}
        </div>
      </div>

      {/* Qatorlar */}
      <div className={`space-y-2.5 ${loading ? 'opacity-50' : ''}`}>
        {rows.map((r, i) => (
          <div key={r.id} className="flex items-center gap-2.5">
            <span className="w-6 text-center text-xs text-[#7A7F8A] shrink-0">{i + 1}</span>
            <input
              value={r.name}
              onChange={(e) => update(r.id, { name: e.target.value })}
              placeholder={t('expenses.namePh')}
              className={`${inp} flex-1 min-w-0`}
            />
            <input
              type="number"
              value={r.amount}
              onChange={(e) => update(r.id, { amount: e.target.value })}
              placeholder={t('expenses.amountPh')}
              className={`${inp} w-28 sm:w-40`}
            />
            <button
              type="button"
              onClick={() => removeRow(r.id)}
              disabled={rows.length <= 1}
              className="w-10 h-10 inline-flex items-center justify-center rounded-lg text-[#E11919] hover:bg-[#E11919]/10 disabled:opacity-30 disabled:cursor-not-allowed shrink-0"
              title={t('expenses.removeRow')}
              aria-label={t('expenses.removeRow')}
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
        <Icon icon="lucide:plus" className="w-4 h-4" /> {t('expenses.addRow')}
      </button>

      {/* Avtomatik jami summa */}
      <div className="flex items-center justify-between pt-4 border-t border-[#343841]/40">
        <span className="text-sm font-bold text-white">{t('expenses.total')}</span>
        <span className="text-2xl font-display font-black text-[#FF6B1A]">{fmtMoney(total, currency)}</span>
      </div>

      {error && (
        <div className="px-4 py-2.5 bg-[#E11919]/10 border border-[#E11919]/30 rounded-lg text-[#ff6b6b] text-sm">{error}</div>
      )}

      {/* Saqlash — serverga (tenant profiliga) saqlaydi */}
      <button
        type="button"
        onClick={handleSave}
        disabled={saving || loading}
        className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-60 ${
          saved
            ? 'bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30'
            : 'bg-[#FF6B1A] hover:bg-[#FF6B1A]/90 text-white'
        }`}
      >
        <Icon icon={saving ? 'lucide:loader' : saved ? 'lucide:check' : 'lucide:save'} className={`w-4 h-4 ${saving ? 'animate-spin' : ''}`} />
        {saving ? t('common.saving') : saved ? t('common.saved') : t('common.save')}
      </button>
    </div>
  );
}
