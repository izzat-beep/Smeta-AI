import { useState } from 'react';
import { Icon } from '@iconify/react';
import { useTranslation } from 'react-i18next';
import { api, ApiError } from '../lib/api';
import { useAdminAuth } from '../lib/auth';

// Platforma admini uchun 2FA (TOTP) boshqaruvi: yoqish/o'chirish.
export function Security() {
  const { t } = useTranslation();
  const { admin, refreshMe } = useAdminAuth();
  const enabled = !!admin?.totpEnabled;

  const [setup, setSetup] = useState<{ secret: string; otpauthUrl: string } | null>(null);
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function startSetup() {
    setError(null); setMsg(null); setBusy(true);
    try {
      const res = await api.post<{ secret: string; otpauthUrl: string }>('/2fa/setup');
      setSetup(res);
      setCode('');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('common.error'));
    } finally {
      setBusy(false);
    }
  }

  async function enable(e: React.FormEvent) {
    e.preventDefault();
    setError(null); setBusy(true);
    try {
      await api.post('/2fa/enable', { code });
      setSetup(null); setCode('');
      setMsg(t('security.enabledMsg'));
      await refreshMe();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('common.error'));
    } finally {
      setBusy(false);
    }
  }

  async function disable(e: React.FormEvent) {
    e.preventDefault();
    setError(null); setBusy(true);
    try {
      await api.post('/2fa/disable', { code });
      setCode('');
      setMsg(t('security.disabledMsg'));
      await refreshMe();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('common.error'));
    } finally {
      setBusy(false);
    }
  }

  function copySecret() {
    if (!setup) return;
    navigator.clipboard?.writeText(setup.secret).then(() => {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    }).catch(() => {});
  }

  return (
    <div className="max-w-[640px]">
      <div className="mb-6">
        <h1 className="font-display text-xl md:text-2xl font-bold text-white">{t('security.title')}</h1>
        <p className="text-sm text-[#BCC0C7] mt-1">{t('security.subtitle')}</p>
      </div>

      <div className="bg-[#191B1F]/40 border border-[#343841]/40 rounded-2xl p-6 space-y-5">
        {/* Holat */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${enabled ? 'bg-[#22C55E]/15' : 'bg-[#343841]/40'}`}>
              <Icon icon={enabled ? 'lucide:shield-check' : 'lucide:shield-off'} className={`w-6 h-6 ${enabled ? 'text-[#22C55E]' : 'text-[#BCC0C7]'}`} />
            </div>
            <div>
              <p className="text-sm font-medium text-white">{t('security.status')}</p>
              <p className={`text-[13px] font-semibold ${enabled ? 'text-[#22C55E]' : 'text-[#BCC0C7]'}`}>
                {enabled ? t('security.statusOn') : t('security.statusOff')}
              </p>
            </div>
          </div>
        </div>

        {error && <div className="px-4 py-3 bg-[#E11919]/10 border border-[#E11919]/30 rounded-xl text-[#ff6b6b] text-sm">{error}</div>}
        {msg && <div className="px-4 py-3 bg-[#22C55E]/10 border border-[#22C55E]/30 rounded-xl text-[#4ade80] text-sm">{msg}</div>}

        {/* O'chirilgan: yoqish oqimi */}
        {!enabled && !setup && (
          <button onClick={startSetup} disabled={busy} className="w-full h-12 bg-[#5555E7] hover:bg-[#4444d6] text-white font-bold rounded-xl flex items-center justify-center gap-2 disabled:opacity-60">
            {busy && <Icon icon="lucide:loader" className="w-4 h-4 animate-spin" />}
            {t('security.startSetup')}
          </button>
        )}

        {/* Setup: kalit + kod tasdiqlash */}
        {!enabled && setup && (
          <form onSubmit={enable} className="space-y-4 border-t border-[#343841]/40 pt-5">
            <div>
              <p className="text-sm font-semibold text-white mb-1">{t('security.setupTitle')}</p>
              <p className="text-[12px] text-[#BCC0C7] leading-relaxed">{t('security.setupHint')}</p>
            </div>
            <div className="space-y-2">
              <label className="block text-[11px] font-medium uppercase opacity-80 text-[#BCC0C7]">{t('security.secretLabel')}</label>
              <div className="flex items-center gap-2 bg-[#16181D]/60 border border-[#343841]/40 rounded-xl px-4 py-3">
                <code className="text-[13px] text-[#22D3EE] font-mono break-all flex-1 select-all">{setup.secret}</code>
                <button type="button" onClick={copySecret} className="shrink-0 text-[#BCC0C7] hover:text-white" title={t('security.copy')}>
                  <Icon icon={copied ? 'lucide:check' : 'lucide:copy'} className="w-4 h-4" />
                </button>
              </div>
              {copied && <p className="text-[11px] text-[#4ade80]">{t('security.copied')}</p>}
            </div>
            <div className="space-y-2">
              <label className="block text-[11px] font-medium uppercase opacity-80 text-[#BCC0C7]">{t('security.codeLabel')}</label>
              <input
                type="text" inputMode="numeric" autoComplete="one-time-code" maxLength={6}
                value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} required placeholder="000000"
                className="w-full bg-[#16181D]/40 border border-[#343841]/30 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-[#5555E7]/40 tracking-[0.4em] font-mono"
              />
            </div>
            <button disabled={busy || code.length !== 6} className="w-full h-12 bg-[#22C55E] hover:bg-[#16a34a] text-white font-bold rounded-xl flex items-center justify-center gap-2 disabled:opacity-50">
              {busy && <Icon icon="lucide:loader" className="w-4 h-4 animate-spin" />}
              {t('security.confirm')}
            </button>
          </form>
        )}

        {/* Yoqilgan: o'chirish oqimi */}
        {enabled && (
          <form onSubmit={disable} className="space-y-4 border-t border-[#343841]/40 pt-5">
            <p className="text-[12px] text-[#BCC0C7]">{t('security.disableHint')}</p>
            <input
              type="text" inputMode="numeric" autoComplete="one-time-code" maxLength={6}
              value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} required placeholder="000000"
              className="w-full bg-[#16181D]/40 border border-[#343841]/30 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-[#E11919]/40 tracking-[0.4em] font-mono"
            />
            <button disabled={busy || code.length !== 6} className="w-full h-12 bg-[#E11919]/90 hover:bg-[#E11919] text-white font-bold rounded-xl flex items-center justify-center gap-2 disabled:opacity-50">
              {busy && <Icon icon="lucide:loader" className="w-4 h-4 animate-spin" />}
              {t('security.disable')}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
