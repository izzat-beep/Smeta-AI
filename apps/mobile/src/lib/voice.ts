import { useRef, useState } from 'react';
import { Audio } from 'expo-av';
import { API_BASE_URL } from '@/lib/env';
import { tokenStore } from '@/lib/auth/tokenStore';
import { ApiError } from '@/lib/api/client';

// Backend voice.ts intent shakli (POST /api/voice/command javobi).
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
export interface VoiceResult {
  transcript: string;
  intent: VoiceIntent;
}

// Audio faylni /voice/command ga multipart yuboradi (Whisper STT + Claude intent).
// api client JSON bo'lgani uchun bu yerda alohida multipart fetch.
async function sendVoiceCommand(uri: string): Promise<VoiceResult> {
  const name = uri.split('/').pop() || 'audio.m4a';
  const ext = name.split('.').pop()?.toLowerCase();
  const type = ext === 'webm' ? 'audio/webm' : ext === 'mp3' || ext === 'mpeg' ? 'audio/mpeg' : ext === 'wav' ? 'audio/wav' : 'audio/mp4';

  const form = new FormData();
  // RN FormData fayl obyektini qabul qiladi (TS tiplari buni bilmaydi — cast).
  form.append('audio', { uri, name, type } as unknown as Blob);

  const access = await tokenStore.getAccess();
  const res = await fetch(`${API_BASE_URL}/api/voice/command`, {
    method: 'POST',
    // Content-Type QO'YILMAYDI — fetch multipart boundary'ni o'zi qo'yadi.
    headers: { 'X-Client': 'mobile', ...(access ? { Authorization: `Bearer ${access}` } : {}) },
    body: form,
  });
  if (!res.ok) {
    let msg = `Voice (${res.status})`;
    try {
      const d = (await res.json()) as { message?: string };
      if (d.message) msg = d.message;
    } catch {
      /* ignore */
    }
    throw new ApiError(res.status, msg);
  }
  return (await res.json()) as VoiceResult;
}

export type RecorderState = 'idle' | 'recording' | 'processing';

// Ovoz yozish holati (expo-av). Bosib boshlash → bosib to'xtatib yuborish.
export function useVoiceRecorder() {
  const recRef = useRef<Audio.Recording | null>(null);
  const [state, setState] = useState<RecorderState>('idle');

  async function start(): Promise<void> {
    const perm = await Audio.requestPermissionsAsync();
    if (!perm.granted) throw new Error('mic_denied');
    await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
    const rec = new Audio.Recording();
    await rec.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
    await rec.startAsync();
    recRef.current = rec;
    setState('recording');
  }

  async function stopAndSend(): Promise<VoiceResult | null> {
    const rec = recRef.current;
    if (!rec) return null;
    setState('processing');
    try {
      await rec.stopAndUnloadAsync();
      const uri = rec.getURI();
      recRef.current = null;
      if (!uri) return null;
      return await sendVoiceCommand(uri);
    } finally {
      setState('idle');
    }
  }

  return { state, start, stopAndSend };
}
