import { useState } from 'react';
import { Icon } from '@iconify/react';
import { useTranslation } from 'react-i18next';
import { api, ApiError } from '../lib/api';
import { useAdminAuth } from '../lib/auth';

// Vendor birinchi kirishda parolni almashtirishi shart.
export function ChangePassword() {
  const { t } = useTranslation();
  const { refreshMe, logout } = useAdminAuth();
  const [pw, setPw] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      await api.post('/vendor/change-password', { newPassword: pw });
      await refreshMe(); // mustChangePassword endi false
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('common.error'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#16181D] px-4">
      <form onSubmit={submit} className="w-full max-w-[420px] bg-[#191B1F]/40 rounded-2xl border border-[#343841]/40 backdrop-blur-2xl shadow-2xl p-8 space-y-5">
        <div className="text-center">
          <div className="w-14 h-14 rounded-2xl bg-[#5555E7]/15 flex items-center justify-center mx-auto mb-3">
            <Icon icon="lucide:key-round" className="w-7 h-7 text-[#5555E7]" />
          </div>
          <h1 className="text-xl font-bold font-display text-white">{t('changePw.title')}</h1>
          <p className="text-sm text-[#BCC0C7] mt-1">{t('changePw.subtitle')}</p>
        </div>
        {error && <div className="px-4 py-3 bg-[#E11919]/10 border border-[#E11919]/30 rounded-xl text-[#ff6b6b] text-sm">{error}</div>}
        <div className="space-y-2">
          <label className="block text-[12px] font-medium uppercase opacity-80 text-[#BCC0C7]">{t('changePw.newPassword')}</label>
          <input type="password" value={pw} onChange={(e) => setPw(e.target.value)} required minLength={6} placeholder={t('changePw.placeholder')} className="w-full bg-[#16181D]/40 border border-[#343841]/30 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-[#5555E7]/40" />
        </div>
        <button disabled={saving} className="w-full h-12 bg-[#5555E7] hover:bg-[#4444d6] text-white font-bold rounded-xl disabled:opacity-60 flex items-center justify-center gap-2">
          {saving && <Icon icon="lucide:loader" className="w-4 h-4 animate-spin" />}
          {t('changePw.submit')}
        </button>
        <button type="button" onClick={logout} className="w-full text-[12px] text-[#BCC0C7] hover:text-white">{t('common.logout')}</button>
      </form>
    </div>
  );
}
