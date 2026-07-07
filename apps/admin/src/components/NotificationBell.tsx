// Sotuvchi (vendor) uchun qo'ng'iroqcha + badge + dropdown (Vazifa 1).
// /api/admin/vendor/notifications endpointlaridan 30 soniyalik polling.
import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '@iconify/react';
import { useTranslation } from 'react-i18next';
import type { Notification } from '@smeta/shared';
import { api } from '../lib/api';
import { fmtRelative } from '../lib/format';

const POLL_MS = 30_000;
const BASE = '/vendor/notifications';

export function NotificationBell() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [count, setCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Notification[] | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  const refreshCount = useCallback(async () => {
    try {
      const r = await api.get<{ count: number }>(`${BASE}/unread-count`);
      setCount(r.count);
    } catch {
      /* keyingi polling'da urinamiz */
    }
  }, []);

  useEffect(() => {
    refreshCount();
    const id = window.setInterval(refreshCount, POLL_MS);
    const onFocus = () => refreshCount();
    window.addEventListener('focus', onFocus);
    return () => {
      window.clearInterval(id);
      window.removeEventListener('focus', onFocus);
    };
  }, [refreshCount]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  async function toggle() {
    const next = !open;
    setOpen(next);
    if (next) {
      setItems(null);
      try {
        const r = await api.get<{ items: Notification[] }>(`${BASE}?page=1&pageSize=15`);
        setItems(r.items);
      } catch {
        setItems([]);
      }
    }
  }

  function text(n: Notification): { title: string; body: string } {
    const no = n.data?.orderNo;
    if (n.type === 'NEW_ORDER' && no) {
      return { title: t('notif.newOrderTitle', { no }), body: t('notif.newOrderBody', { no }) };
    }
    return { title: n.title, body: n.body };
  }

  function onItem(n: Notification) {
    if (!n.isRead) {
      setItems((prev) => prev?.map((x) => (x.id === n.id ? { ...x, isRead: true } : x)) ?? null);
      setCount((c) => Math.max(0, c - 1));
      api.patch(`${BASE}/${n.id}/read`, {}).catch(() => {});
    }
    if (n.orderId) {
      setOpen(false);
      navigate('/buyurtmalar');
    }
  }

  function markAll() {
    setItems((prev) => prev?.map((x) => ({ ...x, isRead: true })) ?? null);
    setCount(0);
    api.patch(`${BASE}/read-all`, {}).catch(() => {});
  }

  return (
    <div ref={wrapRef} className="relative">
      <button
        onClick={toggle}
        className="relative w-10 h-10 flex items-center justify-center hover:bg-white/5 rounded-lg text-[#BCC0C7]"
        aria-label={t('notif.title')}
      >
        <Icon icon="lucide:bell" className="w-5 h-5" />
        {count > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-[#E11919] text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {count > 99 ? '99+' : count}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-12 w-[320px] sm:w-[360px] max-h-[70vh] flex flex-col bg-[#191B1F] border border-[#343841]/60 rounded-2xl shadow-2xl z-[70] overflow-hidden">
          <div className="px-4 py-3 border-b border-[#343841]/40 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-white">{t('notif.title')}</span>
              {count > 0 && <span className="text-[10px] text-[#BCC0C7]">{t('notif.unreadCount', { count })}</span>}
            </div>
            {count > 0 && (
              <button onClick={markAll} className="text-[11px] text-[#22D3EE] hover:underline">
                {t('notif.readAll')}
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {items === null ? (
              <div className="p-8 flex justify-center">
                <Icon icon="lucide:loader" className="w-5 h-5 animate-spin text-[#5555E7]" />
              </div>
            ) : items.length === 0 ? (
              <div className="p-8 text-center space-y-2">
                <Icon icon="lucide:bell-off" className="w-8 h-8 mx-auto text-[#BCC0C7]/40" />
                <p className="text-xs text-[#BCC0C7]">{t('notif.empty')}</p>
              </div>
            ) : (
              <div className="divide-y divide-[#343841]/30">
                {items.map((n) => {
                  const txt = text(n);
                  return (
                    <button
                      key={n.id}
                      onClick={() => onItem(n)}
                      className={`w-full text-left px-4 py-3 flex gap-3 hover:bg-white/5 transition-colors ${n.isRead ? 'opacity-60' : ''}`}
                    >
                      <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-[#FF6B1A] bg-[#FF6B1A]/10">
                        <Icon icon="lucide:shopping-bag" className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-[12px] font-bold text-white truncate">{txt.title}</p>
                          {!n.isRead && <span className="w-2 h-2 rounded-full bg-[#FF6B1A] shrink-0" />}
                        </div>
                        <p className="text-[12px] text-[#BCC0C7] leading-snug line-clamp-2">{txt.body}</p>
                        <p className="text-[10px] text-[#BCC0C7]/50 mt-0.5">{fmtRelative(n.createdAt)}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
