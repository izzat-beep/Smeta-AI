// Qo'ng'iroqcha + o'qilmaganlar badge + dropdown ro'yxat (Vazifa 1).
// unread-count har 30 soniyada polling qilinadi (sahifa refresh'siz yangilanadi).
// Matnlar clientda type+data (orderNo, status) orqali UZ/RU render qilinadi;
// data bo'lmasa serverdagi title/body (uz fallback) ko'rsatiladi.
import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '@iconify/react';
import { useTranslation } from 'react-i18next';
import type { Notification } from '@smeta/shared';
import { api } from '../lib/api';
import { fmtRelative } from '../lib/format';

const POLL_MS = 30_000;

interface ListResponse {
  items: Notification[];
  total: number;
  page: number;
  pageSize: number;
}

// Bildirishnoma matnini lokalizatsiya qilish (fallback: serverdagi uz matn).
export function useNotifText() {
  const { t } = useTranslation();
  return useCallback(
    (n: Notification): { title: string; body: string } => {
      const no = n.data?.orderNo;
      if (!no) return { title: n.title, body: n.body };
      if (n.type === 'NEW_ORDER') {
        return { title: t('notif.newOrderTitle', { no }), body: t('notif.newOrderBody', { no }) };
      }
      if (n.type === 'ORDER_STATUS' && n.data?.status) {
        return {
          title: t('notif.statusTitle', { no }),
          body: t(`notif.statusBody.${n.data.status}`, { no, defaultValue: n.body }),
        };
      }
      if (n.type === 'MESSAGE') {
        // body — sotuvchining erkin matni, tarjima qilinmaydi
        return { title: t('notif.messageTitle', { no }), body: n.body };
      }
      return { title: n.title, body: n.body };
    },
    [t],
  );
}

const TYPE_ICON: Record<string, { icon: string; cls: string }> = {
  NEW_ORDER: { icon: 'lucide:shopping-bag', cls: 'text-[#FF6B1A] bg-[#FF6B1A]/10' },
  ORDER_STATUS: { icon: 'lucide:truck', cls: 'text-[#22D3EE] bg-[#22D3EE]/10' },
  MESSAGE: { icon: 'lucide:message-circle', cls: 'text-[#5555E7] bg-[#5555E7]/10' },
};

export function NotificationBell({
  basePath = '/notifications',
  orderLink,
}: {
  basePath?: string;
  orderLink?: (orderId: string) => string;
}) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const notifText = useNotifText();
  const [count, setCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Notification[] | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  const refreshCount = useCallback(async () => {
    try {
      const r = await api.get<{ count: number }>(`${basePath}/unread-count`);
      setCount(r.count);
    } catch {
      /* tarmoq xatosi — keyingi polling'da urinamiz */
    }
  }, [basePath]);

  // 30 soniyalik polling + oynaga qaytganda yangilash
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

  // Tashqariga bosilganda yopish
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
        const r = await api.get<ListResponse>(`${basePath}?page=1&pageSize=15`);
        setItems(r.items);
      } catch {
        setItems([]);
      }
    }
  }

  async function markRead(n: Notification) {
    if (!n.isRead) {
      setItems((prev) => prev?.map((x) => (x.id === n.id ? { ...x, isRead: true } : x)) ?? null);
      setCount((c) => Math.max(0, c - 1));
      api.patch(`${basePath}/${n.id}/read`, {}).catch(() => {});
    }
    if (n.orderId && orderLink) {
      setOpen(false);
      navigate(orderLink(n.orderId));
    }
  }

  async function markAll() {
    setItems((prev) => prev?.map((x) => ({ ...x, isRead: true })) ?? null);
    setCount(0);
    api.patch(`${basePath}/read-all`, {}).catch(() => {});
  }

  return (
    <div ref={wrapRef} className="relative">
      <button
        onClick={toggle}
        className="relative w-10 h-10 flex items-center justify-center hover:bg-white/5 rounded-lg"
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
        <div className="absolute right-0 top-12 w-[340px] sm:w-[380px] max-h-[70vh] flex flex-col bg-[var(--c-panel)] border border-[var(--c-border)]/60 rounded-2xl shadow-2xl z-[70] overflow-hidden">
          <div className="px-4 py-3 border-b border-[var(--c-border)]/40 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-white">{t('notif.title')}</span>
              {count > 0 && <span className="text-[10px] text-[var(--c-muted)]">{t('notif.unreadCount', { count })}</span>}
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
                <Icon icon="lucide:bell-off" className="w-8 h-8 mx-auto text-[var(--c-muted)]/40" />
                <p className="text-xs text-[var(--c-muted)]">{t('notif.empty')}</p>
              </div>
            ) : (
              <div className="divide-y divide-[var(--c-border)]/30">
                {items.map((n) => {
                  const txt = notifText(n);
                  const ic = TYPE_ICON[n.type] ?? TYPE_ICON.MESSAGE;
                  return (
                    <button
                      key={n.id}
                      onClick={() => markRead(n)}
                      className={`w-full text-left px-4 py-3 flex gap-3 hover:bg-white/5 transition-colors ${n.isRead ? 'opacity-60' : ''}`}
                    >
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${ic.cls}`}>
                        <Icon icon={ic.icon} className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-[12px] font-bold text-white truncate">{txt.title}</p>
                          {!n.isRead && <span className="w-2 h-2 rounded-full bg-[#FF6B1A] shrink-0" />}
                        </div>
                        <p className="text-[12px] text-[var(--c-muted)] leading-snug line-clamp-2">{txt.body}</p>
                        {n.data?.from && n.type === 'MESSAGE' && (
                          <p className="text-[10px] text-[#5555E7] mt-0.5">{t('notif.from', { from: n.data.from })}</p>
                        )}
                        <p className="text-[10px] text-[var(--c-muted)]/50 mt-0.5">{fmtRelative(n.createdAt)}</p>
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
