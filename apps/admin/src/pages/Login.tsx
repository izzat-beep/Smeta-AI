import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '@iconify/react';
import { useTranslation } from 'react-i18next';
import { useAdminAuth } from '../lib/auth';
import { ApiError } from '../lib/api';

export function Login() {
  const { t } = useTranslation();
  const { login } = useAdminAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('common.error'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#16181D] relative overflow-hidden px-4">
      <div className="absolute top-[-94px] left-[-144px] w-[576px] h-[376px] bg-[#5555E7]/20 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-100px] right-[-100px] w-[576px] h-[376px] bg-[#06B6D4]/15 rounded-full blur-[120px]" />

      <div className="w-full max-w-[420px] bg-[#191B1F]/40 rounded-[28px] border border-[#343841]/40 backdrop-blur-[40px] shadow-2xl p-8 lg:p-10 relative z-10">
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#5555E7]/60 to-transparent" />
        <div className="flex flex-col items-center mb-8">
          <img src="/logo.svg" alt="Smeta AI" className="h-16 w-auto object-contain mb-4" />
          <h1 className="text-2xl font-bold font-display text-white">{t('login.title')}</h1>
          <p className="text-sm text-[#BCC0C7] mt-1">{t('login.subtitle')}</p>
        </div>

        {error && (
          <div className="mb-4 px-4 py-3 bg-[#E11919]/10 border border-[#E11919]/30 rounded-xl text-[#ff6b6b] text-sm">{error}</div>
        )}

        <form onSubmit={submit} className="space-y-5">
          <div className="space-y-2">
            <label className="block text-[12px] font-medium uppercase opacity-80 text-[#BCC0C7]">{t('login.email')}</label>
            <div className="flex items-center bg-[#16181D]/40 border border-[#343841]/30 rounded-xl px-4 py-3 focus-within:border-[#5555E7]/40">
              <Icon icon="lucide:mail" className="w-4 h-4 mr-3 opacity-70 text-[#BCC0C7]" />
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="bg-transparent outline-none w-full text-sm text-white" />
            </div>
          </div>
          <div className="space-y-2">
            <label className="block text-[12px] font-medium uppercase opacity-80 text-[#BCC0C7]">{t('login.password')}</label>
            <div className="flex items-center bg-[#16181D]/40 border border-[#343841]/30 rounded-xl px-4 py-3 focus-within:border-[#5555E7]/40">
              <Icon icon="lucide:lock" className="w-4 h-4 mr-3 opacity-70 text-[#BCC0C7]" />
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="bg-transparent outline-none w-full text-sm text-white" />
            </div>
          </div>
          <button disabled={loading} className="w-full h-12 bg-[#5555E7] hover:bg-[#4444d6] text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-60">
            {loading ? t('login.loading') : t('login.submit')}
            {!loading && <Icon icon="lucide:arrow-right" className="w-4 h-4" />}
          </button>
        </form>
      </div>
    </div>
  );
}
