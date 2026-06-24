import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Icon } from '@iconify/react';
import { useAdminAuth } from '../lib/auth';

const NAV = [
  { to: '/', label: 'Statistika', icon: 'lucide:layout-dashboard', end: true },
  { to: '/mijozlar', label: 'Mijozlar', icon: 'lucide:building-2' },
  { to: '/hisob-fakturalar', label: 'Hisob-fakturalar', icon: 'lucide:receipt' },
  { to: '/foydalanuvchilar', label: 'Foydalanuvchilar', icon: 'lucide:users' },
];

export function AdminLayout() {
  const { admin, logout } = useAdminAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  function handleLogout() {
    logout();
    navigate('/kirish');
  }

  return (
    <div className="flex min-h-screen bg-[#16181D] text-[#BCC0C7] font-sans relative overflow-x-hidden">
      <div className="fixed top-[-149px] right-[-100px] w-[576px] h-[593px] bg-[#5555E7]/10 rounded-full blur-[120px] pointer-events-none z-0" />

      {/* Desktop sidebar (md+) */}
      <aside className="w-64 hidden md:flex flex-col border-r border-[#343841]/40 bg-[#16181D]/40 backdrop-blur-xl sticky top-0 h-screen z-50">
        <SidebarContent admin={admin} onLogout={handleLogout} />
      </aside>

      {/* Mobil drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-[60] md:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-72 max-w-[82%] bg-[#16181D] border-r border-[#343841]/40 flex flex-col shadow-2xl">
            <SidebarContent
              admin={admin}
              onLogout={() => { setMobileOpen(false); handleLogout(); }}
              onNavigate={() => setMobileOpen(false)}
            />
          </aside>
        </div>
      )}

      <main className="flex-1 flex flex-col min-w-0 z-10">
        <header className="h-16 border-b border-[#343841]/40 bg-[#16181D]/60 backdrop-blur-2xl sticky top-0 z-40 px-4 md:px-10 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <button
              onClick={() => setMobileOpen(true)}
              className="w-11 h-11 -ml-1.5 flex items-center justify-center rounded-xl hover:bg-white/5 text-white md:hidden"
              aria-label="Menyuni ochish"
            >
              <Icon icon="lucide:menu" className="w-6 h-6" />
            </button>
            <h2 className="font-display text-base md:text-lg font-bold text-white truncate">Boshqaruv markazi</h2>
          </div>
          <span className="shrink-0 px-3 py-1 bg-[#06B6D4]/5 border border-[#06B6D4]/30 rounded-full text-[12px] font-semibold text-[#22D3EE]">
            {admin?.role === 'SUPERADMIN' ? 'Super Admin' : 'Admin'}
          </span>
        </header>
        <div className="flex-1 p-4 md:p-10 max-w-[1300px] w-full mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

function SidebarContent({
  admin,
  onLogout,
  onNavigate,
}: {
  admin: { fullName?: string; email?: string } | null | undefined;
  onLogout: () => void;
  onNavigate?: () => void;
}) {
  return (
    <div className="p-4 flex flex-col h-full">
      <div className="flex items-center gap-2 px-2 mb-2 h-16 overflow-hidden">
        <img src="/logo.svg" alt="Smeta AI" className="h-12 w-auto object-contain shrink-0" />
        <div className="text-[10px] text-[#BCC0C7] uppercase tracking-widest font-bold">Admin Panel</div>
      </div>

      <nav className="flex-1 space-y-1 pt-6">
        {NAV.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={onNavigate}
            className={({ isActive }) =>
              `w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all ${
                isActive
                  ? 'bg-[#5555E7]/10 border border-[#5555E7]/20 text-[#5555E7]'
                  : 'hover:bg-white/5 text-[#BCC0C7]'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon icon={item.icon} className={`w-5 h-5 ${isActive ? 'text-[#FF6B1A]' : 'text-[#22D3EE]'}`} />
                <span className="text-sm font-medium">{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-[#343841]/40 pt-4">
        <div className="px-2 mb-3">
          <p className="text-sm font-medium text-white truncate">{admin?.fullName}</p>
          <p className="text-[10px] text-[#BCC0C7] truncate">{admin?.email}</p>
        </div>
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-4 px-4 py-3 hover:bg-red-500/10 rounded-xl text-[#E11919]"
        >
          <Icon icon="lucide:log-out" className="w-5 h-5" />
          <span className="text-sm font-medium">Chiqish</span>
        </button>
      </div>
    </div>
  );
}
