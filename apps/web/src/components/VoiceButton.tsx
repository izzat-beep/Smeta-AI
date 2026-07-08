import { Icon } from '@iconify/react';
import { useTranslation } from 'react-i18next';
import { useVoiceCommand, type VoiceIntent } from '../lib/voice';

// 🎤 Ovozli buyruq tugmasi. Nutqni tanib, backend orqali intent oladi va onIntent'ga uzatadi.
export function VoiceButton({ onIntent, hint }: { onIntent: (intent: VoiceIntent, transcript: string) => void; hint?: string }) {
  const { t } = useTranslation();
  const { supported, state, error, start, cancel } = useVoiceCommand(onIntent);

  const listening = state === 'listening';
  const processing = state === 'processing';

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={() => (listening ? cancel() : start())}
        disabled={processing}
        title={supported ? t('voice.listen') : t('voice.notSupported')}
        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all disabled:opacity-60 ${
          listening
            ? 'bg-[#E11919] text-white animate-pulse'
            : 'bg-[#5555E7]/15 border border-[#5555E7]/40 text-[#5555E7] hover:bg-[#5555E7]/25'
        }`}
      >
        <Icon icon={processing ? 'lucide:loader' : listening ? 'lucide:mic' : 'lucide:mic'} className={`w-4 h-4 ${processing ? 'animate-spin' : ''}`} />
        {processing ? t('voice.processing') : listening ? t('voice.listening') : t('voice.listen')}
      </button>
      {hint && state === 'idle' && !error && <span className="text-[10px] text-[var(--c-muted2)] max-w-[240px] text-right">{hint}</span>}
      {error && <span className="text-[11px] text-[#E11919] max-w-[240px] text-right">{t(`voice.${error}`)}</span>}
    </div>
  );
}
