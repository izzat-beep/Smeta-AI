import { View, Text, ScrollView, RefreshControl, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/lib/auth/authStore';
import { useDashboard } from '@/lib/hooks/useProjects';
import { Loading, ErrorState } from '@/components/States';
import { formatMoneyShort } from '@/lib/format';
import { colors } from '@/theme/tokens';
import type { Project } from '@smeta/shared';

function StatCard({ icon, label, value }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string }) {
  return (
    <View className="flex-1 rounded-2xl border border-border/40 bg-black/20 p-4">
      <Ionicons name={icon} size={20} color={colors.purple} />
      <Text className="text-white text-lg font-bold mt-2" numberOfLines={1}>{value}</Text>
      <Text className="text-muted text-xs mt-0.5" numberOfLines={1}>{label}</Text>
    </View>
  );
}

export default function DashboardScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const user = useAuth((s) => s.user);
  const { data, isLoading, isError, refetch, isRefetching } = useDashboard();

  if (isLoading) return <Loading />;
  if (isError || !data) return <ErrorState onRetry={() => void refetch()} />;

  const { stats } = data;

  return (
    <ScrollView
      className="flex-1 bg-ink"
      contentContainerClassName="p-4 gap-4"
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => void refetch()} tintColor={colors.purple} />}
    >
      <View>
        <Text className="text-muted text-sm">{t('dashboard.welcome')}</Text>
        <Text className="text-white text-2xl font-bold">{user?.fullName ?? '—'}</Text>
      </View>

      <View className="flex-row gap-3">
        <StatCard icon="wallet-outline" label={t('dashboard.totalExpenses')} value={formatMoneyShort(stats.totalExpenses, 'UZS')} />
        <StatCard icon="business-outline" label={t('dashboard.activeObjects')} value={String(stats.activeObjects)} />
      </View>
      <View className="flex-row gap-3">
        <StatCard icon="people-outline" label={t('dashboard.team')} value={String(stats.teamCount)} />
        <StatCard icon="trending-up-outline" label={t('dashboard.productivity')} value={`${stats.productivity}%`} />
      </View>

      {data.aiRecommendation ? (
        <View className="rounded-2xl border border-purple/30 bg-purple/10 p-4">
          <View className="flex-row items-center gap-2 mb-1">
            <Ionicons name="sparkles-outline" size={16} color={colors.purple} />
            <Text className="text-purple text-sm font-semibold">{t('dashboard.aiTitle')}</Text>
          </View>
          <Text className="text-muted text-sm leading-5">{data.aiRecommendation}</Text>
        </View>
      ) : null}

      {data.activeProjects.length > 0 ? (
        <View className="gap-3">
          <Text className="text-white text-base font-semibold">{t('dashboard.activeProjectsTitle')}</Text>
          {data.activeProjects.map((p: Project) => (
            <Pressable
              key={p.id}
              onPress={() => router.push(`/loyiha/${p.id}`)}
              className="rounded-2xl border border-border/40 bg-black/20 p-4 active:bg-white/5"
            >
              <View className="flex-row items-center justify-between">
                <Text className="text-white font-semibold flex-1" numberOfLines={1}>{p.title}</Text>
                <Text className="text-muted text-xs">{p.progress}%</Text>
              </View>
              <Text className="text-muted text-xs mt-1" numberOfLines={1}>{p.clientName}</Text>
              <View className="h-1.5 rounded-full bg-border/40 mt-3 overflow-hidden">
                <View className="h-full rounded-full bg-purple" style={{ width: `${Math.min(100, p.progress)}%` }} />
              </View>
            </Pressable>
          ))}
        </View>
      ) : null}
    </ScrollView>
  );
}
