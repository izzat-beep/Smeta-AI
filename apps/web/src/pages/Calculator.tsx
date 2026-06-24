import { useMemo, useState } from 'react';
import { Icon } from '@iconify/react';
import { api, ApiError } from '../lib/api';
import { fmtMoney, fmtNumber } from '../lib/format';
import { GeneralExpenses } from '../components/GeneralExpenses';

type ItemType = 'MATERIAL' | 'LABOR' | 'EQUIPMENT';

interface LineItem {
  name: string;
  type: ItemType;
  qty: number;
  unit: string;
  unitPrice: number;
}

const TAX_RATE = 12;
const USD_RATE = 12600; // 1 USD ≈ so'm (taxminiy kurs)
const USTA_TYPES = ['Suvoq ishi', 'Travertin', 'Shtukaturka', "Bo'yoq ishi", 'Kafel terish', 'Boshqa ish'];

const INITIAL_ITEMS: LineItem[] = [
  { name: 'Sement M400', type: 'MATERIAL', qty: 50, unit: 'qop', unitPrice: 50000 },
  { name: 'Armatura 12mm', type: 'MATERIAL', qty: 1.2, unit: 'tona', unitPrice: 7000000 },
  { name: 'Ish kuchi', type: 'LABOR', qty: 120, unit: 'soat', unitPrice: 25000 },
];

const UNITS = ['m³', 'm²', 'kg'] as const;

export function Calculator() {
  const [items, setItems] = useState<LineItem[]>(INITIAL_ITEMS);

  // Material kiritish maydonlari
  const [matName, setMatName] = useState('');
  const [matQty, setMatQty] = useState('10');
  const [matUnit, setMatUnit] = useState<(typeof UNITS)[number]>('m³');
  const [matPrice, setMatPrice] = useState('0');

  // Mehnat va texnika maydonlari
  const [laborHours, setLaborHours] = useState('120');
  const [laborRate, setLaborRate] = useState('25000');
  const [equipDays, setEquipDays] = useState('2');

  // Usta ishi (m²/m³) — suvoqchi, travertinchi va h.k.
  const [ustaType, setUstaType] = useState(USTA_TYPES[0]);
  const [ustaArea, setUstaArea] = useState('45');
  const [ustaUnit, setUstaUnit] = useState<'m²' | 'm³'>('m²');
  const [ustaRate, setUstaRate] = useState('6');
  const [ustaCur, setUstaCur] = useState<'USD' | 'UZS'>('USD');

  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);

  // Hisob-kitoblar
  const subtotal = useMemo(
    () => items.reduce((s, it) => s + it.qty * it.unitPrice, 0),
    [items],
  );
  const taxAmount = useMemo(() => (subtotal * TAX_RATE) / 100, [subtotal]);
  const total = subtotal + taxAmount;

  const byType = useMemo(() => {
    const acc: Record<ItemType, number> = { MATERIAL: 0, LABOR: 0, EQUIPMENT: 0 };
    for (const it of items) acc[it.type] += it.qty * it.unitPrice;
    return acc;
  }, [items]);

  const pct = (v: number) => (subtotal > 0 ? Math.round((v / subtotal) * 100) : 0);
  const matPct = pct(byType.MATERIAL);
  const laborPct = pct(byType.LABOR);
  const equipPct = pct(byType.EQUIPMENT);

  // Donut uchun conic-gradient
  const donutStyle = {
    background: `conic-gradient(#FF8E4D 0% ${matPct}%, #3DF2FF ${matPct}% ${matPct + laborPct}%, #5555E7 ${matPct + laborPct}% 100%)`,
  };

  function addMaterial() {
    const qty = parseFloat(matQty) || 0;
    const price = parseFloat(matPrice) || 0;
    const name = matName.trim() || 'Material';
    if (qty <= 0) return;
    setItems((prev) => [...prev, { name, type: 'MATERIAL', qty, unit: matUnit, unitPrice: price }]);
    setMatName('');
    setMatQty('10');
    setMatPrice('0');
  }

  function addLaborAndEquipment() {
    const hours = parseFloat(laborHours) || 0;
    const rate = parseFloat(laborRate) || 0;
    const days = parseFloat(equipDays) || 0;
    const next: LineItem[] = [];
    if (hours > 0 && rate > 0) {
      next.push({ name: 'Ish kuchi', type: 'LABOR', qty: hours, unit: 'soat', unitPrice: rate });
    }
    if (days > 0) {
      next.push({ name: 'Maxsus texnika', type: 'EQUIPMENT', qty: days, unit: 'sutka', unitPrice: 800000 });
    }
    if (next.length) setItems((prev) => [...prev, ...next]);
  }

  function addUstaWork() {
    const area = parseFloat(ustaArea) || 0;
    const rate = parseFloat(ustaRate) || 0;
    if (area <= 0 || rate <= 0) return;
    const unitPriceUzs = ustaCur === 'USD' ? rate * USD_RATE : rate;
    const label = ustaCur === 'USD' ? `$${rate}` : `${fmtNumber(rate)} so'm`;
    setItems((prev) => [
      ...prev,
      { name: `${ustaType} (${label}/${ustaUnit})`, type: 'LABOR', qty: area, unit: ustaUnit, unitPrice: unitPriceUzs },
    ]);
  }

  function removeItem(idx: number) {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  }

  async function save() {
    setSaving(true);
    setToast(null);
    try {
      await api.post('/estimates', {
        title: 'Kalkulyator smetasi',
        currency: 'UZS',
        taxRate: TAX_RATE,
        items,
      });
      setToast({ kind: 'ok', text: 'Smeta muvaffaqiyatli saqlandi' });
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Saqlashda xatolik yuz berdi';
      setToast({ kind: 'err', text: msg });
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="p-4 lg:p-8 overflow-y-auto">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-[1400px] mx-auto">
        {/* Left Panel: Inputs */}
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-[#191B1F]/40 backdrop-blur-3xl border border-[#343841]/40 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8.5 h-8.5 bg-[#5555E7]/10 border border-[#5555E7]/20 rounded-xl flex items-center justify-center">
                <img src="/assets/calculator/IMG_14.svg" className="w-4 h-4 text-[#FF6B1A]" alt="Materials" />
              </div>
              <h3 className="font-display font-semibold text-sm tracking-widest text-white/80 uppercase">Materiallar</h3>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-[12px] font-medium mb-2">Material nomi</label>
                <input
                  type="text"
                  value={matName}
                  onChange={(e) => setMatName(e.target.value)}
                  placeholder="Masalan: Beton M300"
                  className="w-full bg-[#343841]/30 border border-[#343841]/40 rounded-xl px-3 py-2 text-sm text-white focus:ring-2 focus:ring-[#5555E7]/50 outline-none transition-all"
                />
              </div>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block text-[12px] font-medium mb-2">Miqdori</label>
                  <input
                    type="number"
                    value={matQty}
                    onChange={(e) => setMatQty(e.target.value)}
                    className="w-full bg-[#343841]/30 border border-[#343841]/40 rounded-xl px-3 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-[#5555E7]/50 transition-all"
                  />
                </div>
                <div className="w-24">
                  <label className="block text-[12px] font-medium mb-2">Birlik</label>
                  <div className="flex bg-[#343841]/30 border border-[#343841]/40 rounded-xl p-1">
                    {UNITS.map((u) => (
                      <button
                        key={u}
                        type="button"
                        onClick={() => setMatUnit(u)}
                        className={`flex-1 py-1 text-[10px] font-bold rounded ${
                          matUnit === u ? 'bg-[#5555E7] text-white shadow-sm' : 'text-white'
                        }`}
                      >
                        {u}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-[12px] font-medium mb-2">Narxi (birlik uchun, UZS)</label>
                <input
                  type="number"
                  value={matPrice}
                  onChange={(e) => setMatPrice(e.target.value)}
                  className="w-full bg-[#343841]/30 border border-[#343841]/40 rounded-xl px-3 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-[#5555E7]/50 transition-all"
                />
              </div>
              <button
                type="button"
                onClick={addMaterial}
                className="w-full py-2.5 border border-[#22D3EE]/30 bg-[#16181D] text-[#22D3EE] rounded-xl text-sm font-medium flex items-center justify-center gap-2 hover:bg-[#22D3EE]/5 transition-colors"
              >
                <img src="/assets/calculator/IMG_15.svg" className="w-4 h-4" alt="Add" />
                Qo'shish
              </button>
            </div>

            <div className="my-8 border-t border-[#343841]/40"></div>

            <div className="flex items-center gap-3 mb-6">
              <div className="w-8.5 h-8.5 bg-[#5555E7]/10 border border-[#5555E7]/20 rounded-xl flex items-center justify-center">
                <img src="/assets/calculator/IMG_16.svg" className="w-4 h-4 text-[#FF6B1A]" alt="Labor" />
              </div>
              <h3 className="font-display font-semibold text-sm tracking-widest text-white/80 uppercase">Mehnat va Texnika</h3>
            </div>

            <div className="space-y-4">
              <InputWithIcon label="Ish kuchi (soat)" icon="/assets/calculator/IMG_17.svg" value={laborHours} onChange={setLaborHours} />
              <InputWithIcon label="Ish haqi (soatiga)" icon="/assets/calculator/IMG_18.svg" value={laborRate} onChange={setLaborRate} prefix="$" />
              <InputWithIcon label="Maxsus texnika (sutka)" icon="/assets/calculator/IMG_19.svg" value={equipDays} onChange={setEquipDays} />
              <button
                type="button"
                onClick={addLaborAndEquipment}
                className="w-full py-2.5 border border-[#22D3EE]/30 bg-[#16181D] text-[#22D3EE] rounded-xl text-sm font-medium flex items-center justify-center gap-2 hover:bg-[#22D3EE]/5 transition-colors"
              >
                <img src="/assets/calculator/IMG_15.svg" className="w-4 h-4" alt="Add" />
                Qo'shish
              </button>
            </div>

            <div className="my-8 border-t border-[#343841]/40"></div>

            {/* Usta ishi — m²/m³ bo'yicha (suvoqchi, travertinchi) */}
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8.5 h-8.5 bg-[#FF6B1A]/10 border border-[#FF6B1A]/20 rounded-xl flex items-center justify-center">
                <Icon icon="lucide:ruler" className="w-4 h-4 text-[#FF6B1A]" />
              </div>
              <h3 className="font-display font-semibold text-sm tracking-widest text-white/80 uppercase">Usta ishi (m²/m³)</h3>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-[12px] font-medium mb-2">Ish turi</label>
                <select
                  value={ustaType}
                  onChange={(e) => setUstaType(e.target.value)}
                  className="w-full bg-[#343841]/30 border border-[#343841]/40 rounded-xl px-3 py-2 text-sm text-white outline-none"
                >
                  {USTA_TYPES.map((t) => (
                    <option key={t} value={t} className="bg-[#191B1F]">{t}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block text-[12px] font-medium mb-2">Maydon</label>
                  <input type="number" value={ustaArea} onChange={(e) => setUstaArea(e.target.value)} className="w-full bg-[#343841]/30 border border-[#343841]/40 rounded-xl px-3 py-2 text-sm text-white outline-none" />
                </div>
                <div className="w-24">
                  <label className="block text-[12px] font-medium mb-2">Birlik</label>
                  <div className="flex bg-[#343841]/30 border border-[#343841]/40 rounded-xl p-1">
                    {(['m²', 'm³'] as const).map((u) => (
                      <button key={u} type="button" onClick={() => setUstaUnit(u)} className={`flex-1 py-1 text-[10px] font-bold rounded ${ustaUnit === u ? 'bg-[#FF6B1A] text-white' : 'text-white'}`}>{u}</button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block text-[12px] font-medium mb-2">Narx (1 {ustaUnit})</label>
                  <input type="number" value={ustaRate} onChange={(e) => setUstaRate(e.target.value)} className="w-full bg-[#343841]/30 border border-[#343841]/40 rounded-xl px-3 py-2 text-sm text-white outline-none" />
                </div>
                <div className="w-24">
                  <label className="block text-[12px] font-medium mb-2">Valyuta</label>
                  <div className="flex bg-[#343841]/30 border border-[#343841]/40 rounded-xl p-1">
                    {(['USD', 'UZS'] as const).map((c) => (
                      <button key={c} type="button" onClick={() => setUstaCur(c)} className={`flex-1 py-1 text-[9px] font-bold rounded ${ustaCur === c ? 'bg-[#FF6B1A] text-white' : 'text-white'}`}>{c}</button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex justify-between text-[11px] px-1">
                <span className="text-[#BCC0C7]">Jami ish haqi:</span>
                <span className="text-[#FF6B1A] font-bold">{fmtMoney((parseFloat(ustaArea) || 0) * (parseFloat(ustaRate) || 0) * (ustaCur === 'USD' ? USD_RATE : 1), 'UZS')}</span>
              </div>
              <button type="button" onClick={addUstaWork} className="w-full py-2.5 border border-[#FF6B1A]/40 bg-[#16181D] text-[#FF6B1A] rounded-xl text-sm font-medium flex items-center justify-center gap-2 hover:bg-[#FF6B1A]/5 transition-colors">
                <Icon icon="lucide:plus" className="w-4 h-4" />
                Usta ishini qo'shish
              </button>
            </div>
          </div>

          <button
            type="button"
            className="w-full py-4 bg-[#FF6B1A] text-white rounded-xl font-bold text-lg shadow-[0_0_20px_rgba(255,107,26,0.3)] flex items-center justify-center gap-4 hover:scale-[1.02] transition-transform active:scale-95"
          >
            <img src="/assets/calculator/IMG_4.svg" className="w-5 h-5" alt="Calc" />
            Hisoblash
          </button>
        </div>

        {/* Center Panel: Stats & Charts */}
        <div className="lg:col-span-6 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard label="Umumiy Qiymat" value={fmtNumber(total)} unit="UZS" gradient="from-[#F97316] to-[#DC2626]" icon="/assets/calculator/IMG_20.svg" />
            <StatCard label="Materiallar" value={fmtNumber(byType.MATERIAL)} unit="UZS" gradient="from-[#06B6D4] to-[#2563EB]" icon="/assets/calculator/IMG_14.svg" />
            <StatCard label="Mehnat kuchi" value={fmtNumber(byType.LABOR)} unit="UZS" gradient="from-[#6366F1] to-[#9333EA]" icon="/assets/calculator/IMG_16.svg" />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex bg-[#191B1F]/40 backdrop-blur-xl border border-[#343841]/40 rounded-xl p-1">
              <button className="px-6 py-1.5 text-sm font-medium bg-[#5555E7]/20 text-[#5555E7] rounded-lg shadow-sm">Xulosa</button>
              <button className="px-6 py-1.5 text-sm font-medium text-[#BCC0C7]">Tafsilotlar</button>
              <button className="px-6 py-1.5 text-sm font-medium text-[#BCC0C7]">Muddatlar</button>
            </div>
            <div className="flex bg-[#343841]/40 border border-[#343841]/40 rounded-xl p-1">
              <button className="px-4 py-1 text-xs font-bold bg-[#191B1F] text-white rounded shadow-sm">UZS</button>
              <button className="px-4 py-1 text-xs font-bold text-[#BCC0C7]">USD</button>
            </div>
          </div>

          <div className="bg-[#191B1F]/40 backdrop-blur-3xl border border-[#343841]/40 rounded-2xl p-8 relative overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
              <div>
                <h3 className="font-display font-bold text-xl text-white">Smeta Strukturasi</h3>
                <p className="text-sm text-[#BCC0C7] mt-1">Xarajatlarning kategoriyalar bo'yicha taqsimlanishi</p>
              </div>
              <div className="px-3 py-1 bg-[#06B6D4]/20 border border-[#06B6D4]/30 rounded-full">
                <span className="text-[12px] font-semibold text-[#22D3EE]">Loyiha: O'zbekiston binosi</span>
              </div>
            </div>

            <div className="flex flex-col lg:flex-row items-center justify-center gap-12 py-4">
              <div className="relative w-64 h-64">
                <div className="w-full h-full rounded-full" style={donutStyle}></div>
                <div className="absolute inset-[18%] rounded-full bg-[#191B1F] flex flex-col items-center justify-center">
                  <span className="text-xs text-[#BCC0C7] uppercase tracking-widest">Jami</span>
                  <span className="text-2xl font-display font-bold text-white">100%</span>
                </div>
              </div>

              <div className="space-y-4 w-full lg:w-48">
                <LegendItem color="bg-[#FF8E4D]" label="Materiallar" percent={`${matPct}%`} />
                <LegendItem color="bg-[#3DF2FF]" label="Mehnat" percent={`${laborPct}%`} />
                <LegendItem color="bg-[#5555E7]" label="Texnika" percent={`${equipPct}%`} />
              </div>
            </div>

            <div className="flex justify-center gap-6 mt-8">
              <div className="flex items-center gap-2">
                <img src="/assets/calculator/IMG_22.svg" className="w-3.5 h-3.5" alt="Dot" />
                <span className="text-xs text-[#FF8E4D]">Materiallar</span>
              </div>
              <div className="flex items-center gap-2">
                <img src="/assets/calculator/IMG_23.svg" className="w-3.5 h-3.5" alt="Dot" />
                <span className="text-xs text-[#3DF2FF]">Mehnat</span>
              </div>
              <div className="flex items-center gap-2">
                <img src="/assets/calculator/IMG_24.svg" className="w-3.5 h-3.5" alt="Dot" />
                <span className="text-xs text-[#5555E7]">Texnika</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel: Summary */}
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-[#191B1F]/40 backdrop-blur-3xl border border-[#343841]/40 rounded-2xl overflow-hidden flex flex-col h-full max-h-[818px]">
            <div className="p-5 bg-white/5 border-b border-[#343841]/40 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <img src="/assets/calculator/IMG_25.svg" className="w-3 h-3 text-[#FF6B1A]" alt="File" />
                <h3 className="font-display font-bold text-sm text-white uppercase">Materiallar Vedomosti</h3>
              </div>
              <div className="px-2.5 py-0.5 border border-[#06B6D4]/30 rounded-full">
                <span className="text-[10px] font-semibold text-[#22D3EE]">{items.length} ta pozitsiya</span>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
              {items.length === 0 ? (
                <div className="text-center text-[12px] text-[#BCC0C7] py-8">Hozircha pozitsiyalar yo'q</div>
              ) : (
                items.map((it, idx) => (
                  <VedomostiItem
                    key={idx}
                    name={it.name}
                    qty={`${fmtNumber(it.qty)} ${it.unit}`}
                    price={fmtMoney(it.qty * it.unitPrice, 'UZS')}
                    onRemove={() => removeItem(idx)}
                  />
                ))
              )}
            </div>

            <div className="p-5 bg-white/5 border-t border-[#343841]/40 space-y-4">
              <div className="flex justify-between text-xs">
                <span className="text-[#BCC0C7]">Soliqlar ({TAX_RATE}%)</span>
                <span className="text-[#BCC0C7]">{fmtMoney(taxAmount, 'UZS')}</span>
              </div>
              <div className="flex justify-between items-end">
                <span className="text-sm font-bold text-white">Yakuniy summa:</span>
                <div className="text-right">
                  <div className="text-xl font-display font-black text-[#FF6B1A]">{fmtNumber(total)}</div>
                  <div className="text-xs font-bold text-[#FF6B1A]">UZS</div>
                </div>
              </div>

              {toast && (
                <div
                  className={`text-[12px] rounded-xl px-3 py-2 border ${
                    toast.kind === 'ok'
                      ? 'text-[#10B981] bg-[#10B981]/10 border-[#10B981]/20'
                      : 'text-[#E11919] bg-[#E11919]/10 border-[#E11919]/20'
                  }`}
                >
                  {toast.text}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 pt-2">
                <button className="py-2.5 bg-[#16181D] border border-[#343841]/60 rounded-xl text-[12px] font-medium text-white flex items-center justify-center gap-2 hover:bg-[#343841]/20 transition-colors">
                  <img src="/assets/calculator/IMG_26.svg" className="w-4 h-4" alt="CSV" />
                  CSV
                </button>
                <button
                  type="button"
                  onClick={save}
                  disabled={saving || items.length === 0}
                  className="py-2.5 bg-[#06B6D4] rounded-xl text-[12px] font-medium text-white flex items-center justify-center gap-2 shadow-[0_8px_16px_rgba(6,182,212,0.2)] hover:scale-[1.02] transition-transform disabled:opacity-50 disabled:hover:scale-100"
                >
                  {saving ? (
                    <Icon icon="lucide:loader" className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <img src="/assets/calculator/IMG_25.svg" className="w-3 h-3" alt="Save" />
                  )}
                  Saqlash
                </button>
              </div>
            </div>
          </div>

          {/* AI Assistant Card */}
          <div className="bg-gradient-to-br from-[#312E81]/40 to-[#164E63]/40 backdrop-blur-3xl border border-[#06B6D4]/20 rounded-2xl p-4">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-9 h-9 bg-[#06B6D4] rounded-xl flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.5)]">
                <img src="/assets/calculator/IMG_4.svg" className="w-5 h-5 text-white" alt="AI" />
              </div>
              <div>
                <h4 className="font-display font-bold text-sm text-white">Smeta AI Yordamchi</h4>
                <p className="text-[10px] text-[#CFFAFE]/70">Xarajatlarni 15% tejashni taklif qiladi</p>
              </div>
            </div>
            <button className="w-full flex items-center justify-center gap-2 text-[12px] font-medium text-[#22D3EE] hover:underline">
              Tahlilni ko'rish
              <img src="/assets/calculator/IMG_27.svg" className="w-3 h-3" alt="Down" />
            </button>
          </div>
        </div>
      </div>

      {/* Umumiy harajatlar — dinamik xarajat qatorlari + avtomatik jami (Task 2) */}
      <div className="max-w-[1400px] mx-auto mt-6">
        <GeneralExpenses />
      </div>
    </main>
  );
}

function InputWithIcon({
  label,
  icon,
  value,
  onChange,
  prefix,
}: {
  label: string;
  icon: string;
  value: string;
  onChange: (v: string) => void;
  prefix?: string;
}) {
  return (
    <div>
      <label className="block text-[12px] font-medium mb-2">{label}</label>
      <div className="relative flex items-center bg-[#343841]/30 border border-[#343841]/40 rounded-xl px-3 py-2">
        <img src={icon} className="w-4 h-4 mr-2 opacity-60" alt="icon" />
        {prefix && <span className="text-sm text-white mr-1">{prefix}</span>}
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-transparent text-sm text-white outline-none"
        />
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  unit,
  gradient,
  icon,
}: {
  label: string;
  value: string;
  unit: string;
  gradient: string;
  icon: string;
}) {
  return (
    <div className="bg-[#191B1F]/40 backdrop-blur-3xl border border-[#343841]/40 rounded-2xl p-5 relative overflow-hidden group hover:border-[#343841] transition-colors">
      <div className="flex justify-between items-start mb-4">
        <div className={`w-9 h-9 bg-gradient-to-br ${gradient} rounded-xl flex items-center justify-center shadow-lg`}>
          <img src={icon} className="w-5 h-5 text-white" alt="icon" />
        </div>
        <div className="px-2 py-0.5 border border-white/10 rounded-full opacity-50">
          <span className="text-[10px] font-semibold text-white">Live</span>
        </div>
      </div>
      <div className="space-y-1">
        <p className="text-[12px] font-medium text-[#BCC0C7]">{label}</p>
        <div className="flex items-baseline gap-1">
          <h4 className="text-2xl font-display font-bold text-white tracking-tight">{value}</h4>
          <span className="text-[10px] font-medium text-[#BCC0C7] uppercase">{unit}</span>
        </div>
      </div>
      <div className="mt-4 h-1 w-full bg-[#343841]/30 rounded-full overflow-hidden">
        <div className={`h-full bg-gradient-to-r ${gradient} w-[70%] rounded-full`}></div>
      </div>
    </div>
  );
}

function LegendItem({ color, label, percent }: { color: string; label: string; percent: string }) {
  return (
    <div className="flex items-center justify-between p-3 bg-[#343841]/20 border border-white/5 rounded-xl">
      <div className="flex items-center gap-3">
        <div className={`w-3 h-3 rounded-full ${color}`}></div>
        <span className="text-sm font-medium text-white">{label}</span>
      </div>
      <span className="text-sm font-bold text-white">{percent}</span>
    </div>
  );
}

function VedomostiItem({
  name,
  qty,
  price,
  onRemove,
}: {
  name: string;
  qty: string;
  price: string;
  onRemove?: () => void;
}) {
  return (
    <div className="p-3 bg-[#343841]/20 border border-white/5 rounded-xl group hover:bg-[#343841]/30 transition-colors">
      <div className="flex justify-between items-start mb-1">
        <span className="text-[12px] font-bold text-white">{name}</span>
        {onRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="text-[#BCC0C7]/50 hover:text-[#E11919] transition-colors opacity-0 group-hover:opacity-100"
            aria-label="O'chirish"
          >
            <Icon icon="lucide:x" className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
      <div className="flex justify-between items-center">
        <span className="text-[10px] text-[#BCC0C7]">{qty}</span>
        <span className="text-[12px] font-bold text-[#5555E7]">{price}</span>
      </div>
    </div>
  );
}
