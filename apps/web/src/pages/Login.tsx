import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Icon } from '@iconify/react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../lib/auth';
import { api, ApiError } from '../lib/api';

type Mode = 'login' | 'register' | 'forgot';

export function Login() {
  const { t } = useTranslation();
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [phone, setPhone] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setLoading(true);
    try {
      if (mode === 'login') {
        await login({ email, password });
        navigate('/app');
      } else if (mode === 'register') {
        await register({ fullName, email, password, companyName, phone: phone || undefined });
        navigate('/app');
      } else {
        // forgot — telefon orqali tasdiqlab yangi parol o'rnatamiz
        const res = await api.post<{ message: string }>('/auth/forgot-password', { email, phone, newPassword });
        setInfo(res.message ?? t('login.passwordUpdated'));
        setMode('login');
        setPassword('');
        setNewPassword('');
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('common.error'));
    } finally {
      setLoading(false);
    }
  }

  function switchMode(next: Mode) {
    setMode(next);
    setError(null);
    setInfo(null);
  }

  const titles: Record<Mode, string> = {
    login: t('login.titleLogin'),
    register: t('login.titleRegister'),
    forgot: t('login.titleForgot'),
  };
  const subtitles: Record<Mode, string> = {
    login: t('login.subtitleLogin'),
    register: t('login.subtitleRegister'),
    forgot: t('login.subtitleForgot'),
  };

  return (
    <div className="min-h-screen w-full bg-[var(--c-bg)] text-[var(--c-muted)] font-sans relative overflow-x-hidden flex flex-col">
      <div className="absolute top-[-94px] left-[-144px] w-[576px] h-[376px] bg-[#3DF2FF]/20 rounded-full blur-[120px] opacity-80 pointer-events-none" />
      <div className="absolute bottom-[-100px] right-[-100px] w-[576px] h-[376px] bg-[#FF8E4D]/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden">
        <span className="text-[192px] font-black text-white/[0.03] tracking-[-0.05em] -translate-y-[100px] hidden lg:block">SMETA</span>
      </div>

      <header className="relative z-20 w-full h-20 border-b border-[var(--c-border)]/10 backdrop-blur-md flex items-center justify-between px-4 sm:px-6 lg:px-10">
        <Link to="/" className="flex items-center gap-3">
          <img src="/logo.svg" alt="Smeta AI" className="h-12 sm:h-14 w-auto" />
        </Link>
        <div className="flex items-center gap-3 sm:gap-4 lg:gap-8">
          <Link to="/" className="text-sm font-medium hover:text-white transition-colors">{t('login.home')}</Link>
          <div className="h-4 w-px bg-[var(--c-border)]/40 hidden sm:block" />
          <span className="text-[12px] text-[#3DF2FF] tracking-tighter uppercase font-medium hidden sm:inline">v2.0.26</span>
        </div>
      </header>

      <main className="relative z-10 flex-grow flex flex-col items-center justify-center px-4 py-12">
        <div className="w-full max-w-[448px] bg-[var(--c-panel)]/30 rounded-[32px] border border-[var(--c-border)]/40 backdrop-blur-[40px] shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#3DF2FF]/40 to-transparent" />
          <div className="p-6 sm:p-8 lg:p-10 flex flex-col items-center">
            <h1 className="text-2xl sm:text-3xl font-bold font-display text-center mb-2 bg-gradient-to-br from-white to-[var(--c-muted)] bg-clip-text text-transparent">
              {titles[mode]}
            </h1>
            <p className="text-sm text-center text-[var(--c-muted)] mb-8">{subtitles[mode]}</p>

            {error && (
              <div className="w-full mb-4 px-4 py-3 bg-[#E11919]/10 border border-[#E11919]/30 rounded-xl text-[#ff6b6b] text-sm">
                {error}
              </div>
            )}
            {info && (
              <div className="w-full mb-4 px-4 py-3 bg-[#10B981]/10 border border-[#10B981]/30 rounded-xl text-[#34D399] text-sm">
                {info}
              </div>
            )}

            <form className="w-full space-y-5" onSubmit={handleSubmit}>
              {mode === 'register' && (
                <>
                  <Field label={t('login.fullName')} icon="lucide:user">
                    <input value={fullName} onChange={(e) => setFullName(e.target.value)} required placeholder={t('login.fullNamePh')} className="bg-transparent border-none outline-none w-full text-sm text-white placeholder:text-[var(--c-muted)]/40" />
                  </Field>
                  <Field label={t('login.companyName')} icon="lucide:building-2">
                    <input value={companyName} onChange={(e) => setCompanyName(e.target.value)} required placeholder={t('login.companyNamePh')} className="bg-transparent border-none outline-none w-full text-sm text-white placeholder:text-[var(--c-muted)]/40" />
                  </Field>
                </>
              )}

              <Field label={t('login.email')} icon="lucide:mail">
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="example@mail.uz" className="bg-transparent border-none outline-none w-full text-sm text-white placeholder:text-[var(--c-muted)]/40" />
              </Field>

              {/* Telefon — register'da (ixtiyoriy, lekin parol tiklash uchun kerak) va forgot'da (majburiy) */}
              {(mode === 'register' || mode === 'forgot') && (
                <Field label={mode === 'forgot' ? t('login.phoneConfirm') : t('login.phone')} icon="lucide:phone">
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required={mode === 'forgot'}
                    placeholder={t('login.phonePh')}
                    className="bg-transparent border-none outline-none w-full text-sm text-white placeholder:text-[var(--c-muted)]/40"
                  />
                </Field>
              )}

              {/* Parol — login va register */}
              {mode !== 'forgot' && (
                <Field label={t('login.password')} icon="lucide:lock">
                  <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="••••••••" className="bg-transparent border-none outline-none w-full text-sm text-white placeholder:text-[var(--c-muted)]/40" />
                </Field>
              )}

              {/* Yangi parol — forgot */}
              {mode === 'forgot' && (
                <Field label={t('login.newPassword')} icon="lucide:lock">
                  <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength={6} placeholder={t('login.newPasswordPh')} className="bg-transparent border-none outline-none w-full text-sm text-white placeholder:text-[var(--c-muted)]/40" />
                </Field>
              )}

              {/* Parolni unutdingizmi? — faqat login rejimida */}
              {mode === 'login' && (
                <div className="flex justify-end -mt-2">
                  <button type="button" onClick={() => switchMode('forgot')} className="text-[12px] font-medium text-[#3DF2FF] hover:underline">
                    {t('login.forgotLink')}
                  </button>
                </div>
              )}

              <div className="space-y-4 pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-12 bg-[#FF6B1A] hover:bg-[#FF7B31] text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-[#FF6B1A]/20 transition-all active:scale-[0.98] disabled:opacity-60"
                >
                  {loading
                    ? t('login.pleaseWait')
                    : mode === 'login'
                      ? t('login.submitLogin')
                      : mode === 'register'
                        ? t('login.submitRegister')
                        : t('login.submitForgot')}
                  {!loading && <Icon icon="lucide:arrow-right" className="w-4 h-4" />}
                </button>

                {mode === 'forgot' ? (
                  <button
                    type="button"
                    onClick={() => switchMode('login')}
                    className="w-full h-12 bg-[var(--c-bg)] border border-[#3DF2FF]/30 text-[#3DF2FF] font-semibold rounded-xl hover:bg-[#3DF2FF]/5 transition-all active:scale-[0.98]"
                  >
                    {t('login.backToLogin')}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => switchMode(mode === 'login' ? 'register' : 'login')}
                    className="w-full h-12 bg-[var(--c-bg)] border border-[#3DF2FF]/30 text-[#3DF2FF] font-semibold rounded-xl hover:bg-[#3DF2FF]/5 transition-all active:scale-[0.98]"
                  >
                    {mode === 'login' ? t('login.toRegister') : t('login.toLogin')}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      </main>

      <footer className="relative z-20 w-full py-8 flex items-center justify-center px-6">
        <p className="text-[12px] text-[var(--c-muted)]/60 text-center">{t('login.rights')}</p>
      </footer>
    </div>
  );
}

function Field({ label, icon, children }: { label: string; icon: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <label className="block text-[12px] font-medium tracking-wide uppercase opacity-80">{label}</label>
      <div className="relative flex items-center bg-[var(--c-bg)]/40 border border-[var(--c-border)]/30 rounded-xl px-4 py-3 focus-within:border-[#3DF2FF]/40 transition-all">
        <Icon icon={icon} className="w-4 h-4 mr-3 opacity-70" />
        {children}
      </div>
    </div>
  );
}
