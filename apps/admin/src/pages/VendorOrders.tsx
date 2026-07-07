// Sotuvchi buyurtmalari (Vazifa 1): status oqimini boshqarish + mijozga xabar.
// Status: NEW -> ACCEPTED -> PREPARING -> IN_TRANSIT -> DELIVERED (+ CANCELLED).
// Har o'zgarishda mijozga avtomatik bildirishnoma boradi (backend yozadi).
import { useEffect, useState } from 'react';
import { Icon } from '@iconify/react';
import { useTranslation } from 'react-i18next';
import type { Order, OrderStatus } from '@smeta/shared';
import { api, ApiError } from '../lib/api';
import { fmtMoney, fmtDate } from '../lib/format';
import { Spinner } from './Stats';

const STATUS_CLS: Record<string, string> = {
  NEW: 'text-[#F97316] bg-[#F97316]/10 border-[#F97316]/20',
  ACCEPTED: 'text-[#5555E7] bg-[#5555E7]/10 border-[#5555E7]/20',
  PREPARING: 'text-[#C084FC] bg-[#C084FC]/10 border-[#C084FC]/20',
  IN_TRANSIT: 'text-[#22D3EE] bg-[#22D3EE]/10 border-[#22D3EE]/20',
  PENDING_PAYMENT: 'text-[#F97316] bg-[#F97316]/10 border-[#F97316]/20',
  PAID: 'text-[#10B981] bg-[#10B981]/10 border-[#10B981]/20',
  DELIVERED: 'text-[#10B981] bg-[#10B981]/10 border-[#10B981]/20',
  CANCELLED: 'text-[#BCC0C7] bg-[#343841]/40 border-[#343841]',
};

// Joriy statusdan keyingi ruxsat etilgan o'tishlar (backend bilan bir xil).
// DELIVERED va CANCELLED — yakuniy holatlar.
const FLOW: OrderStatus[] = ['NEW', 'ACCEPTED', 'PREPARING', 'IN_TRANSIT', 'DELIVERED'];
function nextStatuses(current: string): OrderStatus[] {
  const idx = FLOW.indexOf(current as OrderStatus);
  if (idx === -1 || idx === FLOW.length - 1) return [];
  return [FLOW[idx + 1], 'CANCELLED'];
}

export function VendorOrders() {
  const { t } = useTranslation();
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [toast, setToast] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);

  useEffect(() => {
    api.get<Order[]>('/vendor/orders').then(setOrders).catch(() => setOrders([]));
  }, []);

  function flash(kind: 'ok' | 'err', text: string) {
    setToast({ kind, text });
    window.setTimeout(() => setToast(null), 2500);
  }

  async function changeStatus(o: Order, status: OrderStatus) {
    if (status === 'CANCELLED' && !confirm(t('orders.confirmCancel', { no: o.no }))) return;
    try {
      const updated = await api.patch<Order>(`/vendor/orders/${o.id}/status`, { status });
      setOrders((prev) => prev!.map((x) => (x.id === o.id ? { ...x, status: updated.status } : x)));
      flash('ok', t('orders.updated'));
    } catch (e) {
      flash('err', e instanceof ApiError ? e.message : t('common.error'));
    }
  }

  if (!orders) return <Spinner />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold text-white font-display tracking-tight">{t('orders.title')}</h1>
        <p className="text-[#BCC0C7] mt-1">{t('orders.subtitle')}</p>
      </div>

      {toast && (
        <div
          className={`px-4 py-2.5 rounded-xl border text-sm ${
            toast.kind === 'ok'
              ? 'text-[#10B981] bg-[#10B981]/10 border-[#10B981]/20'
              : 'text-[#ff6b6b] bg-[#E11919]/10 border-[#E11919]/30'
          }`}
        >
          {toast.text}
        </div>
      )}

      {orders.length === 0 ? (
        <div className="glass-panel rounded-2xl p-16 text-center text-[#BCC0C7]">
          <Icon icon="lucide:inbox" className="w-10 h-10 mx-auto mb-3 opacity-40" />
          {t('orders.none')}
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((o) => (
            <OrderCard key={o.id} order={o} onStatus={changeStatus} onFlash={flash} />
          ))}
        </div>
      )}
    </div>
  );
}

function OrderCard({
  order: o,
  onStatus,
  onFlash,
}: {
  order: Order;
  onStatus: (o: Order, s: OrderStatus) => void;
  onFlash: (kind: 'ok' | 'err', text: string) => void;
}) {
  const { t } = useTranslation();
  const [msg, setMsg] = useState('');
  const [sending, setSending] = useState(false);
  const [showMsg, setShowMsg] = useState(false);
  const next = nextStatuses(o.status);

  async function sendMessage() {
    if (!msg.trim()) return;
    setSending(true);
    try {
      await api.post(`/vendor/orders/${o.id}/message`, { text: msg.trim() });
      setMsg('');
      setShowMsg(false);
      onFlash('ok', t('orders.sent'));
    } catch (e) {
      onFlash('err', e instanceof ApiError ? e.message : t('common.error'));
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="glass-panel rounded-2xl p-5">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <div>
          <p className="text-sm font-bold text-white">
            <span className="text-[#FF6B1A]">#{o.no}</span> · {o.customerName} ·{' '}
            <span className="text-[#BCC0C7] font-normal">{o.customerPhone}</span>
          </p>
          {o.address && <p className="text-[12px] text-[#7A7F8A]">{o.address}</p>}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[10px] text-[#7A7F8A]">{fmtDate(o.createdAt)}</span>
          <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${STATUS_CLS[o.status] ?? STATUS_CLS.NEW}`}>
            {t(`orders.statuses.${o.status}`)}
          </span>
        </div>
      </div>

      <div className="border-t border-[#343841]/40 pt-3 space-y-1">
        {o.items.map((it) => (
          <div key={it.id} className="flex justify-between text-sm">
            <span className="text-[#BCC0C7]">{it.name} × {it.qty} {it.unit}</span>
            <span className="text-white font-medium">{fmtMoney(it.lineTotal, o.currency)}</span>
          </div>
        ))}
        <div className="flex justify-between pt-2 mt-1 border-t border-[#343841]/40">
          <span className="text-sm font-bold text-white">{t('orders.total')}</span>
          <span className="text-sm font-bold text-[#FF6B1A]">{fmtMoney(o.total, o.currency)}</span>
        </div>
      </div>

      {/* Status boshqaruvi + xabar */}
      <div className="mt-4 pt-3 border-t border-[#343841]/40 flex flex-wrap items-center gap-2">
          {next.map((st) => (
            <button
              key={st}
              onClick={() => onStatus(o, st)}
              className={`px-3.5 py-2 rounded-xl text-[12px] font-bold border transition-colors ${
                st === 'CANCELLED'
                  ? 'text-[#E11919] border-[#E11919]/30 hover:bg-[#E11919]/10'
                  : 'text-white bg-[#5555E7] border-[#5555E7] hover:bg-[#4444d6]'
              }`}
            >
              {t(`orders.actions.${st}`)}
            </button>
          ))}
          <button
            onClick={() => setShowMsg((v) => !v)}
            className="px-3.5 py-2 rounded-xl text-[12px] font-bold border border-[#22D3EE]/30 text-[#22D3EE] hover:bg-[#22D3EE]/5 flex items-center gap-1.5"
          >
            <Icon icon="lucide:message-circle" className="w-3.5 h-3.5" />
            {t('orders.message')}
          </button>
        </div>

      {showMsg && (
        <div className="mt-3 flex gap-2">
          <input
            value={msg}
            onChange={(e) => setMsg(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') sendMessage(); }}
            placeholder={t('orders.messagePh')}
            maxLength={1000}
            className="flex-1 bg-[#16181D] border border-[#343841]/50 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-[#22D3EE]/50"
          />
          <button
            onClick={sendMessage}
            disabled={sending || !msg.trim()}
            className="px-4 py-2 bg-[#22D3EE] text-[#16181D] rounded-xl text-sm font-bold disabled:opacity-50 flex items-center gap-1.5"
          >
            {sending ? <Icon icon="lucide:loader" className="w-4 h-4 animate-spin" /> : <Icon icon="lucide:send" className="w-4 h-4" />}
            {t('orders.send')}
          </button>
        </div>
      )}
    </div>
  );
}
