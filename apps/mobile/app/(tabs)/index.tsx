import { View, Text, Pressable, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/lib/auth/authStore';

// Dashboard (skelet) — sessiya ishlayotganini isbotlaydi. Real ma'lumot
// (GET /api/dashboard) 3-bosqichda TanStack Query bilan ulanadi.
export default function DashboardScreen() {
  const { t } = useTranslation();
  const user = useAuth((s) => s.user);
  const tenant = useAuth((s) => s.tenant);
  const logout = useAuth((s) => s.logout);

  return (
    <ScrollView className="flex-1 bg-ink" contentContainerClassName="p-6">
      <Text className="text-muted text-sm mb-1">{t('dashboard.welcome')}</Text>
      <Text className="text-white text-2xl font-bold mb-1">{user?.fullName ?? '—'}</Text>
      <Text className="text-muted text-base mb-8">{tenant?.name ?? '—'}</Text>

      <View className="rounded-2xl border border-border/40 bg-black/20 p-5 mb-6">
        <Text className="text-muted text-sm">
          Skelet ishlayapti. 3-bosqichda bu yerga real dashboard (statlar, faol
          loyihalar, AI tavsiyasi) ulanadi.
        </Text>
      </View>

      <Pressable
        onPress={() => void logout()}
        className="h-12 items-center justify-center rounded-xl border border-danger/40 bg-danger/10"
      >
        <Text className="text-danger font-semibold">{t('common.logout')}</Text>
      </Pressable>
    </ScrollView>
  );
}
