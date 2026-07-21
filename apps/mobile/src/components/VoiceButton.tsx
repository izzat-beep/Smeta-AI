import { useState } from 'react';
import { View, Text, Pressable, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useVoiceRecorder, type VoiceResult } from '@/lib/voice';
import { colors } from '@/theme/tokens';

// Ovozli buyruq tugmasi — bosib boshlash, bosib to'xtatib yuborish.
// Natija onResult(callback) orqali qaytadi (intent qo'llash chaqiruvchida).
export function VoiceButton({ onResult }: { onResult: (r: VoiceResult) => void }) {
  const { t } = useTranslation();
  const { state, start, stopAndSend } = useVoiceRecorder();
  const [msg, setMsg] = useState<string | null>(null);

  async function toggle() {
    setMsg(null);
    try {
      if (state === 'idle') {
        await start();
      } else if (state === 'recording') {
        const r = await stopAndSend();
        if (r) {
          onResult(r);
          setMsg(`${t('voice.heard')}: ${r.transcript}`);
        } else {
          setMsg(t('voice.notUnderstood'));
        }
      }
    } catch (e) {
      setMsg(e instanceof Error && e.message === 'mic_denied' ? t('voice.micDenied') : t('common.error'));
    }
  }

  const recording = state === 'recording';
  const processing = state === 'processing';

  return (
    <View className="gap-1">
      <Pressable
        onPress={toggle}
        disabled={processing}
        accessibilityRole="button"
        accessibilityLabel={recording ? t('voice.listening') : t('voice.record')}
        hitSlop={8}
        className={`flex-row items-center justify-center gap-2 h-11 rounded-xl border ${
          recording ? 'bg-danger/15 border-danger/50' : 'bg-black/20 border-border/40'
        } active:opacity-80`}
      >
        {processing ? (
          <ActivityIndicator color={colors.purple} />
        ) : (
          <Ionicons name={recording ? 'stop-circle' : 'mic-outline'} size={20} color={recording ? colors.danger : colors.purple} />
        )}
        <Text className={recording ? 'text-danger text-sm font-semibold' : 'text-white text-sm font-medium'}>
          {processing ? t('voice.processing') : recording ? t('voice.listening') : t('voice.record')}
        </Text>
      </Pressable>
      {msg ? <Text className="text-muted text-[11px]" numberOfLines={2}>{msg}</Text> : null}
    </View>
  );
}
