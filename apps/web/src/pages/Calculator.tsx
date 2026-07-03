import { useMemo, useState } from 'react';
import { Icon } from '@iconify/react';
import { useTranslation } from 'react-i18next';
import type { PaymentType } from '@smeta/shared';
import { api, ApiError } from '../lib/api';
import { fmtNumber } from '../lib/format';
import { useCurrency } from '../lib/currency';
import { GeneralExpenses } from '../components/GeneralExpenses';
import { VoiceButton } from '../components/VoiceButton';
import { VoiceConfirm } from '../components/VoiceConfirm';
import type { VoiceIntent } from '../lib/voice';

type ItemType = 'MATERIAL' | 'LABOR' | 'EQUIPMENT';

interface LineItem {
  name: string;
  type: ItemType;
  paymentType?: PaymentType;
  qty: number;
  unit: string;
  unitPrice: number; // har doim UZS'da saqlanadi
}

interface Stage {
  id: number;
  label: string;
  date: string;
  amount: string;
}

const TAX_RATE = 12;

// Usta ish turlari: 'area' — m/m²/m³ bo'yicha; 'unit' — dona bo'yicha (g'ishtchi).
const USTA_TYPES: { key: string; kind: 'area' | 'unit' }[] = [
  { key: 'plaster', kind: 'area' },
  { key: 'travertine', kind: 'area' },
  { key: 'stucco', kind: 'area' },
  { key: 'painting', kind: 'area' },
  { key: 'tiling', kind: 'area' },
  { key: 'concrete', kind: 'area' },
  { key: 'bricklayer', kind: 'unit' },
  { key: 'other', kind: 'area' },
];

const UNITS = ['m³', 'm²', 'kg'] as const;
const USTA_UNITS = ['m²', 'm³', 'm'] as const;

function paymentTypeForUnit(unit: string): PaymentType {
  if (unit === 'm²') return 'PER_M2';
  if (unit === 'm³') return 'PER_M3';
  if (unit === 'm') return 'PER_METER';
  return 'PER_UNIT';
}

export function Calculator() {
  const { t } = useTranslation();
  const { currency, rate, fmt } = useCurrency();
  const [items, setItems] = useState<LineItem[]>([]);
  const [tab, setTab] = useState<'summary' | 'details' | 'terms'>('summary');

  // Material kiritish maydonlari
  const [matName, setMatName] = useState('');
  const [matQty, setMatQty] = useState('10');
  const [matUnit, setMatUnit] = useState<(typeof UNITS)[number]>('m³');
  const [matPrice, setMatPrice] = useState('0');

  // Mehnat va texnika maydonlari
  const [laborHours, setLaborHours] = useState('120');
  const [laborRate, setLaborRate] = useState('25000');
  const [equipDays, setEquipDays] = useState('2');

  // Usta ishi
  const [ustaTypeKey, setUstaTypeKey] = useState(USTA_TYPES[0].key);
  const [ustaArea, setUstaArea] = useState('45');
  const [ustaUnit, setUstaUnit] = useState<(typeof USTA_UNITS)[number]>('m²');
  const [ustaRate, setUstaRate] = useState('6');
  const [ustaCur, setUstaCur] = useState<'USD' | 'UZS'>('USD');
  // G'ishtchi maydonlari
  const [brickCount, setBrickCount] = useState('5000');
  const [brickPrice, setBrickPrice] = useState('1000');
  const [brickCur, setBrickCur] = useState<'USD' | 'UZS'>('UZS');

  // Muddatlar (bosqichlar)
  const [stages, setStages] = useState<Stage[]>([]);
  const nextStageId = useMemo(() => ({ v: 1 }), []);

  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);
  const [voice, setVoice] = useState<{ intent: VoiceIntent; transcript: string } | null>(null);

  const ustaType = USTA_TYPES.find((u) => u.key === ustaTypeKey)!;

  // Hisob-kitoblar (barchasi UZS'da)
  const subtotal = useMemo(() => items.reduce((s, it) => s + it.qty * it.unitPrice, 0), [items]);
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

  const donutStyle = {
    background: `conic-gradient(#FF8E4D 0% ${matPct}%, #3DF2FF ${matPct}% ${matPct + laborPct}%, #5555E7 ${matPct + laborPct}% 100%)`,
  };

  function addMaterial() {
    const qty = parseFloat(matQty) || 0;
    const price = parseFloat(matPrice) || 0;
    const name = matName.trim() || t('calc.materials');
    if (qty <= 0) return;
    setItems((prev) => [...prev, { name, type: 'MATERIAL', qty, unit: matUnit, unitPrice: price }]);
    setMatName('');
    setMatQty('10');
    setMatPrice('0');
  }

  function addLaborAndEquipment() {
    const hours = parseFloat(laborHours) || 0;
    const laborRateVal = parseFloat(laborRate) || 0;
    const days = parseFloat(equipDays) || 0;
    const next: LineItem[] = [];
    if (hours > 0 && laborRateVal > 0) {
      next.push({ name: t('calc.laborHours'), type: 'LABOR', paymentType: 'HOURLY', qty: hours, unit: 'soat', unitPrice: laborRateVal });
    }
    if (days > 0) {
      next.push({ name: t('calc.equipDays'), type: 'EQUIPMENT', qty: days, unit: 'sutka', unitPrice: 800000 });
    }
    if (next.length) setItems((prev) => [...prev, ...next]);
  }

  function addUstaWork() {
    const typeName = t(`calc.workTypes.${ustaType.key}`);
    if (ustaType.kind === 'unit') {
      // G'ishtchi: dona × dona narxi
      const count = parseFloat(brickCount) || 0;
      const priceRaw = parseFloat(brickPrice) || 0;
      if (count <= 0 || priceRaw <= 0) return;
      const unitPriceUzs = brickCur === 'USD' ? priceRaw * rate : priceRaw;
      setItems((prev) => [
        ...prev,
        { name: typeName, type: 'LABOR', paymentType: 'PER_UNIT', qty: count, unit: 'dona', unitPrice: unitPriceUzs },
      ]);
      return;
    }
    // Maydon bo'yicha (suvoq, beton ishchisi va h.k.)
    const area = parseFloat(ustaArea) || 0;
    const rateRaw = parseFloat(ustaRate) || 0;
    if (area <= 0 || rateRaw <= 0) return;
    const unitPriceUzs = ustaCur === 'USD' ? rateRaw * rate : rateRaw;
    setItems((prev) => [
      ...prev,
      { name: typeName, type: 'LABOR', paymentType: paymentTypeForUnit(ustaUnit), qty: area, unit: ustaUnit, unitPrice: unitPriceUzs },
    ]);
  }

  function removeItem(idx: number) {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  }

  // ─── Muddatlar (bosqichlar) ─────────────────────────────────────────────
  function addStage() {
    setStages((prev) => [...prev, { id: nextStageId.v++, label: '', date: '', amount: '' }]);
  }
  function updateStage(id: number, patch: Partial<Stage>) {
    setStages((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  }
  function removeStage(id: number) {
    setStages((prev) => prev.filter((s) => s.id !== id));
  }
  const stagesTotal = useMemo(
    () => stages.reduce((sum, s) => sum + (parseFloat(s.amount) || 0), 0),
    [stages],
  );

  // Display valyutasida sonni formatlash (bosqich summalari kiritilgan valyutada).
  function fmtDisplay(n: number): string {
    if (currency === 'USD') return `${new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n)} USD`;
    return `${new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 }).format(Math.round(n))} UZS`;
  }

  async function save() {
    setSaving(true);
    setToast(null);
    try {
      await api.post('/estimates', {
        title: 'Kalkulyator smetasi',
        currency: 'UZS',
        taxRate: TAX_RATE,
        items: items.map((i) => ({
          name: i.name,
          type: i.type,
          paymentType: i.paymentType ?? null,
          qty: i.qty,
          unit: i.unit,
          unitPrice: i.unitPrice,
        })),
        stages: stages
          .filter((s) => s.label.trim() || s.amount)
          .map((s) => ({
            label: s.label.trim() || '—',
            date: s.date || null,
            amount: parseFloat(s.amount) || 0,
            currency,
          })),
      });
      setToast({ kind: 'ok', text: t('calc.savedOk') });
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : t('common.saveError');
      setToast({ kind: 'err', text: msg });
    } finally {
      setSaving(false);
    }
  }

  // Ovozli buyruq: kalkulyatorga pozitsiya qo'shish (masalan g'isht 5000 dona × 1000 so'm).
  function addFromVoice() {
    const v = voice;
    setVoice(null);
    if (!v || v.intent.action !== 'calculator_input') return;
    const it = v.intent;
    const qty = it.qty ?? 0;
    const priceUzs = (it.unitPrice ?? 0) * (it.currency === 'USD' ? rate : 1);
    if (qty <= 0 || priceUzs <= 0) return;
    const unit = it.unit === 'm2' ? 'm²' : it.unit === 'm3' ? 'm³' : it.unit || 'dona';
    setItems((prev) => [
      ...prev,
      { name: it.itemName || t('calc.materials'), type: 'MATERIAL', paymentType: unit === 'dona' ? 'PER_UNIT' : undefined, qty, unit, unitPrice: priceUzs },
    ]);
    setTab('details');
  }

  const typeLabel = (type: ItemType) =>
    type === 'MATERIAL' ? t('calc.typeMaterial') : type === 'LABOR' ? t('calc.typeLabor') : t('calc.typeEquipment');

  return (
    <main className="p-4 lg:p-8 overflow-y-auto">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-[1400px] mx-auto">
        {/* Left Panel: Inputs */}
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-[#191B1F]/40 backdrop-blur-3xl border border-[#343841]/40 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8.5 h-8.5 bg-[#5555E7]/10 border border-[#5555E7]/20 rounded-xl flex items-center justify-center">
                <img src="/assets/calculator/IMG_14.svg" className="w-4 h-4 text-[#FF6B1A]" alt="" />
              </div>
              <h3 className="font-display font-semibold text-sm tracking-widest text-white/80 uppercase">{t('calc.materials')}</h3>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-[12px] font-medium mb-2">{t('calc.materialName')}</label>
                <input
                  type="text"
                  value={matName}
                  onChange={(e) => setMatName(e.target.value)}
                  placeholder={t('calc.materialNamePh')}
                  className="w-full bg-[#343841]/30 border border-[#343841]/40 rounded-xl px-3 py-2 text-sm text-white focus:ring-2 focus:ring-[#5555E7]/50 outline-none transition-all"
                />
              </div>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block text-[12px] font-medium mb-2">{t('calc.qty')}</label>
                  <input
                    type="number"
                    value={matQty}
                    onChange={(e) => setMatQty(e.target.value)}
                    className="w-full bg-[#343841]/30 border border-[#343841]/40 rounded-xl px-3 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-[#5555E7]/50 transition-all"
                  />
                </div>
                <div className="w-24">
                  <label className="block text-[12px] font-medium mb-2">{t('calc.unit')}</label>
                  <div className="flex bg-[#343841]/30 border border-[#343841]/40 rounded-xl p-1">
                    {UNITS.map((u) => (
                      <button
                        key={u}
                        type="button"
                        onClick={() => setMatUnit(u)}
                        className={`flex-1 py-1 text-[10px] font-bold rounded ${matUnit === u ? 'bg-[#5555E7] text-white shadow-sm' : 'text-white'}`}
                      >
                        {u}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-[12px] font-medium mb-2">{t('calc.priceUnit')} (UZS)</label>
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
                <img src="/assets/calculator/IMG_15.svg" className="w-4 h-4" alt="" />
                {t('common.add')}
              </button>
            </div>

            <div className="my-8 border-t border-[#343841]/40"></div>

            <div className="flex items-center gap-3 mb-6">
              <div className="w-8.5 h-8.5 bg-[#5555E7]/10 border border-[#5555E7]/20 rounded-xl flex items-center justify-center">
                <img src="/assets/calculator/IMG_16.svg" className="w-4 h-4 text-[#FF6B1A]" alt="" />
              </div>
              <h3 className="font-display font-semibold text-sm tracking-widest text-white/80 uppercase">{t('calc.laborEquip')}</h3>
            </div>

            <div className="space-y-4">
              <InputWithIcon label={t('calc.laborHours')} icon="/assets/calculator/IMG_17.svg" value={laborHours} onChange={setLaborHours} />
              <InputWithIcon label={t('calc.laborRate')} icon="/assets/calculator/IMG_18.svg" value={laborRate} onChange={setLaborRate} />
              <InputWithIcon label={t('calc.equipDays')} icon="/assets/calculator/IMG_19.svg" value={equipDays} onChange={setEquipDays} />
              <button
                type="button"
                onClick={addLaborAndEquipment}
                className="w-full py-2.5 border border-[#22D3EE]/30 bg-[#16181D] text-[#22D3EE] rounded-xl text-sm font-medium flex items-center justify-center gap-2 hover:bg-[#22D3EE]/5 transition-colors"
              >
                <img src="/assets/calculator/IMG_15.svg" className="w-4 h-4" alt="" />
                {t('common.add')}
              </button>
            </div>

            <div className="my-8 border-t border-[#343841]/40"></div>

            {/* Usta ishi */}
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8.5 h-8.5 bg-[#FF6B1A]/10 border border-[#FF6B1A]/20 rounded-xl flex items-center justify-center">
                <Icon icon="lucide:ruler" className="w-4 h-4 text-[#FF6B1A]" />
              </div>
              <h3 className="font-display font-semibold text-sm tracking-widest text-white/80 uppercase">{t('calc.ustaWork')}</h3>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-[12px] font-medium mb-2">{t('calc.workType')}</label>
                <select
                  value={ustaTypeKey}
                  onChange={(e) => setUstaTypeKey(e.target.value)}
                  className="w-full bg-[#343841]/30 border border-[#343841]/40 rounded-xl px-3 py-2 text-sm text-white outline-none"
                >
                  {USTA_TYPES.map((tp) => (
                    <option key={tp.key} value={tp.key} className="bg-[#191B1F]">{t(`calc.workTypes.${tp.key}`)}</option>
                  ))}
                </select>
              </div>

              {ustaType.kind === 'unit' ? (
                // G'ishtchi: dona soni × dona narxi
                <>
                  <div>
                    <label className="block text-[12px] font-medium mb-2">{t('calc.brickCount')}</label>
                    <input type="number" value={brickCount} onChange={(e) => setBrickCount(e.target.value)} className="w-full bg-[#343841]/30 border border-[#343841]/40 rounded-xl px-3 py-2 text-sm text-white outline-none" />
                  </div>
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <label className="block text-[12px] font-medium mb-2">{t('calc.brickPrice')}</label>
                      <input type="number" value={brickPrice} onChange={(e) => setBrickPrice(e.target.value)} className="w-full bg-[#343841]/30 border border-[#343841]/40 rounded-xl px-3 py-2 text-sm text-white outline-none" />
                    </div>
                    <div className="w-24">
                      <label className="block text-[12px] font-medium mb-2">{t('calc.currency')}</label>
                      <div className="flex bg-[#343841]/30 border border-[#343841]/40 rounded-xl p-1">
                        {(['USD', 'UZS'] as const).map((c) => (
                          <button key={c} type="button" onClick={() => setBrickCur(c)} className={`flex-1 py-1 text-[9px] font-bold rounded ${brickCur === c ? 'bg-[#FF6B1A] text-white' : 'text-white'}`}>{c}</button>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-between text-[11px] px-1">
                    <span className="text-[#BCC0C7]">{t('calc.totalWage')}</span>
                    <span className="text-[#FF6B1A] font-bold">
                      {fmt((parseFloat(brickCount) || 0) * (parseFloat(brickPrice) || 0) * (brickCur === 'USD' ? rate : 1))}
                    </span>
                  </div>
                </>
              ) : (
                // Maydon bo'yicha
                <>
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <label className="block text-[12px] font-medium mb-2">{t('calc.area')}</label>
                      <input type="number" value={ustaArea} onChange={(e) => setUstaArea(e.target.value)} className="w-full bg-[#343841]/30 border border-[#343841]/40 rounded-xl px-3 py-2 text-sm text-white outline-none" />
                    </div>
                    <div className="w-24">
                      <label className="block text-[12px] font-medium mb-2">{t('calc.unit')}</label>
                      <div className="flex bg-[#343841]/30 border border-[#343841]/40 rounded-xl p-1">
                        {USTA_UNITS.map((u) => (
                          <button key={u} type="button" onClick={() => setUstaUnit(u)} className={`flex-1 py-1 text-[10px] font-bold rounded ${ustaUnit === u ? 'bg-[#FF6B1A] text-white' : 'text-white'}`}>{u}</button>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <label className="block text-[12px] font-medium mb-2">{t('calc.priceForUnit', { unit: ustaUnit })}</label>
                      <input type="number" value={ustaRate} onChange={(e) => setUstaRate(e.target.value)} className="w-full bg-[#343841]/30 border border-[#343841]/40 rounded-xl px-3 py-2 text-sm text-white outline-none" />
                    </div>
                    <div className="w-24">
                      <label className="block text-[12px] font-medium mb-2">{t('calc.currency')}</label>
                      <div className="flex bg-[#343841]/30 border border-[#343841]/40 rounded-xl p-1">
                        {(['USD', 'UZS'] as const).map((c) => (
                          <button key={c} type="button" onClick={() => setUstaCur(c)} className={`flex-1 py-1 text-[9px] font-bold rounded ${ustaCur === c ? 'bg-[#FF6B1A] text-white' : 'text-white'}`}>{c}</button>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-between text-[11px] px-1">
                    <span className="text-[#BCC0C7]">{t('calc.totalWage')}</span>
                    <span className="text-[#FF6B1A] font-bold">
                      {fmt((parseFloat(ustaArea) || 0) * (parseFloat(ustaRate) || 0) * (ustaCur === 'USD' ? rate : 1))}
                    </span>
                  </div>
                </>
              )}

              <button type="button" onClick={addUstaWork} className="w-full py-2.5 border border-[#FF6B1A]/40 bg-[#16181D] text-[#FF6B1A] rounded-xl text-sm font-medium flex items-center justify-center gap-2 hover:bg-[#FF6B1A]/5 transition-colors">
                <Icon icon="lucide:plus" className="w-4 h-4" />
                {t('calc.addUstaWork')}
              </button>
            </div>
          </div>
        </div>

        {/* Center Panel: Stats & Tabs */}
        <div className="lg:col-span-6 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard label={t('calc.statTotal')} value={fmt(total)} gradient="from-[#F97316] to-[#DC2626]" icon="/assets/calculator/IMG_20.svg" />
            <StatCard label={t('calc.statMaterials')} value={fmt(byType.MATERIAL)} gradient="from-[#06B6D4] to-[#2563EB]" icon="/assets/calculator/IMG_14.svg" />
            <StatCard label={t('calc.statLabor')} value={fmt(byType.LABOR)} gradient="from-[#6366F1] to-[#9333EA]" icon="/assets/calculator/IMG_16.svg" />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex bg-[#191B1F]/40 backdrop-blur-xl border border-[#343841]/40 rounded-xl p-1">
              {([['summary', t('calc.tabSummary')], ['details', t('calc.tabDetails')], ['terms', t('calc.tabTerms')]] as const).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setTab(key)}
                  className={`px-5 py-1.5 text-sm font-medium rounded-lg transition-colors ${tab === key ? 'bg-[#5555E7]/20 text-[#5555E7] shadow-sm' : 'text-[#BCC0C7] hover:text-white'}`}
                >
                  {label}
                </button>
              ))}
            </div>
            <VoiceButton hint={t('voice.hintCalc')} onIntent={(intent, transcript) => setVoice({ intent, transcript })} />
          </div>

          {/* Tab: Xulosa */}
          {tab === 'summary' && (
            <div className="bg-[#191B1F]/40 backdrop-blur-3xl border border-[#343841]/40 rounded-2xl p-8 relative overflow-hidden">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div>
                  <h3 className="font-display font-bold text-xl text-white">{t('calc.structure')}</h3>
                  <p className="text-sm text-[#BCC0C7] mt-1">{t('calc.structureSub')}</p>
                </div>
              </div>
              <div className="flex flex-col lg:flex-row items-center justify-center gap-12 py-4">
                <div className="relative w-64 h-64">
                  <div className="w-full h-full rounded-full" style={donutStyle}></div>
                  <div className="absolute inset-[18%] rounded-full bg-[#191B1F] flex flex-col items-center justify-center">
                    <span className="text-xs text-[#BCC0C7] uppercase tracking-widest">{t('calc.total')}</span>
                    <span className="text-2xl font-display font-bold text-white">100%</span>
                  </div>
                </div>
                <div className="space-y-4 w-full lg:w-48">
                  <LegendItem color="bg-[#FF8E4D]" label={t('calc.legendMaterials')} percent={`${matPct}%`} />
                  <LegendItem color="bg-[#3DF2FF]" label={t('calc.legendLabor')} percent={`${laborPct}%`} />
                  <LegendItem color="bg-[#5555E7]" label={t('calc.legendEquip')} percent={`${equipPct}%`} />
                </div>
              </div>
            </div>
          )}

          {/* Tab: Tafsilotlar */}
          {tab === 'details' && (
            <div className="bg-[#191B1F]/40 backdrop-blur-3xl border border-[#343841]/40 rounded-2xl p-6 overflow-x-auto">
              {items.length === 0 ? (
                <p className="text-center text-sm text-[#BCC0C7] py-10">{t('calc.noPositions')}</p>
              ) : (
                <>
                  <table className="w-full text-sm min-w-[560px]">
                    <thead>
                      <tr className="text-[11px] uppercase tracking-wider text-[#BCC0C7]/70 border-b border-[#343841]/40">
                        <th className="text-left py-2 pr-2">{t('calc.detailName')}</th>
                        <th className="text-left py-2 px-2">{t('calc.detailType')}</th>
                        <th className="text-right py-2 px-2">{t('calc.detailQty')}</th>
                        <th className="text-right py-2 px-2">{t('calc.detailUnitPrice')}</th>
                        <th className="text-right py-2 pl-2">{t('calc.detailLineTotal')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((it, idx) => (
                        <tr key={idx} className="border-b border-[#343841]/20">
                          <td className="py-2.5 pr-2 text-white font-medium">{it.name}</td>
                          <td className="py-2.5 px-2 text-[#BCC0C7]">{typeLabel(it.type)}</td>
                          <td className="py-2.5 px-2 text-right text-[#BCC0C7]">{fmtNumber(it.qty)} {it.unit}</td>
                          <td className="py-2.5 px-2 text-right text-[#BCC0C7]">{fmt(it.unitPrice)}</td>
                          <td className="py-2.5 pl-2 text-right text-white font-semibold">{fmt(it.qty * it.unitPrice)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="mt-6 pt-4 border-t border-[#343841]/40 space-y-2">
                    <p className="text-[11px] uppercase tracking-wider text-[#BCC0C7]/70 mb-2">{t('calc.detailByCategory')}</p>
                    <CatRow label={t('calc.typeMaterial')} value={fmt(byType.MATERIAL)} />
                    <CatRow label={t('calc.typeLabor')} value={fmt(byType.LABOR)} />
                    <CatRow label={t('calc.typeEquipment')} value={fmt(byType.EQUIPMENT)} />
                  </div>
                </>
              )}
            </div>
          )}

          {/* Tab: Muddatlar */}
          {tab === 'terms' && (
            <div className="bg-[#191B1F]/40 backdrop-blur-3xl border border-[#343841]/40 rounded-2xl p-6 space-y-4">
              <div>
                <h3 className="font-display font-bold text-lg text-white">{t('calc.termsTitle')}</h3>
                <p className="text-[12px] text-[#BCC0C7]">{t('calc.termsSub')}</p>
              </div>
              {stages.length === 0 ? (
                <p className="text-center text-sm text-[#BCC0C7] py-6">{t('calc.noStages')}</p>
              ) : (
                <div className="space-y-2.5">
                  {stages.map((s, i) => (
                    <div key={s.id} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                      <span className="hidden sm:block w-5 text-center text-xs text-[#7A7F8A] shrink-0">{i + 1}</span>
                      <input
                        value={s.label}
                        onChange={(e) => updateStage(s.id, { label: e.target.value })}
                        placeholder={t('calc.stageNamePh')}
                        className="flex-1 min-w-0 bg-[#16181D] border border-[#343841]/50 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-[#5555E7]/50"
                      />
                      <input
                        type="date"
                        value={s.date}
                        onChange={(e) => updateStage(s.id, { date: e.target.value })}
                        className="bg-[#16181D] border border-[#343841]/50 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-[#5555E7]/50 [color-scheme:dark]"
                      />
                      <input
                        type="number"
                        value={s.amount}
                        onChange={(e) => updateStage(s.id, { amount: e.target.value })}
                        placeholder={t('calc.stageAmount')}
                        className="w-full sm:w-32 bg-[#16181D] border border-[#343841]/50 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-[#5555E7]/50"
                      />
                      <button
                        type="button"
                        onClick={() => removeStage(s.id)}
                        className="w-10 h-10 inline-flex items-center justify-center rounded-lg text-[#E11919] hover:bg-[#E11919]/10 shrink-0"
                        aria-label={t('common.delete')}
                      >
                        <Icon icon="lucide:trash-2" className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <button
                type="button"
                onClick={addStage}
                className="w-full py-2.5 border border-dashed border-[#343841] hover:border-[#5555E7]/40 text-[#BCC0C7] hover:text-[#5555E7] rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-colors"
              >
                <Icon icon="lucide:plus" className="w-4 h-4" /> {t('calc.addStage')}
              </button>
              {stages.length > 0 && (
                <div className="flex items-center justify-between pt-4 border-t border-[#343841]/40">
                  <span className="text-sm font-bold text-white">{t('calc.stagesTotal')}</span>
                  <span className="text-xl font-display font-black text-[#FF6B1A]">{fmtDisplay(stagesTotal)}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Panel: Summary */}
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-[#191B1F]/40 backdrop-blur-3xl border border-[#343841]/40 rounded-2xl overflow-hidden flex flex-col h-full max-h-[818px]">
            <div className="p-5 bg-white/5 border-b border-[#343841]/40 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <img src="/assets/calculator/IMG_25.svg" className="w-3 h-3 text-[#FF6B1A]" alt="" />
                <h3 className="font-display font-bold text-sm text-white uppercase">{t('calc.vedomost')}</h3>
              </div>
              <div className="px-2.5 py-0.5 border border-[#06B6D4]/30 rounded-full">
                <span className="text-[10px] font-semibold text-[#22D3EE]">{t('calc.positions', { count: items.length })}</span>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
              {items.length === 0 ? (
                <div className="text-center text-[12px] text-[#BCC0C7] py-8">{t('calc.noPositions')}</div>
              ) : (
                items.map((it, idx) => (
                  <VedomostiItem
                    key={idx}
                    name={it.name}
                    qty={`${fmtNumber(it.qty)} ${it.unit}`}
                    price={fmt(it.qty * it.unitPrice)}
                    onRemove={() => removeItem(idx)}
                  />
                ))
              )}
            </div>

            <div className="p-5 bg-white/5 border-t border-[#343841]/40 space-y-4">
              <div className="flex justify-between text-xs">
                <span className="text-[#BCC0C7]">{t('calc.taxes', { rate: TAX_RATE })}</span>
                <span className="text-[#BCC0C7]">{fmt(taxAmount)}</span>
              </div>
              <div className="flex justify-between items-end">
                <span className="text-sm font-bold text-white">{t('calc.finalSum')}</span>
                <div className="text-right">
                  <div className="text-xl font-display font-black text-[#FF6B1A]">{fmt(total)}</div>
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

              <button
                type="button"
                onClick={save}
                disabled={saving || items.length === 0}
                className="w-full py-2.5 bg-[#06B6D4] rounded-xl text-[12px] font-medium text-white flex items-center justify-center gap-2 shadow-[0_8px_16px_rgba(6,182,212,0.2)] hover:scale-[1.02] transition-transform disabled:opacity-50 disabled:hover:scale-100"
              >
                {saving ? (
                  <Icon icon="lucide:loader" className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <img src="/assets/calculator/IMG_25.svg" className="w-3 h-3" alt="" />
                )}
                {t('common.save')}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Umumiy harajatlar */}
      <div className="max-w-[1400px] mx-auto mt-6">
        <GeneralExpenses />
      </div>

      {voice && (
        <VoiceConfirm
          intent={voice.intent}
          transcript={voice.transcript}
          onConfirm={addFromVoice}
          onEdit={() => setVoice(null)}
          onClose={() => setVoice(null)}
        />
      )}
    </main>
  );
}

function InputWithIcon({ label, icon, value, onChange }: { label: string; icon: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="block text-[12px] font-medium mb-2">{label}</label>
      <div className="relative flex items-center bg-[#343841]/30 border border-[#343841]/40 rounded-xl px-3 py-2">
        <img src={icon} className="w-4 h-4 mr-2 opacity-60" alt="" />
        <input type="number" value={value} onChange={(e) => onChange(e.target.value)} className="w-full bg-transparent text-sm text-white outline-none" />
      </div>
    </div>
  );
}

function StatCard({ label, value, gradient, icon }: { label: string; value: string; gradient: string; icon: string }) {
  return (
    <div className="bg-[#191B1F]/40 backdrop-blur-3xl border border-[#343841]/40 rounded-2xl p-5 relative overflow-hidden group hover:border-[#343841] transition-colors">
      <div className="flex justify-between items-start mb-4">
        <div className={`w-9 h-9 bg-gradient-to-br ${gradient} rounded-xl flex items-center justify-center shadow-lg`}>
          <img src={icon} className="w-5 h-5 text-white" alt="" />
        </div>
      </div>
      <div className="space-y-1">
        <p className="text-[12px] font-medium text-[#BCC0C7]">{label}</p>
        <h4 className="text-xl font-display font-bold text-white tracking-tight break-all">{value}</h4>
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

function CatRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-[#BCC0C7]">{label}</span>
      <span className="text-white font-semibold">{value}</span>
    </div>
  );
}

function VedomostiItem({ name, qty, price, onRemove }: { name: string; qty: string; price: string; onRemove?: () => void }) {
  return (
    <div className="p-3 bg-[#343841]/20 border border-white/5 rounded-xl group hover:bg-[#343841]/30 transition-colors">
      <div className="flex justify-between items-start mb-1">
        <span className="text-[12px] font-bold text-white">{name}</span>
        {onRemove && (
          <button type="button" onClick={onRemove} className="text-[#BCC0C7]/50 hover:text-[#E11919] transition-colors opacity-0 group-hover:opacity-100" aria-label="x">
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
