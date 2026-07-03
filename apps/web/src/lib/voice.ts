import { useCallback, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from './api';

export interface VoiceIntent {
  action: 'add_payment' | 'calculator_input' | 'unknown';
  amount: number | null;
  currency: 'USD' | 'UZS' | null;
  projectName: string | null;
  unitName: string | null;
  qty: number | null;
  unitPrice: number | null;
  unit: string | null;
  itemName: string | null;
  note: string | null;
}

export type VoiceState = 'idle' | 'listening' | 'processing' | 'error';

// Brauzer Web Speech API tiplari (DOM lib'da yo'q) — minimal e'lon.
type SpeechRecognitionCtor = new () => any;
function getRecognition(): SpeechRecognitionCtor | null {
  const w = window as any;
  return w.SpeechRecognition || w.webkitSpeechRecognition || null;
}

export function isVoiceSupported(): boolean {
  return !!getRecognition();
}

/**
 * Ovozli buyruq hooki. Web Speech API bilan nutqni matnga aylantiradi (demo, kalitsiz),
 * so'ng matnni backend'ga yuborib intent oladi. OPENAI_API_KEY qo'shilgach server Whisper'ga o'tkazish mumkin.
 */
export function useVoiceCommand(onResult: (intent: VoiceIntent, transcript: string) => void) {
  const { i18n } = useTranslation();
  const [state, setState] = useState<VoiceState>('idle');
  const [error, setError] = useState<string | null>(null);
  const recRef = useRef<any>(null);

  const reset = useCallback(() => {
    setState('idle');
    setError(null);
  }, []);

  const start = useCallback(() => {
    setError(null);
    const Rec = getRecognition();
    if (!Rec) {
      setState('error');
      setError('notSupported');
      return;
    }
    const rec = new Rec();
    recRef.current = rec;
    rec.lang = i18n.language === 'ru' ? 'ru-RU' : 'uz-UZ';
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    rec.continuous = false;

    rec.onresult = async (event: any) => {
      const transcript = String(event.results?.[0]?.[0]?.transcript ?? '').trim();
      if (!transcript) {
        setState('error');
        setError('noSpeech');
        return;
      }
      setState('processing');
      try {
        const res = await api.post<{ transcript: string; intent: VoiceIntent }>('/voice/command', { text: transcript });
        setState('idle');
        onResult(res.intent, res.transcript ?? transcript);
      } catch {
        setState('error');
        setError('netError');
      }
    };
    rec.onerror = (e: any) => {
      setState('error');
      if (e?.error === 'not-allowed' || e?.error === 'service-not-allowed') setError('micDenied');
      else if (e?.error === 'no-speech') setError('noSpeech');
      else setError('netError');
    };
    rec.onend = () => {
      // Agar tinglash tugasa-yu, natija/xato bo'lmasa — idle'ga qaytamiz.
      setState((s) => (s === 'listening' ? 'idle' : s));
    };

    try {
      rec.start();
      setState('listening');
    } catch {
      setState('error');
      setError('netError');
    }
  }, [i18n.language, onResult]);

  const cancel = useCallback(() => {
    try { recRef.current?.abort?.(); } catch { /* ignore */ }
    setState('idle');
  }, []);

  return { supported: isVoiceSupported(), state, error, start, cancel, reset };
}
