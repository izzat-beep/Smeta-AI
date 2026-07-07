import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Icon } from '@iconify/react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../lib/auth';
import { useCurrency } from '../lib/currency';
import { useCart } from '../lib/cart';
import { setLanguage, type Lang } from '../i18n';
import { api } from '../lib/api';
import { NotificationBell } from './NotificationBell';

const NAV = [
  { to: '/app', key: 'nav.dashboard', icon: 'lucide:layout-dashboard', end: true },
  { to: '/app/loyihalar', key: 'nav.projects', icon: 'lucide:briefcase' },
  { to: '/app/kalkulyator', key: 'nav.calculator', icon: 'lucide:calculator' },
  { to: '/app/materiallar', key: 'nav.materials', icon: 'lucide:package' },
  { to: '/app/hisobotlar', key: 'nav.reports', icon: 'lucide:chart-column' },
  { to: '/app/sotuvlar', key: 'nav.sales', icon: 'lucide:hand-coins' },
  { to: '/app/maklerlar', key: 'nav.realtors', icon: 'lucide:user-round-cog' },
  { to: '/app/ai', key: 'nav.ai', icon: 'lucide:message-square' },
];

export function Layout() {
  const [open, setOpen] = useState(true); // desktop sidebar yig'ish/yoyish
  const [mobileOpen, setMobileOpen] = useState(false); // mobil drawer
  const { user, tenant, logout } = useAuth();
  const { count } = useCart();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/kirish');
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#16181D] text-[#BCC0C7] font-sans relative">
      {/* Fon bezaklari (qotgan) */}
      <div className="fixed top-[-149px] right-[-100px] w-[576px] h-[593px] bg-[#5555E7]/10 rounded-full blur-[120px] pointer-events-none z-0" />
      <div className="fixed bottom-[-100px] left-[-72px] w-[432px] h-[445px] bg-[#06B6D4]/10 rounded-full blur-[120px] pointer-events-none z-0" />

      {/* ─── Desktop sidebar (md+) — qotib turadi ─── */}
      <aside
        className={`${open ? 'w-64' : 'w-20'} hidden md:flex flex-col border-r border-[#343841]/40 bg-[#16181D]/40 backdrop-blur-xl h-screen shrink-0 transition-all duration-300 z-50 relative`}
      >
        <SidebarContent showLabels={open} onLogout={handleLogout} />
        <button
          onClick={() => setOpen(!open)}
          className="absolute -right-3 top-10 w-6 h-6 bg-[#16181D] border border-[#343841] rounded-full flex items-center justify-center shadow-lg z-50"
          aria-label="Menyu"
        >
          <Icon icon={open ? 'lucide:chevron-left' : 'lucide:chevron-right'} className="w-4 h-4 text-[#BCC0C7]" />
        </button>
      </aside>

      {/* ─── Mobil drawer (md dan kichik) ─── */}
      {mobileOpen && (
        <div className="fixed inset-0 z-[60] md:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-72 max-w-[82%] bg-[#16181D] border-r border-[#343841]/40 flex flex-col shadow-2xl">
            <SidebarContent
              showLabels
              onLogout={() => { setMobileOpen(false); handleLogout(); }}
              onNavigate={() => setMobileOpen(false)}
            />
          </aside>
        </div>
      )}

      {/* ─── Asosiy qism — header qotgan, faqat content scroll ─── */}
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden z-10">
        <header className="h-20 md:h-24 shrink-0 border-b border-[#343841]/40 bg-[#16181D]/60 backdrop-blur-2xl z-40 px-4 md:px-10 flex items-center justify-between gap-3">
          {/* Mobil: hamburger + logo */}
          <div className="flex items-center gap-2 md:hidden">
            <button
              onClick={() => setMobileOpen(true)}
              className="w-11 h-11 -ml-1.5 flex items-center justify-center rounded-xl hover:bg-white/5 text-white"
              aria-label="Menyu"
            >
              <Icon icon="lucide:menu" className="w-6 h-6" />
            </button>
            <img src="/logo.svg" alt="Smeta AI" className="h-9 w-auto object-contain" />
          </div>
          <div className="hidden md:block" />

          <div className="flex items-center gap-2 md:gap-3">
            <LanguageSwitcher />
            <CurrencySwitcher />
            <NotificationBell orderLink={(orderId) => `/app/tolov/${orderId}`} />
            <NavLink to="/app/savat" className="relative w-10 h-10 flex items-center justify-center hover:bg-white/5 rounded-lg" aria-label="Savat">
              <Icon icon="lucide:shopping-cart" className="w-5 h-5" />
              {count > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-[#FF6B1A] text-white text-[10px] font-bold rounded-full flex items-center justify-center">{count}</span>
              )}
            </NavLink>
            <NavLink to="/app/ai" className="w-10 h-10 hidden sm:flex items-center justify-center hover:bg-white/5 rounded-lg">
              <Icon icon="lucide:message-square" className="w-5 h-5" />
            </NavLink>
            <div className="flex items-center gap-2">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-white leading-tight">{user?.fullName ?? 'Foydalanuvchi'}</p>
                <p className="text-[10px] text-[#BCC0C7]">{tenant?.name}</p>
              </div>
              <div className="relative">
                <div className="w-9 h-9 rounded-full overflow-hidden border border-white/10 bg-[#5555E7]/20 flex items-center justify-center text-[#5555E7] font-bold">
                  {user?.avatarUrl ? (
                    <img src={user.avatarUrl} className="w-full h-full object-cover" alt="" />
                  ) : (
                    (user?.fullName ?? 'F').charAt(0)
                  )}
                </div>
                <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-[#26D926] border-2 border-[#16181D] rounded-full" />
              </div>
            </div>
          </div>
        </header>

        {/* Faqat shu konteyner scroll bo'ladi */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

// Til almashtirgich — darhol qo'llanadi va profilga saqlanadi.
function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const current = (i18n.language === 'ru' ? 'ru' : 'uz') as Lang;

  function change(lang: Lang) {
    if (lang === current) return;
    setLanguage(lang);
    api.patch('/settings', { language: lang }).catch(() => {});
  }

  return (
    <div className="flex bg-[#343841]/50 border border-[#343841]/50 rounded-full p-0.5 text-[11px] font-bold uppercase">
      {(['uz', 'ru'] as Lang[]).map((l) => (
        <button
          key={l}
          onClick={() => change(l)}
          className={`px-2.5 py-1 rounded-full transition-colors ${current === l ? 'bg-[#5555E7] text-white' : 'text-[#BCC0C7] hover:text-white'}`}
        >
          {l === 'uz' ? 'UZ' : 'RU'}
        </button>
      ))}
    </div>
  );
}

// Valyuta almashtirgich — barcha summalarga darhol ta'sir qiladi.
function CurrencySwitcher() {
  const { currency, setCurrency } = useCurrency();
  return (
    <div className="flex bg-[#343841]/50 border border-[#343841]/50 rounded-full p-0.5 text-[11px] font-bold">
      {(['UZS', 'USD'] as const).map((c) => (
        <button
          key={c}
          onClick={() => setCurrency(c)}
          className={`px-2.5 py-1 rounded-full transition-colors ${currency === c ? 'bg-[#FF6B1A] text-white' : 'text-[#BCC0C7] hover:text-white'}`}
        >
          {c}
        </button>
      ))}
    </div>
  );
}

// Sidebar ichki qismi — desktop (yig'iladigan) va mobil drawer uchun umumiy.
function SidebarContent({
  showLabels,
  onLogout,
  onNavigate,
}: {
  showLabels: boolean;
  onLogout: () => void;
  onNavigate?: () => void;
}) {
  const { t } = useTranslation();
  return (
    <div className="p-4 flex flex-col h-full min-h-0">
      <div className="flex items-center gap-2 px-2 h-16 shrink-0 overflow-hidden">
        <img
          src="/logo.svg"
          alt="Smeta AI"
          className={showLabels ? 'h-14 w-auto object-contain' : 'w-full object-contain'}
        />
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto custom-scrollbar -mr-2 pr-2 min-h-0">
        {NAV.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={onNavigate}
            title={t(item.key)}
            className={({ isActive }) =>
              `w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all group ${
                isActive
                  ? 'bg-[#5555E7]/10 border border-[#5555E7]/20 text-[#5555E7] shadow-[0_0_15px_rgba(85,85,231,0.1)]'
                  : 'hover:bg-white/5 text-[#BCC0C7]'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon icon={item.icon} className={`w-5 h-5 shrink-0 ${isActive ? 'text-[#FF6B1A]' : 'text-[#22D3EE]'}`} />
                {showLabels && <span className="text-sm font-medium whitespace-nowrap">{t(item.key)}</span>}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-[#343841]/40 pt-4 space-y-1 shrink-0">
        <NavLink
          to="/app/sozlamalar"
          onClick={onNavigate}
          title={t('nav.settings')}
          className={({ isActive }) =>
            `w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-colors ${isActive ? 'bg-[#5555E7]/10 text-[#5555E7]' : 'hover:bg-white/5'}`
          }
        >
          <Icon icon="lucide:settings" className="w-5 h-5 shrink-0" />
          {showLabels && <span className="text-sm font-medium">{t('nav.settings')}</span>}
        </NavLink>
        <button
          onClick={onLogout}
          title={t('nav.logout')}
          className="w-full flex items-center gap-4 px-4 py-3 hover:bg-red-500/10 rounded-xl transition-colors text-[#E11919]"
        >
          <Icon icon="lucide:log-out" className="w-5 h-5 shrink-0" />
          {showLabels && <span className="text-sm font-medium">{t('nav.logout')}</span>}
        </button>
      </div>
    </div>
  );
}
