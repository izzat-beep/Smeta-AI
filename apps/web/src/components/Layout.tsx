import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Icon } from '@iconify/react';
import { useAuth } from '../lib/auth';

const NAV = [
  { to: '/app', label: 'Boshqaruv paneli', icon: 'lucide:layout-dashboard', end: true },
  { to: '/app/loyihalar', label: 'Loyihalar', icon: 'lucide:briefcase' },
  { to: '/app/kalkulyator', label: 'Kalkulyator', icon: 'lucide:calculator' },
  { to: '/app/materiallar', label: 'Materiallar', icon: 'lucide:package' },
  { to: '/app/hisobotlar', label: 'Hisobotlar', icon: 'lucide:chart-column' },
  { to: '/app/ai', label: 'AI Chat', icon: 'lucide:message-square' },
];

export function Layout() {
  const [open, setOpen] = useState(true);
  const { user, tenant, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/kirish');
  }

  return (
    <div className="flex min-h-screen bg-[#16181D] text-[#BCC0C7] font-sans relative overflow-x-hidden">
      {/* Fon bezaklari */}
      <div className="fixed top-[-149px] right-[-100px] w-[576px] h-[593px] bg-[#5555E7]/10 rounded-full blur-[120px] pointer-events-none z-0" />
      <div className="fixed bottom-[-100px] left-[-72px] w-[432px] h-[445px] bg-[#06B6D4]/10 rounded-full blur-[120px] pointer-events-none z-0" />

      {/* Sidebar */}
      <aside
        className={`${open ? 'w-64' : 'w-20'} hidden md:flex flex-col border-r border-[#343841]/40 bg-[#16181D]/40 backdrop-blur-xl sticky top-0 h-screen transition-all duration-300 z-50`}
      >
        <div className="p-4 flex flex-col h-full">
          <div className="flex items-center gap-2 px-2 mb-6 h-9">
            <div className="w-8 h-8 bg-[#5555E7] rounded-md flex items-center justify-center shrink-0">
              <Icon icon="lucide:hard-hat" className="w-5 h-5 text-white" />
            </div>
            {open && <span className="font-display text-xl font-bold text-[#5555E7]">Smeta AI</span>}
          </div>

          <nav className="flex-1 space-y-1">
            {NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
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
                    {open && <span className="text-sm font-medium whitespace-nowrap">{item.label}</span>}
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          <div className="border-t border-[#343841]/40 pt-4 space-y-1">
            <NavLink
              to="/app/sozlamalar"
              className={({ isActive }) =>
                `w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-colors ${isActive ? 'bg-[#5555E7]/10 text-[#5555E7]' : 'hover:bg-white/5'}`
              }
            >
              <Icon icon="lucide:settings" className="w-5 h-5 shrink-0" />
              {open && <span className="text-sm font-medium">Sozlamalar</span>}
            </NavLink>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-4 px-4 py-3 hover:bg-red-500/10 rounded-xl transition-colors text-[#E11919]"
            >
              <Icon icon="lucide:log-out" className="w-5 h-5 shrink-0" />
              {open && <span className="text-sm font-medium">Chiqish</span>}
            </button>
          </div>
        </div>

        <button
          onClick={() => setOpen(!open)}
          className="absolute -right-3 top-10 w-6 h-6 bg-[#16181D] border border-[#343841] rounded-full flex items-center justify-center shadow-lg z-50"
        >
          <Icon icon={open ? 'lucide:chevron-left' : 'lucide:chevron-right'} className="w-4 h-4 text-[#BCC0C7]" />
        </button>
      </aside>

      {/* Asosiy qism */}
      <main className="flex-1 flex flex-col min-w-0 z-10">
        <header className="h-16 border-b border-[#343841]/40 bg-[#16181D]/60 backdrop-blur-2xl sticky top-0 z-40 px-4 md:px-10 flex items-center justify-between">
          <div className="flex items-center gap-3 md:hidden">
            <div className="w-8 h-8 bg-[#5555E7] rounded-md flex items-center justify-center">
              <Icon icon="lucide:hard-hat" className="w-5 h-5 text-white" />
            </div>
            <span className="font-display text-xl font-bold text-[#5555E7]">Smeta AI</span>
          </div>
          <div className="hidden md:block" />

          <div className="flex items-center gap-2 md:gap-4">
            <div className="hidden lg:flex items-center gap-2 px-3 py-1 bg-[#343841]/50 border border-[#343841]/50 rounded-full text-[12px] font-medium text-white uppercase">
              <Icon icon="lucide:globe" className="w-4 h-4 text-[#22D3EE]" />
              <span>UZ (Lat)</span>
            </div>
            <div className="hidden lg:flex items-center gap-2 px-3 py-1 bg-[#343841]/50 border border-[#343841]/50 rounded-full text-[12px] font-medium text-white uppercase">
              <Icon icon="lucide:wallet" className="w-4 h-4 text-[#F97316]" />
              <span>UZS / USD</span>
            </div>
            <NavLink to="/app/ai" className="p-2 hover:bg-white/5 rounded-lg">
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

        <div className="flex-1">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
