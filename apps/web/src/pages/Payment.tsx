import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Icon } from '@iconify/react';
import { useTranslation } from 'react-i18next';
import type { Order } from '@smeta/shared';
import { api } from '../lib/api';
import { useCurrency } from '../lib/currency';

// Buyurtma tafsiloti + to'lov placeholder (Payme/Click integratsiyasi keyin).
// Status oqimi: NEW -> ACCEPTED -> PREPARING -> IN_TRANSIT -> DELIVERED (+ CANCELLED).
// Bildirishnoma bosilganda shu sahifa ochiladi — real status ko'rsatiladi.

const STATUS_CLS: Record<string, string> = {
  NEW: 'text-[#F97316] bg-[#F97316]/10 border-[#F97316]/20',
  ACCEPTED: 'text-[#5555E7] bg-[#5555E7]/10 border-[#5555E7]/20',
  PREPARING: 'text-[#C084FC] bg-[#C084FC]/10 border-[#C084FC]/20',
  IN_TRANSIT: 'text-[#22D3EE] bg-[#22D3EE]/10 border-[#22D3EE]/20',
  PENDING_PAYMENT: 'text-[#F97316] bg-[#F97316]/10 border-[#F97316]/20',
  PAID: 'text-[#10B981] bg-[#10B981]/10 border-[#10B981]/20',
  DELIVERED: 'text-[#10B981] bg-[#10B981]/10 border-[#10B981]/20',
  CANCELLED: 'text-[var(--c-muted)] bg-[var(--c-border)]/40 border-[var(--c-border)]',
};

const FLOW = ['NEW', 'ACCEPTED', 'PREPARING', 'IN_TRANSIT', 'DELIVERED'] as const;

export function Payment() {
  const { orderId } = useParams<{ orderId: string }>();
  const { t } = useTranslation();
  const { fmt } = useCurrency();
  const [order, setOrder] = useState<Order | null>(null);

  useEffect(() => {
    api.get<Order>(`/orders/${orderId}`).then(setOrder).catch(() => setOrder(null));
  }, [orderId]);

  const cancelled = order?.status === 'CANCELLED';
  const flowIdx = order ? FLOW.indexOf(order.status as (typeof FLOW)[number]) : -1;

  return (
    <div className="p-4 lg:p-10 max-w-[640px] mx-auto w-full space-y-6">
      <div className="glass-panel rounded-2xl p-8 text-center space-y-3">
        <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto ${cancelled ? 'bg-[#E11919]/15' : 'bg-[#10B981]/15'}`}>
          <Icon icon={cancelled ? 'lucide:x-circle' : 'lucide:check-circle'} className={`w-9 h-9 ${cancelled ? 'text-[#E11919]' : 'text-[#10B981]'}`} />
        </div>
        <h1 className="text-2xl font-display font-extrabold text-white">
          {cancelled ? t('orderStatus.CANCELLED') : t('payment.orderCreated')}
        </h1>
        {order && <p className="text-sm text-[var(--c-muted)]">{t('payment.orderId')}: <span className="font-mono text-white">#{order.no || order.id.slice(-8).toUpperCase()}</span></p>}
      </div>

      {order && (
        <div className="glass-panel rounded-2xl p-6 space-y-3">
          <div className="space-y-2">
            {order.items.map((it) => (
              <div key={it.id} className="flex justify-between text-sm">
                <span className="text-[var(--c-muted)]">{it.name} × {it.qty}</span>
                <span className="text-white font-medium">{fmt(it.lineTotal)}</span>
              </div>
            ))}
          </div>
          <div className="pt-3 border-t border-[var(--c-border)]/40 flex justify-between items-center">
            <span className="text-sm font-bold text-white">{t('payment.total')}</span>
            <span className="text-xl font-display font-black text-[#FF6B1A]">{fmt(order.total)}</span>
          </div>
          <div className="flex justify-between items-center pt-2">
            <span className="text-sm text-[var(--c-muted)]">{t('payment.status')}</span>
            <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${STATUS_CLS[order.status] ?? STATUS_CLS.NEW}`}>
              {t(`orderStatus.${order.status}`)}
            </span>
          </div>

          {/* Status yo'li (bekor qilinmagan bo'lsa) */}
          {!cancelled && flowIdx >= 0 && (
            <div className="pt-4 flex items-center gap-1">
              {FLOW.map((st, i) => (
                <div key={st} className="flex-1 flex flex-col items-center gap-1.5">
                  <div className={`w-full h-1.5 rounded-full ${i <= flowIdx ? 'bg-[#FF6B1A]' : 'bg-[var(--c-border)]/50'}`} />
                  <span className={`text-[9px] text-center leading-tight ${i <= flowIdx ? 'text-white' : 'text-[var(--c-muted)]/50'}`}>
                    {t(`orderStatus.${st}`)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* To'lov placeholder — integratsiya keyin */}
      <div className="glass-panel rounded-2xl p-8 text-center space-y-3 border border-dashed border-[#5555E7]/30">
        <Icon icon="lucide:credit-card" className="w-12 h-12 text-[#5555E7]/60 mx-auto" />
        <h3 className="text-lg font-bold text-white">{t('payment.comingSoon')}</h3>
        <p className="text-sm text-[var(--c-muted)] max-w-md mx-auto leading-relaxed">{t('payment.comingSoonDesc')}</p>
        <div className="flex items-center justify-center gap-3 pt-2 opacity-50">
          <span className="text-xs font-bold text-[#00CFA6]">Payme</span>
          <span className="text-xs font-bold text-[#0099FF]">Click</span>
        </div>
      </div>

      <div className="flex justify-center">
        <Link to="/app/materiallar" className="inline-flex items-center gap-2 px-6 py-2.5 bg-[var(--c-bg)] border border-[var(--c-border)]/60 text-white rounded-xl text-sm font-medium hover:bg-[var(--c-border)]/30">
          <Icon icon="lucide:arrow-left" className="w-4 h-4" /> {t('payment.backToCatalog')}
        </Link>
      </div>
    </div>
  );
}
