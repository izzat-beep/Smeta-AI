import { useEffect, useState } from 'react';
import { Icon } from '@iconify/react';
import { useTranslation } from 'react-i18next';
import type { Order } from '@smeta/shared';
import { api } from '../lib/api';
import { fmtMoney, fmtDate } from '../lib/format';
import { Spinner } from './Stats';

const STATUS_CLS: Record<string, string> = {
  PENDING_PAYMENT: 'text-[#F97316] bg-[#F97316]/10 border-[#F97316]/20',
  PAID: 'text-[#10B981] bg-[#10B981]/10 border-[#10B981]/20',
  DELIVERED: 'text-[#22D3EE] bg-[#22D3EE]/10 border-[#22D3EE]/20',
  CANCELLED: 'text-[#BCC0C7] bg-[#343841]/40 border-[#343841]',
};

export function VendorOrders() {
  const { t } = useTranslation();
  const [orders, setOrders] = useState<Order[] | null>(null);

  useEffect(() => {
    api.get<Order[]>('/vendor/orders').then(setOrders).catch(() => setOrders([]));
  }, []);

  function statusLabel(s: string) {
    return s === 'PAID' ? t('orders.statusPaid') : s === 'DELIVERED' ? t('orders.statusDelivered') : s === 'CANCELLED' ? t('orders.statusCancelled') : t('orders.statusPending');
  }

  if (!orders) return <Spinner />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold text-white font-display tracking-tight">{t('orders.title')}</h1>
        <p className="text-[#BCC0C7] mt-1">{t('orders.subtitle')}</p>
      </div>

      {orders.length === 0 ? (
        <div className="glass-panel rounded-2xl p-16 text-center text-[#BCC0C7]">
          <Icon icon="lucide:inbox" className="w-10 h-10 mx-auto mb-3 opacity-40" />
          {t('orders.none')}
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((o) => (
            <div key={o.id} className="glass-panel rounded-2xl p-5">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                <div>
                  <p className="text-sm font-bold text-white">{o.customerName} · <span className="text-[#BCC0C7] font-normal">{o.customerPhone}</span></p>
                  {o.address && <p className="text-[12px] text-[#7A7F8A]">{o.address}</p>}
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] text-[#7A7F8A]">{fmtDate(o.createdAt)}</span>
                  <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${STATUS_CLS[o.status]}`}>{statusLabel(o.status)}</span>
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
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
