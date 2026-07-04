import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Icon } from '@iconify/react';
import { useTranslation } from 'react-i18next';
import { useAdminAuth } from '../lib/auth';
import { setLanguage, type Lang } from '../i18n';

const STAFF_NAV = [
  { to: '/', key: 'nav.stats', icon: 'lucide:layout-dashboard', end: true },
  { to: '/mijozlar', key: 'nav.tenants', icon: 'lucide:building-2' },
  { to: '/sotuvchilar', key: 'nav.vendors', icon: 'lucide:store' },
  { to: '/hisob-fakturalar', key: 'nav.invoices', icon: 'lucide:receipt' },
  { to: '/foydalanuvchilar', key: 'nav.users', icon: 'lucide:users' },
];

const VENDOR_NAV = [
  { to: '/mahsulotlar', key: 'nav.products', icon: 'lucide:package', end: true },
  { to: '/buyurtmalar', key: 'nav.orders', icon: 'lucide:shopping-cart' },
];

export function AdminLayout() {
  const { t } = useTranslation();
  const { role, admin, vendor, isVendor, logout } = useAdminAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const nav = isVendor ? VENDOR_NAV : STAFF_NAV;
  const displayName = isVendor ? vendor?.shopName || vendor?.name : admin?.fullName;
  const displaySub = isVendor ? vendor?.login : admin?.email;
  const roleLabel = role === 'VENDOR' ? t('header.vendor') : role === 'SUPERADMIN' ? t('header.superAdmin') : t('header.admin');

  function handleLogout() {
    logout();
    navigate('/kirish');
  }

  return (
    <div className="flex min-h-screen bg-[#16181D] text-[#BCC0C7] font-sans relative overflow-x-hidden">
      <div className="fixed top-[-149px] right-[-100px] w-[576px] h-[593px] bg-[#5555E7]/10 rounded-full blur-[120px] pointer-events-none z-0" />

      <aside className="w-64 hidden md:flex flex-col border-r border-[#343841]/40 bg-[#16181D]/40 backdrop-blur-xl sticky top-0 h-screen z-50">
        <SidebarContent nav={nav} name={displayName} sub={displaySub} isVendor={isVendor} onLogout={handleLogout} />
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-[60] md:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-72 max-w-[82%] bg-[#16181D] border-r border-[#343841]/40 flex flex-col shadow-2xl">
            <SidebarContent nav={nav} name={displayName} sub={displaySub} isVendor={isVendor} onLogout={() => { setMobileOpen(false); handleLogout(); }} onNavigate={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}

      <main className="flex-1 flex flex-col min-w-0 z-10">
        <header className="h-16 border-b border-[#343841]/40 bg-[#16181D]/60 backdrop-blur-2xl sticky top-0 z-40 px-4 md:px-10 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <button onClick={() => setMobileOpen(true)} className="w-11 h-11 -ml-1.5 flex items-center justify-center rounded-xl hover:bg-white/5 text-white md:hidden" aria-label="Menu">
              <Icon icon="lucide:menu" className="w-6 h-6" />
            </button>
            <h2 className="font-display text-base md:text-lg font-bold text-white truncate">{isVendor ? t('header.vendorPanel') : t('header.title')}</h2>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <LanguageSwitcher />
            <span className="px-3 py-1 bg-[#06B6D4]/5 border border-[#06B6D4]/30 rounded-full text-[12px] font-semibold text-[#22D3EE]">{roleLabel}</span>
          </div>
        </header>
        <div className="flex-1 p-4 md:p-10 max-w-[1300px] w-full mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const current = (i18n.language === 'ru' ? 'ru' : 'uz') as Lang;
  return (
    <div className="flex bg-[#343841]/50 border border-[#343841]/50 rounded-full p-0.5 text-[11px] font-bold uppercase">
      {(['uz', 'ru'] as Lang[]).map((l) => (
        <button key={l} onClick={() => setLanguage(l)} className={`px-2.5 py-1 rounded-full transition-colors ${current === l ? 'bg-[#5555E7] text-white' : 'text-[#BCC0C7] hover:text-white'}`}>
          {l === 'uz' ? 'UZ' : 'RU'}
        </button>
      ))}
    </div>
  );
}

function SidebarContent({
  nav,
  name,
  sub,
  isVendor,
  onLogout,
  onNavigate,
}: {
  nav: { to: string; key: string; icon: string; end?: boolean }[];
  name?: string | null;
  sub?: string | null;
  isVendor: boolean;
  onLogout: () => void;
  onNavigate?: () => void;
}) {
  const { t } = useTranslation();
  return (
    <div className="p-4 flex flex-col h-full">
      <div className="flex items-center gap-2 px-2 mb-2 h-16 overflow-hidden">
        <img src="/logo.svg" alt="Smeta AI" className="h-12 w-auto object-contain shrink-0" />
        <div className="text-[10px] text-[#BCC0C7] uppercase tracking-widest font-bold">{isVendor ? t('header.vendorPanel') : t('header.adminPanel')}</div>
      </div>

      <nav className="flex-1 space-y-1 pt-6">
        {nav.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={onNavigate}
            className={({ isActive }) =>
              `w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all ${isActive ? 'bg-[#5555E7]/10 border border-[#5555E7]/20 text-[#5555E7]' : 'hover:bg-white/5 text-[#BCC0C7]'}`
            }
          >
            {({ isActive }) => (
              <>
                <Icon icon={item.icon} className={`w-5 h-5 ${isActive ? 'text-[#FF6B1A]' : 'text-[#22D3EE]'}`} />
                <span className="text-sm font-medium">{t(item.key)}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-[#343841]/40 pt-4">
        <div className="px-2 mb-3">
          <p className="text-sm font-medium text-white truncate">{name}</p>
          <p className="text-[10px] text-[#BCC0C7] truncate">{sub}</p>
        </div>
        <button onClick={onLogout} className="w-full flex items-center gap-4 px-4 py-3 hover:bg-red-500/10 rounded-xl text-[#E11919]">
          <Icon icon="lucide:log-out" className="w-5 h-5" />
          <span className="text-sm font-medium">{t('common.logout')}</span>
        </button>
      </div>
    </div>
  );
}
