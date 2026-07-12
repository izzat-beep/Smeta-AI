import { useEffect, useState } from 'react';
import { Icon } from '@iconify/react';
import { useTranslation } from 'react-i18next';
import type { Project, ProjectFinance } from '@smeta/shared';
import { api, ApiError } from '../lib/api';
import { fmtMoney, fmtDate, fmtNumber } from '../lib/format';
import { useCurrency } from '../lib/currency';
import { Payment } from '../lib/payments';
import PaymentModal from '../components/PaymentModal';
import { GeneralExpenses } from '../components/GeneralExpenses';
import { VoiceButton } from '../components/VoiceButton';
import { VoiceConfirm } from '../components/VoiceConfirm';
import type { VoiceIntent } from '../lib/voice';

interface Prefill { projectId?: string; unitName?: string; paid?: string; currency?: Currency }

type Currency = 'UZS' | 'USD';

interface RealtorRef { id: string; name: string; phone: string | null }
interface ProjectRef { id: string; title: string; code: string }

interface Sale {
  id: string;
  projectId: string | null;
  project: ProjectRef | null;
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
  const { t } = useTranslation();
  // Global UZS/USD almashtirgich — moliya kartalari shu valyutada ko'rsatiladi
  const { fmt } = useCurrency();
  const [data, setData] = useState<SalesData | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [building, setBuilding] = useState<string>(''); // '' = barcha binolar
  const [finance, setFinance] = useState<ProjectFinance | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [cur, setCur] = useState<Currency>('UZS');
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<'soldAt' | 'lastPayment'>('soldAt');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [payFor, setPayFor] = useState<Sale | null>(null);
  const [voice, setVoice] = useState<{ intent: VoiceIntent; transcript: string } | null>(null);
  const [prefill, setPrefill] = useState<Prefill | null>(null);

  // Loyihalar (binolar) ro'yxati — bir marta yuklanadi.
  useEffect(() => {
    api.get<Project[]>('/projects').then(setProjects).catch(() => setProjects([]));
  }, []);

  async function load() {
    const params = new URLSearchParams();
    if (query.trim()) params.set('unit', query.trim());
    if (building) params.set('projectId', building);
    if (sort === 'lastPayment') params.set('sort', 'lastPayment');
    const qs = params.toString();
    setData(await api.get<SalesData>(`/sales${qs ? `?${qs}` : ''}`));
  }
  useEffect(() => {
    const tm = setTimeout(load, 250);
    return () => clearTimeout(tm);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, sort, building]);

  // Tanlangan bino moliyasi (foyda = kelgan − sotib olish − harajat, UZS'da).
  useEffect(() => {
    if (!building) { setFinance(null); return; }
    let active = true;
    api.get<ProjectFinance>(`/projects/${building}/finance`).then((f) => { if (active) setFinance(f); }).catch(() => { if (active) setFinance(null); });
    return () => { active = false; };
  }, [building]);

  async function remove(id: string, unit: string) {
    if (!confirm(t('sales.confirmDelete', { unit }))) return;
    await api.delete(`/sales/${id}`);
    load();
  }

  function refreshFinance() {
    if (building) api.get<ProjectFinance>(`/projects/${building}/finance`).then(setFinance).catch(() => {});
  }

  // Ovozli buyruq tasdiqlangach: mavjud sotuvga to'lov qo'shamiz; topilmasa forma prefill.
  async function confirmVoice() {
    const v = voice;
    setVoice(null);
    if (!v || v.intent.action !== 'add_payment') return;
    const it = v.intent;
    const proj = it.projectName ? projects.find((p) => p.title.toLowerCase().includes(it.projectName!.toLowerCase())) : null;
    const sale = (data?.sales ?? []).find(
      (s) => (it.unitName ? s.unitName.toLowerCase().includes(it.unitName!.toLowerCase()) : false) && (proj ? s.projectId === proj.id : true),
    );
    if (sale && it.amount) {
      try {
        await api.post(`/sales/${sale.id}/payments`, { amount: it.amount, currency: it.currency ?? sale.currency });
        load();
        refreshFinance();
        return;
      } catch { /* pastda formaga tushamiz */ }
    }
    // Sotuv topilmadi — formani to'ldirib ochamiz.
    setPrefill({ projectId: proj?.id ?? building, unitName: it.unitName ?? '', paid: it.amount ? String(it.amount) : '', currency: it.currency ?? 'UZS' });
    setShowAdd(true);
  }

  function editVoice() {
    const v = voice;
    setVoice(null);
    if (!v) return;
    const it = v.intent;
    const proj = it.projectName ? projects.find((p) => p.title.toLowerCase().includes(it.projectName!.toLowerCase())) : null;
    setPrefill({ projectId: proj?.id ?? building, unitName: it.unitName ?? '', paid: it.amount ? String(it.amount) : '', currency: it.currency ?? 'UZS' });
    setShowAdd(true);
  }

  const totals: CurTotals = data?.totalsByCurrency[cur] ?? { paid: 0, remaining: 0, commission: 0 };
  const availableCurrencies = Object.keys(data?.totalsByCurrency ?? {});

  return (
    <div className="p-4 lg:p-10 max-w-[1280px] mx-auto w-full space-y-8">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <Icon icon="lucide:hand-coins" className="w-8 h-8 text-[#FF6B1A]" />
            <h1 className="font-display text-3xl font-extrabold text-white tracking-tight">{t('sales.title')}</h1>
          </div>
          <p className="text-[var(--c-muted)]">{t('sales.subtitle')}</p>
        </div>
        <div className="flex items-end gap-3">
          <VoiceButton hint={t('voice.hint')} onIntent={(intent, transcript) => setVoice({ intent, transcript })} />
          <button onClick={() => { setPrefill(null); setShowAdd(true); }} className="flex items-center gap-2 px-6 py-2.5 bg-[#FF6B1A] hover:bg-[#e55a10] text-white rounded-xl font-bold text-sm shadow-[0_0_20px_rgba(255,107,26,0.2)]">
            <Icon icon="lucide:plus" className="w-5 h-5" /> {t('sales.addSale')}
          </button>
        </div>
      </div>

      {/* Bino tanlagich */}
      <div className="flex items-center gap-3 overflow-x-auto pb-2 no-scrollbar">
        <Icon icon="lucide:building-2" className="w-5 h-5 text-[#22D3EE] shrink-0" />
        <BuildingChip label={t('sales.allBuildings')} active={building === ''} onClick={() => setBuilding('')} />
        {projects.map((p) => (
          <BuildingChip key={p.id} label={p.title} active={building === p.id} onClick={() => setBuilding(p.id)} />
        ))}
        {projects.length === 0 && <span className="text-xs text-[var(--c-muted2)] shrink-0">{t('sales.noBuildings')}</span>}
      </div>

      {/* Bino moliyasi (faqat bino tanlanganda) */}
      {finance && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {/* fmt() — global UZS/USD almashtirgichga mos ko'rsatadi (API UZS'da beradi) */}
            <FinCard label={t('sales.finUnits')} value={`${finance.soldUnits}/${finance.totalUnits}`} color="text-[#5555E7]" icon="lucide:building" />
            <FinCard label={t('sales.finPurchase')} value={fmt(finance.purchasePrice)} color="text-[var(--c-muted)]" icon="lucide:tag" />
            <FinCard label={t('sales.finIncoming')} value={fmt(finance.incoming)} color="text-[#10B981]" icon="lucide:wallet" />
            <FinCard label={t('sales.finRemaining')} value={fmt(finance.remaining)} color="text-[#F97316]" icon="lucide:clock" />
            <FinCard label={t('sales.finExpenses')} value={fmt(finance.expenses)} color="text-[#E11919]" icon="lucide:hammer" />
            <FinCard label={t('sales.finProfit')} value={fmt(finance.profit)} color={finance.profit >= 0 ? 'text-[#26D926]' : 'text-[#E11919]'} icon="lucide:trending-up" />
          </div>
          <p className="text-[10px] text-[var(--c-muted2)]">{t('sales.financeNote')} (1 USD = {fmtNumber(finance.rate)} UZS)</p>
        </div>
      )}

      {/* Umumiy statistika (valyuta bo'yicha) */}
      <div className="space-y-4">
        <div className="flex items-center justify-end gap-2">
          <span className="text-xs text-[var(--c-muted)]">{t('sales.currency')}</span>
          <div className="flex bg-[var(--c-border)]/40 border border-[var(--c-border)]/40 rounded-xl p-1">
            {(['UZS', 'USD'] as Currency[]).map((c) => (
              <button key={c} onClick={() => setCur(c)} className={`px-4 py-1 text-xs font-bold rounded-lg transition-colors ${cur === c ? 'bg-[var(--c-panel)] text-white shadow-sm' : 'text-[var(--c-muted)]'}`}>
                {c}{availableCurrencies.includes(c) ? '' : ' ·'}
              </button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard label={t('sales.statSold')} value={t('sales.unitCount', { count: data?.count ?? 0 })} icon="lucide:building" color="text-[#5555E7]" />
          <StatCard label={t('sales.statPaid', { cur })} value={fmtMoney(totals.paid, cur)} icon="lucide:wallet" color="text-[#10B981]" />
          <StatCard label={t('sales.statRemaining', { cur })} value={fmtMoney(totals.remaining, cur)} icon="lucide:clock" color="text-[#F97316]" />
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Icon icon="lucide:search" className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--c-muted)]" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t('sales.searchPh')} className="w-full bg-[var(--c-bg)] border border-[var(--c-border)]/50 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white outline-none focus:border-[#FF6B1A]/50" />
        </div>
        <div className="flex bg-[var(--c-border)]/40 border border-[var(--c-border)]/40 rounded-xl p-1">
          <button onClick={() => setSort('soldAt')} className={`px-4 py-1.5 text-xs font-semibold rounded-lg ${sort === 'soldAt' ? 'bg-[var(--c-panel)] text-white' : 'text-[var(--c-muted)]'}`}>{t('sales.sortSold')}</button>
          <button onClick={() => setSort('lastPayment')} className={`px-4 py-1.5 text-xs font-semibold rounded-lg ${sort === 'lastPayment' ? 'bg-[var(--c-panel)] text-white' : 'text-[var(--c-muted)]'}`}>{t('sales.sortLastPayment')}</button>
        </div>
      </div>

      <div className="glass-panel rounded-2xl overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-[var(--c-bg)]/30 border-b border-[var(--c-border)]/40">
                {['', t('sales.building'), t('sales.unit'), t('sales.buyer'), t('sales.price'), t('sales.paid'), t('sales.remaining'), t('sales.realtor'), t('sales.lastPayment'), ''].map((h, i) => (
                  <th key={i} className="px-4 py-4 text-[10px] font-bold uppercase tracking-widest text-[var(--c-muted)] whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--c-border)]/30">
              {data?.sales.map((x) => {
                const rem = x.price - x.paid;
                const isOpen = expanded === x.id;
                const lastPay = x.payments.length ? x.payments[x.payments.length - 1] : null;
                return (
                  <FragmentRow key={x.id}>
                    <tr className="hover:bg-white/5">
                      <td className="px-4 py-4">
                        <button onClick={() => setExpanded(isOpen ? null : x.id)} className="w-11 h-11 inline-flex items-center justify-center rounded-lg hover:bg-white/10 text-[var(--c-muted)]" title={t('sales.paymentsHistory')}>
                          <Icon icon={isOpen ? 'lucide:chevron-down' : 'lucide:chevron-right'} className="w-4 h-4" />
                        </button>
                      </td>
                      <td className="px-4 py-4 text-sm text-[#22D3EE] whitespace-nowrap">{x.project?.title ?? '—'}</td>
                      <td className="px-4 py-4 text-sm font-medium text-white whitespace-nowrap">{x.unitName}</td>
                      <td className="px-4 py-4 text-sm whitespace-nowrap">
                        <div className="text-[var(--c-muted)]">{x.buyerName}</div>
                        {x.buyerPhone && <div className="text-[11px] text-[var(--c-muted2)] flex items-center gap-1"><Icon icon="lucide:phone" className="w-3 h-3" />{x.buyerPhone}</div>}
                      </td>
                      <td className="px-4 py-4 text-sm font-semibold text-white whitespace-nowrap">{fmtMoney(x.price, x.currency)}</td>
                      <td className="px-4 py-4 text-sm font-semibold text-[#10B981] whitespace-nowrap">{fmtMoney(x.paid, x.currency)}</td>
                      <td className={`px-4 py-4 text-sm font-semibold whitespace-nowrap ${rem > 0 ? 'text-[#F97316]' : 'text-[#10B981]'}`}>{rem > 0 ? fmtMoney(rem, x.currency) : t('sales.fullyPaid')}</td>
                      <td className="px-4 py-4 text-sm text-[var(--c-muted)] whitespace-nowrap">
                        {x.realtor ? (
                          <div>
                            <div className="text-white">{x.realtor.name}</div>
                            <div className="text-[11px] text-[#F97316]">{fmtMoney(x.commissionAmount, x.currency)}</div>
                          </div>
                        ) : '—'}
                      </td>
                      <td className="px-4 py-4 text-sm text-[var(--c-muted)] whitespace-nowrap">
                        {x.lastPaymentAt ? (
                          <div>
                            <div>{fmtDate(x.lastPaymentAt)}</div>
                            {lastPay?.location && <div className="text-[11px] text-[var(--c-muted2)]">{lastPay.location}</div>}
                          </div>
                        ) : '—'}
                      </td>
                      <td className="px-4 py-4 text-right whitespace-nowrap">
                        <button onClick={() => setPayFor(x)} className="w-11 h-11 inline-flex items-center justify-center rounded-lg text-[#FF6B1A] hover:bg-[#FF6B1A]/10" title={t('sales.paymentsHistory')}><Icon icon="lucide:receipt-text" className="w-4 h-4" /></button>
                        <button onClick={() => remove(x.id, x.unitName)} className="w-11 h-11 inline-flex items-center justify-center rounded-lg text-[#E11919] hover:bg-[#E11919]/10" title={t('common.delete')}><Icon icon="lucide:trash-2" className="w-4 h-4" /></button>
                      </td>
                    </tr>
                    {isOpen && (
                      <tr className="bg-[var(--c-bg)]/40">
                        <td colSpan={10} className="px-6 py-4">
                          <PaymentHistory payments={x.payments} onAdd={() => setPayFor(x)} />
                        </td>
                      </tr>
                    )}
                  </FragmentRow>
                );
              })}
              {data && data.sales.length === 0 && (
                <tr><td colSpan={10} className="px-5 py-12 text-center text-[var(--c-muted)]"><Icon icon="lucide:hand-coins" className="w-8 h-8 mx-auto mb-2 opacity-40" />{query ? t('sales.noSalesSearch') : t('sales.noSales')}</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Tanlangan bino uchun umumiy harajatlar */}
      {building && (
        <div>
          <h2 className="text-sm font-bold uppercase tracking-widest text-[var(--c-muted)] mb-3">{t('sales.buildingExpenses')}</h2>
          <GeneralExpenses key={building} projectId={building} />
        </div>
      )}

      {voice && (
        <VoiceConfirm
          intent={voice.intent}
          transcript={voice.transcript}
          onConfirm={confirmVoice}
          onEdit={editVoice}
          onClose={() => setVoice(null)}
        />
      )}

      {showAdd && <AddModal projects={projects} defaultProject={building} prefill={prefill} onClose={() => { setShowAdd(false); setPrefill(null); }} onDone={() => { setShowAdd(false); setPrefill(null); load(); refreshFinance(); }} />}
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

function BuildingChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className={`px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap shrink-0 transition-all ${active ? 'bg-[#5555E7]/20 border border-[#5555E7] text-[#5555E7]' : 'bg-[var(--c-bg)]/40 border border-white/5 text-[var(--c-muted)] hover:border-white/20'}`}>
      {label}
    </button>
  );
}

function FinCard({ label, value, color, icon }: { label: string; value: string; color: string; icon: string }) {
  return (
    <div className="p-4 glass-panel rounded-2xl">
      <div className="flex items-center gap-2 mb-2">
        <Icon icon={icon} className={`w-4 h-4 ${color}`} />
        <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--c-muted)]">{label}</p>
      </div>
      <p className={`text-lg font-display font-bold ${color} break-all`}>{value}</p>
    </div>
  );
}

function FragmentRow({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

function PaymentHistory({ payments, onAdd }: { payments: Payment[]; onAdd: () => void }) {
  const { t } = useTranslation();
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-bold uppercase tracking-widest text-[var(--c-muted)] flex items-center gap-2">
          <Icon icon="lucide:history" className="w-4 h-4" /> {t('sales.paymentsHistory')}
        </h4>
        <button onClick={onAdd} className="text-xs font-semibold text-[#FF6B1A] hover:underline flex items-center gap-1">
          <Icon icon="lucide:plus" className="w-3.5 h-3.5" /> {t('sales.addPayment')}
        </button>
      </div>
      {payments.length === 0 ? (
        <p className="text-sm text-[var(--c-muted2)]">{t('sales.noPayments')}</p>
      ) : (
        <div className="border border-[var(--c-border)]/40 rounded-xl overflow-hidden bg-[var(--c-panel)]/40">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[10px] uppercase tracking-widest text-[var(--c-muted2)]">
                <th className="text-left px-4 py-2">#</th>
                <th className="text-left px-4 py-2">{t('sales.colDate')}</th>
                <th className="text-left px-4 py-2">{t('sales.colAmount')}</th>
                <th className="text-left px-4 py-2">{t('sales.colLocation')}</th>
                <th className="text-left px-4 py-2">{t('sales.colMethod')}</th>
                <th className="text-left px-4 py-2">{t('sales.colNote')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--c-border)]/30">
              {payments.map((p, i) => (
                <tr key={p.id}>
                  <td className="px-4 py-2 text-[var(--c-muted2)]">{i + 1}</td>
                  <td className="px-4 py-2 text-[var(--c-muted)]">{fmtDate(p.paidAt)}</td>
                  <td className="px-4 py-2 font-semibold text-[#10B981]">{fmtMoney(Number(p.amount), p.currency)}</td>
                  <td className="px-4 py-2 text-[var(--c-muted)]">{p.location || '—'}</td>
                  <td className="px-4 py-2 text-[var(--c-muted)]">{p.method || '—'}</td>
                  <td className="px-4 py-2 text-[var(--c-muted)]">{p.note || '—'}</td>
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
      <div className="w-10 h-10 bg-[var(--c-bg)]/50 border border-[var(--c-border)]/50 rounded-xl flex items-center justify-center mb-4">
        <Icon icon={icon} className={`w-5 h-5 ${color}`} />
      </div>
      <p className="text-sm font-medium text-[var(--c-muted)]">{label}</p>
      <h3 className={`text-2xl font-bold font-display mt-1 ${color}`}>{value}</h3>
    </div>
  );
}

function AddModal({ projects, defaultProject, prefill, onClose, onDone }: { projects: Project[]; defaultProject: string; prefill?: Prefill | null; onClose: () => void; onDone: () => void }) {
  const { t } = useTranslation();
  const [f, setF] = useState({
    projectId: prefill?.projectId ?? defaultProject,
    unitName: prefill?.unitName ?? '',
    buyerName: '',
    buyerPhone: '',
    area: '',
    price: '',
    paid: prefill?.paid ?? '',
    currency: (prefill?.currency ?? 'UZS') as Currency,
    realtorId: '',
    commissionAmount: '',
  });
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
        projectId: f.projectId || undefined,
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
      setErr(e2 instanceof ApiError ? e2.message : t('common.error'));
    } finally {
      setSaving(false);
    }
  }
  const inp = 'w-full bg-[var(--c-bg)] border border-[var(--c-border)]/50 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-[#FF6B1A]/50';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[var(--c-bg)]/70 backdrop-blur-sm" onClick={onClose}>
      <form onClick={(e) => e.stopPropagation()} onSubmit={submit} className="w-full max-w-md bg-[var(--c-panel)] border border-[var(--c-border)]/60 rounded-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto custom-scrollbar">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold text-white font-display">{t('sales.modal.title')}</h3>
          <button type="button" onClick={onClose} aria-label={t('common.close')} className="w-11 h-11 -mr-2 inline-flex items-center justify-center rounded-lg text-[var(--c-muted)] hover:text-white hover:bg-white/5"><Icon icon="lucide:x" className="w-5 h-5" /></button>
        </div>
        {err && <div className="px-4 py-2.5 bg-[#E11919]/10 border border-[#E11919]/30 rounded-lg text-[#ff6b6b] text-sm">{err}</div>}
        <div className="space-y-1.5">
          <label className="text-[12px] text-[var(--c-muted)]">{t('sales.modal.building')}</label>
          <select value={f.projectId} onChange={(e) => setF({ ...f, projectId: e.target.value })} className={inp}>
            <option value="">{t('sales.modal.noBuilding')}</option>
            {projects.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}
          </select>
        </div>
        <div className="space-y-1.5">
          <label className="text-[12px] text-[var(--c-muted)]">{t('sales.modal.unit')}</label>
          <input value={f.unitName} onChange={(e) => setF({ ...f, unitName: e.target.value })} required placeholder={t('sales.modal.unitPh')} className={inp} />
        </div>
        <div className="flex gap-3">
          <div className="flex-1 space-y-1.5">
            <label className="text-[12px] text-[var(--c-muted)]">{t('sales.modal.buyer')}</label>
            <input value={f.buyerName} onChange={(e) => setF({ ...f, buyerName: e.target.value })} required placeholder={t('sales.modal.buyerPh')} className={inp} />
          </div>
          <div className="flex-1 space-y-1.5">
            <label className="text-[12px] text-[var(--c-muted)]">{t('sales.modal.phone')}</label>
            <input value={f.buyerPhone} onChange={(e) => setF({ ...f, buyerPhone: e.target.value })} placeholder="+998 90 123 45 67" className={inp} />
          </div>
        </div>
        <div className="flex gap-3">
          <div className="flex-1 space-y-1.5">
            <label className="text-[12px] text-[var(--c-muted)]">{t('sales.modal.area')}</label>
            <input type="number" value={f.area} onChange={(e) => setF({ ...f, area: e.target.value })} placeholder="65" className={inp} />
          </div>
          <div className="w-28 space-y-1.5">
            <label className="text-[12px] text-[var(--c-muted)]">{t('sales.modal.currency')}</label>
            <select value={f.currency} onChange={(e) => setF({ ...f, currency: e.target.value as Currency })} className={inp}>
              <option value="UZS">UZS</option>
              <option value="USD">USD</option>
            </select>
          </div>
        </div>
        <div className="flex gap-3">
          <div className="flex-1 space-y-1.5">
            <label className="text-[12px] text-[var(--c-muted)]">{t('sales.modal.price')}</label>
            <input type="number" value={f.price} onChange={(e) => setF({ ...f, price: e.target.value })} required placeholder="500000000" className={inp} />
          </div>
          <div className="flex-1 space-y-1.5">
            <label className="text-[12px] text-[var(--c-muted)]">{t('sales.modal.initialPaid')}</label>
            <input type="number" value={f.paid} onChange={(e) => setF({ ...f, paid: e.target.value })} placeholder="200000000" className={inp} />
          </div>
        </div>
        <div className="space-y-1.5">
          <label className="text-[12px] text-[var(--c-muted)]">{t('sales.modal.realtor')}</label>
          <select value={f.realtorId} onChange={(e) => setF({ ...f, realtorId: e.target.value })} className={inp}>
            <option value="">{t('sales.modal.noRealtor')}</option>
            {realtors.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>
        </div>
        {f.realtorId && (
          <div className="space-y-1.5">
            <label className="text-[12px] text-[var(--c-muted)]">{t('sales.modal.commission', { cur: f.currency })}</label>
            <input type="number" value={f.commissionAmount} onChange={(e) => setF({ ...f, commissionAmount: e.target.value })} placeholder="5000000" className={inp} />
          </div>
        )}
        <button disabled={saving} className="w-full py-3 bg-[#FF6B1A] hover:bg-[#e55a10] text-white font-bold rounded-xl disabled:opacity-60">
          {saving ? t('sales.modal.saving') : t('sales.modal.add')}
        </button>
      </form>
    </div>
  );
}
