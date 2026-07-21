import { View, Text, ScrollView, Pressable, RefreshControl } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useProject, useProjectSummary } from '@/lib/hooks/useProjects';
import { useMoney } from '@/lib/hooks/useMoney';
import { Loading, ErrorState } from '@/components/States';
import { formatMoney, formatDate } from '@/lib/format';
import { colors } from '@/theme/tokens';

function Kpi({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <View className="flex-1 rounded-2xl border border-border/40 bg-black/20 p-4">
      <Text className="text-muted text-[11px]">{label}</Text>
      <Text className="text-base font-bold mt-1" style={{ color: accent ?? colors.white }} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

export default function ProjectDetailScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const projectId = typeof id === 'string' ? id : '';

  const money = useMoney();
  const { data: project, isLoading, isError, refetch, isRefetching } = useProject(projectId);
  const { data: summary } = useProjectSummary(projectId);

  return (
    <SafeAreaView className="flex-1 bg-ink" edges={['top']}>
      <View className="flex-row items-center gap-2 px-3 py-2 border-b border-border/40">
        <Pressable onPress={() => router.back()} className="w-10 h-10 items-center justify-center rounded-full active:bg-white/5">
          <Ionicons name="chevron-back" size={24} color={colors.white} />
        </Pressable>
        <Text className="text-white text-base font-semibold flex-1" numberOfLines={1}>
          {project?.title ?? t('projectDetail.overview')}
        </Text>
      </View>

      {isLoading ? (
        <Loading />
      ) : isError || !project ? (
        <ErrorState onRetry={() => void refetch()} />
      ) : (
        <ScrollView
          className="flex-1"
          contentContainerClassName="p-4 gap-4"
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => void refetch()} tintColor={colors.purple} />}
        >
          <View className="rounded-2xl border border-border/40 bg-black/20 p-4">
            <Text className="text-muted text-xs">{project.code} · {t(`status.${project.status}`)}</Text>
            <Text className="text-white text-lg font-bold mt-1">{project.title}</Text>
            <Text className="text-muted text-sm mt-1">{t('projectDetail.client')}: {project.clientName}</Text>
            {project.address ? <Text className="text-muted text-sm">{t('projectDetail.address')}: {project.address}</Text> : null}
            {project.deadline ? <Text className="text-muted text-sm mt-1">{t('projects.deadline')}: {formatDate(project.deadline)}</Text> : null}
          </View>

          <View className="flex-row gap-3">
            <Kpi label={t('projectDetail.budget')} value={money.format(summary?.budget ?? project.value)} />
            <Kpi label={t('projectDetail.expenses')} value={money.format(summary?.totalExpenses ?? 0)} accent={colors.danger} />
          </View>
          <View className="flex-row gap-3">
            <Kpi label={t('projectDetail.income')} value={money.format(summary?.totalIncome ?? 0)} accent={colors.success} />
            <Kpi
              label={t('projectDetail.profit')}
              value={money.format(summary?.netProfit ?? 0)}
              accent={(summary?.netProfit ?? 0) >= 0 ? colors.success : colors.danger}
            />
          </View>

          <View className="flex-row gap-3">
            <Pressable
              onPress={() => router.push(`/xarajatlar?projectId=${projectId}`)}
              className="flex-1 flex-row items-center justify-center gap-2 rounded-2xl border border-border/40 bg-black/20 p-4 active:bg-white/5"
            >
              <Ionicons name="wallet-outline" size={18} color={colors.purple} />
              <Text className="text-white text-sm font-medium">{t('expenses.title')}</Text>
            </Pressable>
            <Pressable
              onPress={() => router.push(`/hisobotlar?projectId=${projectId}`)}
              className="flex-1 flex-row items-center justify-center gap-2 rounded-2xl border border-border/40 bg-black/20 p-4 active:bg-white/5"
            >
              <Ionicons name="bar-chart-outline" size={18} color={colors.purple} />
              <Text className="text-white text-sm font-medium">{t('reports.title')}</Text>
            </Pressable>
          </View>

          {summary && summary.budgetUsedPercent !== null ? (
            <View className="rounded-2xl border border-border/40 bg-black/20 p-4">
              <View className="flex-row justify-between mb-2">
                <Text className="text-muted text-sm">{t('projectDetail.budgetUsed')}</Text>
                <Text className="text-white text-sm font-semibold">{summary.budgetUsedPercent}%</Text>
              </View>
              <View className="h-2 rounded-full bg-border/40 overflow-hidden">
                <View
                  className="h-full rounded-full"
                  style={{
                    width: `${Math.min(100, summary.budgetUsedPercent)}%`,
                    backgroundColor: summary.budgetUsedPercent > 100 ? colors.danger : colors.purple,
                  }}
                />
              </View>
            </View>
          ) : null}

          <View className="gap-2">
            <Text className="text-white text-base font-semibold">{t('projectDetail.estimatesTitle')}</Text>
            {project.estimates.length === 0 ? (
              <Text className="text-muted text-sm">{t('projectDetail.noEstimates')}</Text>
            ) : (
              project.estimates.map((e) => (
                <Pressable
                  key={e.id}
                  onPress={() => router.push(`/smeta/${e.id}`)}
                  className="rounded-xl border border-border/40 bg-black/20 p-3 flex-row justify-between items-center active:bg-white/5"
                >
                  <Text className="text-white text-sm flex-1" numberOfLines={1}>{e.title}</Text>
                  <View className="flex-row items-center gap-1">
                    <Text className="text-muted text-sm">{formatMoney(e.total, e.currency)}</Text>
                    <Ionicons name="chevron-forward" size={16} color={colors.muted} />
                  </View>
                </Pressable>
              ))
            )}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
