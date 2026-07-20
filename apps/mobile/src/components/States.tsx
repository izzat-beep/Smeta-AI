import { View, Text, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/Button';
import { colors } from '@/theme/tokens';

// Yuklanish holati — markazda spinner.
export function Loading() {
  return (
    <View className="flex-1 items-center justify-center bg-ink py-10">
      <ActivityIndicator color={colors.purple} size="large" />
    </View>
  );
}

// Xato holati — xabar + qayta urinish tugmasi.
export function ErrorState({ message, onRetry }: { message?: string; onRetry?: () => void }) {
  const { t } = useTranslation();
  return (
    <View className="flex-1 items-center justify-center bg-ink px-8 py-10">
      <Ionicons name="alert-circle-outline" size={40} color={colors.danger} />
      <Text className="text-muted text-center text-sm mt-3 mb-5">{message ?? t('common.error')}</Text>
      {onRetry ? (
        <View className="w-40">
          <Button title={t('common.retry')} variant="ghost" onPress={onRetry} />
        </View>
      ) : null}
    </View>
  );
}

// Bo'sh holat — ikon + xabar.
export function EmptyState({ icon = 'folder-open-outline', message }: { icon?: keyof typeof Ionicons.glyphMap; message: string }) {
  return (
    <View className="flex-1 items-center justify-center bg-ink px-8 py-16">
      <Ionicons name={icon} size={44} color={colors.muted} />
      <Text className="text-muted text-center text-sm mt-3">{message}</Text>
    </View>
  );
}
