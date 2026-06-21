import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Icon } from '@iconify/react';
import { useAuth } from '../lib/auth';
import { ApiError } from '../lib/api';

export function Login() {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [companyName, setCompanyName] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (mode === 'login') {
        await login({ email, password });
      } else {
        await register({ fullName, email, password, companyName });
      }
      navigate('/app');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen w-full bg-[#16181D] text-[#BCC0C7] font-sans relative overflow-x-hidden flex flex-col">
      <div className="absolute top-[-94px] left-[-144px] w-[576px] h-[376px] bg-[#3DF2FF]/20 rounded-full blur-[120px] opacity-80 pointer-events-none" />
      <div className="absolute bottom-[-100px] right-[-100px] w-[576px] h-[376px] bg-[#FF8E4D]/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden">
        <span className="text-[192px] font-black text-white/[0.03] tracking-[-0.05em] -translate-y-[100px] hidden lg:block">SMETA</span>
      </div>

      <header className="relative z-20 w-full h-20 border-b border-[#343841]/10 backdrop-blur-md flex items-center justify-between px-6 lg:px-10">
        <Link to="/" className="flex items-center gap-3">
          <img src="/logo.svg" alt="Smeta AI" className="h-10 w-auto" />
        </Link>
        <div className="flex items-center gap-4 lg:gap-8">
          <Link to="/" className="text-sm font-medium hover:text-white transition-colors">Asosiy sahifa</Link>
          <div className="h-4 w-px bg-[#343841]/40" />
          <span className="text-[12px] text-[#3DF2FF] tracking-tighter uppercase font-medium">v2.0.26</span>
        </div>
      </header>

      <main className="relative z-10 flex-grow flex flex-col items-center justify-center px-4 py-12">
        <div className="w-full max-w-[448px] bg-[#191B1F]/30 rounded-[32px] border border-[#343841]/40 backdrop-blur-[40px] shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#3DF2FF]/40 to-transparent" />
          <div className="p-8 lg:p-10 flex flex-col items-center">
            <h1 className="text-3xl font-bold font-display text-center mb-2 bg-gradient-to-br from-white to-[#BCC0C7] bg-clip-text text-transparent">
              {mode === 'login' ? 'Xush kelibsiz' : 'Ro‘yxatdan o‘tish'}
            </h1>
            <p className="text-sm text-center text-[#BCC0C7] mb-8">
              {mode === 'login'
                ? 'Qurilish hisob-kitoblarini boshlash uchun tizimga kiring'
                : 'Yangi kompaniya hisobini yarating va 14 kunlik bepul sinovni boshlang'}
            </p>

            {error && (
              <div className="w-full mb-4 px-4 py-3 bg-[#E11919]/10 border border-[#E11919]/30 rounded-xl text-[#ff6b6b] text-sm">
                {error}
              </div>
            )}

            <form className="w-full space-y-5" onSubmit={handleSubmit}>
              {mode === 'register' && (
                <>
                  <Field label="TO‘LIQ ISM" icon="lucide:user">
                    <input value={fullName} onChange={(e) => setFullName(e.target.value)} required placeholder="Ism Familiya" className="bg-transparent border-none outline-none w-full text-sm text-white placeholder:text-[#BCC0C7]/40" />
                  </Field>
                  <Field label="KOMPANIYA NOMI" icon="lucide:building-2">
                    <input value={companyName} onChange={(e) => setCompanyName(e.target.value)} required placeholder="MCHJ nomi" className="bg-transparent border-none outline-none w-full text-sm text-white placeholder:text-[#BCC0C7]/40" />
                  </Field>
                </>
              )}
              <Field label="EMAIL" icon="lucide:mail">
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="example@mail.uz" className="bg-transparent border-none outline-none w-full text-sm text-white placeholder:text-[#BCC0C7]/40" />
              </Field>
              <Field label="PAROL" icon="lucide:lock">
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="••••••••" className="bg-transparent border-none outline-none w-full text-sm text-white placeholder:text-[#BCC0C7]/40" />
              </Field>

              <div className="space-y-4 pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-12 bg-[#FF6B1A] hover:bg-[#FF7B31] text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-[#FF6B1A]/20 transition-all active:scale-[0.98] disabled:opacity-60"
                >
                  {loading ? 'Iltimos kuting...' : mode === 'login' ? 'Kirish' : 'Hisob yaratish'}
                  {!loading && <Icon icon="lucide:arrow-right" className="w-4 h-4" />}
                </button>
                <button
                  type="button"
                  onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(null); }}
                  className="w-full h-12 bg-[#16181D] border border-[#3DF2FF]/30 text-[#3DF2FF] font-semibold rounded-xl hover:bg-[#3DF2FF]/5 transition-all active:scale-[0.98]"
                >
                  {mode === 'login' ? 'Ro‘yxatdan o‘tish' : 'Mavjud hisob bilan kirish'}
                </button>
              </div>
            </form>

          </div>
        </div>
      </main>

      <footer className="relative z-20 w-full py-8 flex items-center justify-center px-6">
        <p className="text-[12px] text-[#BCC0C7]/60 text-center">© 2026 Smeta AI. Barcha huquqlar himoyalangan.</p>
      </footer>
    </div>
  );
}

function Field({ label, icon, children }: { label: string; icon: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <label className="block text-[12px] font-medium tracking-wide uppercase opacity-80">{label}</label>
      <div className="relative flex items-center bg-[#16181D]/40 border border-[#343841]/30 rounded-xl px-4 py-3 focus-within:border-[#3DF2FF]/40 transition-all">
        <Icon icon={icon} className="w-4 h-4 mr-3 opacity-70" />
        {children}
      </div>
    </div>
  );
}
