import { useCallback, useEffect, useRef, useState } from 'react';
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

// 'denied' — ruxsat rad etilgan (yo'riqnoma modali ko'rsatiladi); 'checking' — ruxsat so'ralmoqda.
export type VoiceState = 'idle' | 'checking' | 'listening' | 'processing' | 'error' | 'denied';

// Brauzer Web Speech API tiplari (DOM lib'da yo'q) — minimal e'lon.
type SpeechRecognitionCtor = new () => any;
function getRecognition(): SpeechRecognitionCtor | null {
  const w = window as any;
  return w.SpeechRecognition || w.webkitSpeechRecognition || null;
}

export function isVoiceSupported(): boolean {
  return !!getRecognition();
}

// Mikrofon ruxsatini tekshirish/olish. getUserMedia FOYDALANUVCHI ishorasi
// (tugma bosilishi) ichida, boshqa await'lardan OLDIN chaqirilishi shart —
// aks holda brauzer native so'rovni ko'rsatmaydi. Ruxsat olingach oqim darhol
// bo'shatiladi (biz faqat ruxsatni tekshirdik, yozish SpeechRecognition'da).
async function acquireMicPermission(): Promise<{ ok: boolean; code?: string }> {
  if (typeof window !== 'undefined' && !window.isSecureContext) return { ok: false, code: 'insecure' };
  if (!navigator.mediaDevices?.getUserMedia) return { ok: false, code: 'notSupported' };
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    stream.getTracks().forEach((t) => t.stop()); // mikrofon indikatori yonib qolmasin
    return { ok: true };
  } catch (e) {
    const name = (e as DOMException)?.name;
    // Aniq DOMException turlari bo'yicha alohida xabar (brief 1C.6)
    if (name === 'NotAllowedError' || name === 'SecurityError') return { ok: false, code: 'denied' };
    if (name === 'NotFoundError' || name === 'DevicesNotFoundError') return { ok: false, code: 'noDevice' };
    if (name === 'NotReadableError' || name === 'TrackStartError') return { ok: false, code: 'micBusy' };
    return { ok: false, code: 'micError' };
  }
}

/**
 * Ovozli buyruq hooki. Mikrofon ruxsatini to'g'ri boshqaradi (Vazifa 1C):
 * feature/secure-context tekshiruvi, gesture ichida getUserMedia, permissions.query
 * bilan branch, rad etilganda avtomatik tiklanish (onchange) + "Qayta tekshirish".
 */
export function useVoiceCommand(onResult: (intent: VoiceIntent, transcript: string) => void) {
  const { i18n } = useTranslation();
  const [state, setState] = useState<VoiceState>('idle');
  const [error, setError] = useState<string | null>(null);
  const recRef = useRef<any>(null);
  const permRef = useRef<PermissionStatus | null>(null);

  const reset = useCallback(() => {
    setState('idle');
    setError(null);
  }, []);

  // Ruxsat holati o'zgarishini kuzatamiz — foydalanuvchi sozlamalardan ruxsat
  // bersa, sahifani yangilamasdan avtomatik 'idle'ga qaytadi.
  const subscribePermission = useCallback(async () => {
    if (permRef.current) return;
    if (!navigator.permissions?.query) return;
    try {
      const status = await navigator.permissions.query({ name: 'microphone' as PermissionName });
      permRef.current = status;
      status.onchange = () => {
        if (status.state === 'granted') {
          setState('idle');
          setError(null);
        } else if (status.state === 'denied') {
          setState('denied');
        }
      };
    } catch {
      /* Safari va b. — permissions.query mikrofonni qo'llamaydi, e'tiborsiz */
    }
  }, []);

  const beginRecognition = useCallback(() => {
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
      if (e?.error === 'not-allowed' || e?.error === 'service-not-allowed') {
        setState('denied');
        subscribePermission();
      } else if (e?.error === 'no-speech') {
        setState('error');
        setError('noSpeech');
      } else {
        setState('error');
        setError('netError');
      }
    };
    rec.onend = () => {
      setState((s) => (s === 'listening' ? 'idle' : s));
    };

    try {
      rec.start();
      setState('listening');
    } catch {
      setState('error');
      setError('netError');
    }
  }, [i18n.language, onResult, subscribePermission]);

  // Tugma bosilganda chaqiriladi. MUHIM: getUserMedia shu yerda, gesture ichida.
  const start = useCallback(async () => {
    setError(null);
    if (!getRecognition()) {
      setState('error');
      setError('notSupported');
      return;
    }
    setState('checking');
    const res = await acquireMicPermission(); // birinchi await — getUserMedia (gesture saqlanadi)
    if (!res.ok) {
      if (res.code === 'denied') {
        setState('denied');
        subscribePermission();
      } else {
        setState('error');
        setError(res.code ?? 'micError');
      }
      return;
    }
    beginRecognition();
  }, [beginRecognition, subscribePermission]);

  // "Qayta tekshirish" — foydalanuvchi sozlamadan ruxsat bergach.
  const recheck = useCallback(async () => {
    const res = await acquireMicPermission();
    if (res.ok) {
      setState('idle');
      setError(null);
    } else if (res.code === 'denied') {
      setState('denied');
    } else {
      setState('error');
      setError(res.code ?? 'micError');
    }
  }, []);

  const cancel = useCallback(() => {
    try { recRef.current?.abort?.(); } catch { /* ignore */ }
    setState('idle');
  }, []);

  // Unmount'da oqim/kuzatuvchini tozalaymiz.
  useEffect(() => {
    return () => {
      try { recRef.current?.abort?.(); } catch { /* ignore */ }
      if (permRef.current) permRef.current.onchange = null;
    };
  }, []);

  return { supported: isVoiceSupported(), state, error, start, cancel, recheck, reset };
}
