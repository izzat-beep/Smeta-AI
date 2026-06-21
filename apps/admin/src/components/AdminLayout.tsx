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

  return (
    <div className="flex min-h-screen bg-[#16181D] text-[#BCC0C7] font-sans relative overflow-x-hidden">
      <div className="fixed top-[-149px] right-[-100px] w-[576px] h-[593px] bg-[#5555E7]/10 rounded-full blur-[120px] pointer-events-none z-0" />

      <aside className="w-64 hidden md:flex flex-col border-r border-[#343841]/40 bg-[#16181D]/40 backdrop-blur-xl sticky top-0 h-screen z-50">
        <div className="p-4 flex flex-col h-full">
          <div className="flex items-center gap-2 px-2 mb-2 h-9">
            <img src="/logo.svg" alt="Smeta AI" className="h-9 w-auto object-contain" />
            <div className="text-[10px] text-[#BCC0C7] uppercase tracking-widest font-bold">Admin Panel</div>
          </div>

          <nav className="flex-1 space-y-1 pt-6">
            {NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
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
              <p className="text-sm font-medium text-white">{admin?.fullName}</p>
              <p className="text-[10px] text-[#BCC0C7]">{admin?.email}</p>
            </div>
            <button
              onClick={() => { logout(); navigate('/kirish'); }}
              className="w-full flex items-center gap-4 px-4 py-3 hover:bg-red-500/10 rounded-xl text-[#E11919]"
            >
              <Icon icon="lucide:log-out" className="w-5 h-5" />
              <span className="text-sm font-medium">Chiqish</span>
            </button>
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 z-10">
        <header className="h-16 border-b border-[#343841]/40 bg-[#16181D]/60 backdrop-blur-2xl sticky top-0 z-40 px-4 md:px-10 flex items-center justify-between">
          <h2 className="font-display text-lg font-bold text-white">Boshqaruv markazi</h2>
          <span className="px-3 py-1 bg-[#06B6D4]/5 border border-[#06B6D4]/30 rounded-full text-[12px] font-semibold text-[#22D3EE]">
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
