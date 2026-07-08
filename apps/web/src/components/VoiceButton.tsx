import { Icon } from '@iconify/react';
import { useTranslation } from 'react-i18next';
import { useVoiceCommand, type VoiceIntent } from '../lib/voice';

// 🎤 Ovozli buyruq tugmasi. Nutqni tanib, backend orqali intent oladi va onIntent'ga uzatadi.
// Mikrofon rad etilganda — yo'riqnoma modali (Vazifa 1C).
export function VoiceButton({ onIntent, hint }: { onIntent: (intent: VoiceIntent, transcript: string) => void; hint?: string }) {
  const { t } = useTranslation();
  const { supported, state, error, start, cancel, recheck } = useVoiceCommand(onIntent);

  const listening = state === 'listening';
  const processing = state === 'processing';
  const checking = state === 'checking';
  const busy = processing || checking;

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={() => (listening ? cancel() : start())}
        disabled={busy}
        title={supported ? t('voice.listen') : t('voice.notSupported')}
        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all disabled:opacity-60 ${
          listening
            ? 'bg-[#E11919] text-white animate-pulse'
            : 'bg-[#5555E7]/15 border border-[#5555E7]/40 text-[#5555E7] hover:bg-[#5555E7]/25'
        }`}
      >
        <Icon icon={busy ? 'lucide:loader' : 'lucide:mic'} className={`w-4 h-4 ${busy ? 'animate-spin' : ''}`} />
        {checking ? t('voice.checking') : processing ? t('voice.processing') : listening ? t('voice.listening') : t('voice.listen')}
      </button>
      {hint && state === 'idle' && !error && <span className="text-[10px] text-[var(--c-muted2)] max-w-[240px] text-right">{hint}</span>}
      {error && state === 'error' && <span className="text-[11px] text-[#E11919] max-w-[240px] text-right">{t(`voice.${error}`)}</span>}

      {/* Ruxsat rad etilganda — qadam-baqadam yo'riqnoma + "Qayta tekshirish" */}
      {state === 'denied' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={cancel}>
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-md bg-[var(--c-panel)] border border-[var(--c-border)]/60 rounded-2xl p-6 space-y-4 text-left">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-[#F97316]/15 flex items-center justify-center shrink-0">
                <Icon icon="lucide:mic-off" className="w-5 h-5 text-[#F97316]" />
              </div>
              <h3 className="font-display font-bold text-white text-lg">{t('voice.deniedTitle')}</h3>
            </div>
            <p className="text-sm text-[var(--c-muted)] leading-relaxed">{t('voice.deniedIntro')}</p>
            <ol className="space-y-2 text-sm text-[var(--c-muted)] list-decimal list-inside">
              <li>{t('voice.deniedStep1')}</li>
              <li>{t('voice.deniedStep2')}</li>
              <li>{t('voice.deniedStep3')}</li>
            </ol>
            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={cancel}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium border border-[var(--c-border)]/60 text-[var(--c-muted)] hover:text-white hover:bg-white/5 transition-colors"
              >
                {t('common.close')}
              </button>
              <button
                type="button"
                onClick={recheck}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold bg-[#5555E7] hover:bg-[#4444d6] text-white transition-colors flex items-center justify-center gap-2"
              >
                <Icon icon="lucide:refresh-cw" className="w-4 h-4" />
                {t('voice.recheck')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
