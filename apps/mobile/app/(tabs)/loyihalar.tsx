import { useState } from 'react';
import { View, Text, TextInput, FlatList, Pressable, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useProjects, useProjectSummaries } from '@/lib/hooks/useProjects';
import { Loading, ErrorState, EmptyState } from '@/components/States';
import { formatMoneyShort } from '@/lib/format';
import { colors } from '@/theme/tokens';
import type { Project, ProjectStatus } from '@smeta/shared';

const STATUS_COLOR: Record<ProjectStatus, string> = {
  PLANNED: colors.muted,
  IN_PROGRESS: colors.purple,
  COMPLETED: colors.success,
  ARCHIVED: colors.border,
};

export default function ProjectsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const [q, setQ] = useState('');
  const { data: projects, isLoading, isError, refetch, isRefetching } = useProjects();
  const { data: summaries } = useProjectSummaries();

  if (isLoading) return <Loading />;
  if (isError || !projects) return <ErrorState onRetry={() => void refetch()} />;

  const filtered = q.trim()
    ? projects.filter(
        (p) =>
          p.title.toLowerCase().includes(q.trim().toLowerCase()) ||
          p.clientName.toLowerCase().includes(q.trim().toLowerCase()),
      )
    : projects;

  return (
    <View className="flex-1 bg-ink">
      <View className="px-4 pt-3 pb-2">
        <View className="flex-row items-center rounded-xl border border-border/40 bg-black/20 px-3">
          <Ionicons name="search-outline" size={18} color={colors.muted} />
          <TextInput
            value={q}
            onChangeText={setQ}
            placeholder={t('projects.search')}
            placeholderTextColor={colors.muted}
            className="flex-1 py-3 px-2 text-white text-sm"
          />
        </View>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(p) => p.id}
        contentContainerClassName="p-4 pt-1 gap-3"
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => void refetch()} tintColor={colors.purple} />}
        ListEmptyComponent={<EmptyState message={t('projects.empty')} />}
        renderItem={({ item }: { item: Project }) => {
          const sum = summaries?.[item.id];
          return (
            <Pressable
              onPress={() => router.push(`/loyiha/${item.id}`)}
              className="rounded-2xl border border-border/40 bg-black/20 p-4 active:bg-white/5"
            >
              <View className="flex-row items-start justify-between gap-2">
                <View className="flex-1">
                  <Text className="text-white font-semibold" numberOfLines={1}>{item.title}</Text>
                  <Text className="text-muted text-xs mt-0.5" numberOfLines={1}>
                    {item.code} · {item.clientName}
                  </Text>
                </View>
                <View className="rounded-full px-2 py-1" style={{ backgroundColor: `${STATUS_COLOR[item.status]}22` }}>
                  <Text className="text-[11px] font-semibold" style={{ color: STATUS_COLOR[item.status] }}>
                    {t(`status.${item.status}`)}
                  </Text>
                </View>
              </View>

              <View className="flex-row justify-between mt-3">
                <View>
                  <Text className="text-muted text-[11px]">{t('projects.spent')}</Text>
                  <Text className="text-white text-sm font-medium">{formatMoneyShort(sum?.spent ?? 0, 'UZS')}</Text>
                </View>
                <View className="items-end">
                  <Text className="text-muted text-[11px]">{t('projects.income')}</Text>
                  <Text className="text-success text-sm font-medium">{formatMoneyShort(sum?.income ?? 0, 'UZS')}</Text>
                </View>
              </View>
            </Pressable>
          );
        }}
      />
    </View>
  );
}
