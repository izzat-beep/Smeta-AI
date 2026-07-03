import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Icon } from '@iconify/react';
import { useTranslation } from 'react-i18next';
import type { Order } from '@smeta/shared';
import { api } from '../lib/api';
import { useCurrency } from '../lib/currency';

// To'lov sahifasi — hozircha placeholder. Payme/Click integratsiyasi keyin.
// Buyurtma statusi: PENDING_PAYMENT -> (keyin) PAID -> DELIVERED.
export function Payment() {
  const { orderId } = useParams<{ orderId: string }>();
  const { t } = useTranslation();
  const { fmt } = useCurrency();
  const [order, setOrder] = useState<Order | null>(null);

  useEffect(() => {
    api.get<Order>(`/orders/${orderId}`).then(setOrder).catch(() => setOrder(null));
  }, [orderId]);

  return (
    <div className="p-4 lg:p-10 max-w-[640px] mx-auto w-full space-y-6">
      <div className="glass-panel rounded-2xl p-8 text-center space-y-3">
        <div className="w-16 h-16 rounded-full bg-[#10B981]/15 flex items-center justify-center mx-auto">
          <Icon icon="lucide:check-circle" className="w-9 h-9 text-[#10B981]" />
        </div>
        <h1 className="text-2xl font-display font-extrabold text-white">{t('payment.orderCreated')}</h1>
        {order && <p className="text-sm text-[#BCC0C7]">{t('payment.orderId')}: <span className="font-mono text-white">#{order.id.slice(-8).toUpperCase()}</span></p>}
      </div>

      {order && (
        <div className="glass-panel rounded-2xl p-6 space-y-3">
          <div className="space-y-2">
            {order.items.map((it) => (
              <div key={it.id} className="flex justify-between text-sm">
                <span className="text-[#BCC0C7]">{it.name} × {it.qty}</span>
                <span className="text-white font-medium">{fmt(it.lineTotal)}</span>
              </div>
            ))}
          </div>
          <div className="pt-3 border-t border-[#343841]/40 flex justify-between items-center">
            <span className="text-sm font-bold text-white">{t('payment.total')}</span>
            <span className="text-xl font-display font-black text-[#FF6B1A]">{fmt(order.total)}</span>
          </div>
          <div className="flex justify-between items-center pt-2">
            <span className="text-sm text-[#BCC0C7]">{t('payment.status')}</span>
            <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full border text-[#F97316] bg-[#F97316]/10 border-[#F97316]/20">{t('payment.statusPending')}</span>
          </div>
        </div>
      )}

      {/* To'lov placeholder — integratsiya keyin */}
      <div className="glass-panel rounded-2xl p-8 text-center space-y-3 border border-dashed border-[#5555E7]/30">
        <Icon icon="lucide:credit-card" className="w-12 h-12 text-[#5555E7]/60 mx-auto" />
        <h3 className="text-lg font-bold text-white">{t('payment.comingSoon')}</h3>
        <p className="text-sm text-[#BCC0C7] max-w-md mx-auto leading-relaxed">{t('payment.comingSoonDesc')}</p>
        <div className="flex items-center justify-center gap-3 pt-2 opacity-50">
          <span className="text-xs font-bold text-[#00CFA6]">Payme</span>
          <span className="text-xs font-bold text-[#0099FF]">Click</span>
        </div>
      </div>

      <div className="flex justify-center">
        <Link to="/app/materiallar" className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#16181D] border border-[#343841]/60 text-white rounded-xl text-sm font-medium hover:bg-[#343841]/30">
          <Icon icon="lucide:arrow-left" className="w-4 h-4" /> {t('payment.backToCatalog')}
        </Link>
      </div>
    </div>
  );
}
