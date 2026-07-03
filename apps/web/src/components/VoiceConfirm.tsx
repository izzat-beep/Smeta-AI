import { Icon } from '@iconify/react';
import { useTranslation } from 'react-i18next';
import type { VoiceIntent } from '../lib/voice';

// Ovozdan tushunilgan natijani saqlashdan OLDIN tasdiqlash oynasi.
export function VoiceConfirm({
  intent,
  transcript,
  onConfirm,
  onEdit,
  onClose,
}: {
  intent: VoiceIntent;
  transcript: string;
  onConfirm: () => void;
  onEdit: () => void;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const unknown = intent.action === 'unknown';

  const rows: { label: string; value: string }[] = [];
  if (intent.action === 'add_payment') {
    if (intent.projectName) rows.push({ label: t('voice.building'), value: intent.projectName });
    if (intent.unitName) rows.push({ label: t('voice.unit'), value: intent.unitName });
    if (intent.amount != null) rows.push({ label: t('voice.amount'), value: `${intent.amount} ${intent.currency ?? ''}`.trim() });
  } else if (intent.action === 'calculator_input') {
    if (intent.itemName) rows.push({ label: t('voice.item'), value: intent.itemName });
    if (intent.qty != null) rows.push({ label: t('voice.qty'), value: `${intent.qty} ${intent.unit ?? ''}`.trim() });
    if (intent.unitPrice != null) rows.push({ label: t('voice.price'), value: `${intent.unitPrice} ${intent.currency ?? ''}`.trim() });
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-[#16181D]/70 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-sm bg-[#191B1F] border border-[#343841]/60 rounded-2xl p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#5555E7]/15 flex items-center justify-center">
            <Icon icon="lucide:mic" className="w-5 h-5 text-[#5555E7]" />
          </div>
          <h3 className="text-lg font-bold text-white font-display">{unknown ? '—' : t('voice.confirmTitle')}</h3>
        </div>

        <div className="px-3 py-2 bg-[#16181D]/60 border border-[#343841]/40 rounded-xl">
          <p className="text-[10px] uppercase tracking-widest text-[#7A7F8A] mb-1">{t('voice.heard')}</p>
          <p className="text-sm text-[#BCC0C7] italic">"{transcript}"</p>
        </div>

        {unknown ? (
          <p className="text-sm text-[#F97316]">{t('voice.unknown')}</p>
        ) : (
          <div className="space-y-2">
            {rows.map((r) => (
              <div key={r.label} className="flex justify-between text-sm">
                <span className="text-[#BCC0C7]">{r.label}</span>
                <span className="text-white font-semibold">{r.value}</span>
              </div>
            ))}
          </div>
        )}

        {unknown ? (
          <button type="button" onClick={onClose} className="w-full py-2.5 bg-[#343841]/60 rounded-xl text-sm font-medium text-white">
            {t('common.close')}
          </button>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <button type="button" onClick={onEdit} className="py-2.5 bg-[#16181D] border border-[#343841]/60 rounded-xl text-sm font-medium text-white hover:bg-[#343841]/30">
              {t('voice.edit')}
            </button>
            <button type="button" onClick={onConfirm} className="py-2.5 bg-[#10B981] rounded-xl text-sm font-bold text-white hover:bg-[#0ea371]">
              {t('voice.confirm')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
