import { Alert, Platform, View, Text, ScrollView, Pressable } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useEstimate, useDeleteEstimate } from '@/lib/hooks/useEstimates';
import { Loading, ErrorState } from '@/components/States';
import { formatMoney } from '@/lib/format';
import { colors } from '@/theme/tokens';

export default function EstimateDetailScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const estimateId = typeof id === 'string' ? id : '';

  const { data: e, isLoading, isError, refetch } = useEstimate(estimateId);
  const del = useDeleteEstimate();

  function confirmDelete() {
    const doDelete = async () => {
      await del.mutateAsync(estimateId);
      router.back();
    };
    // web'da Alert tugmalari ishlamaydi — window.confirm.
    if (Platform.OS === 'web') {
      if (globalThis.confirm?.(t('smeta.deleteConfirm'))) void doDelete();
      return;
    }
    Alert.alert('', t('smeta.deleteConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('common.delete'), style: 'destructive', onPress: () => void doDelete() },
    ]);
  }

  return (
    <SafeAreaView className="flex-1 bg-ink" edges={['top']}>
      <View className="flex-row items-center gap-2 px-3 py-2 border-b border-border/40">
        <Pressable onPress={() => router.back()} className="w-10 h-10 items-center justify-center rounded-full active:bg-white/5">
          <Ionicons name="chevron-back" size={24} color={colors.white} />
        </Pressable>
        <Text className="text-white text-base font-semibold flex-1" numberOfLines={1}>{e?.title ?? '—'}</Text>
        {e ? (
          <Pressable onPress={confirmDelete} className="w-10 h-10 items-center justify-center rounded-full active:bg-white/5">
            <Ionicons name="trash-outline" size={20} color={colors.danger} />
          </Pressable>
        ) : null}
      </View>

      {isLoading ? (
        <Loading />
      ) : isError || !e ? (
        <ErrorState onRetry={() => void refetch()} />
      ) : (
        <ScrollView className="flex-1" contentContainerClassName="p-4 gap-4">
          <View className="rounded-2xl border border-border/40 bg-black/20 p-4">
            <Text className="text-muted text-xs">{t(`smeta.status${e.status}`)}</Text>
            <Text className="text-white text-lg font-bold mt-1">{e.title}</Text>
          </View>

          <View className="gap-2">
            <Text className="text-white text-base font-semibold">{t('smeta.items')}</Text>
            {e.items.length === 0 ? (
              <Text className="text-muted text-sm">{t('smeta.empty')}</Text>
            ) : (
              e.items.map((it) => (
                <View key={it.id} className="rounded-xl border border-border/40 bg-black/20 p-3">
                  <View className="flex-row justify-between">
                    <Text className="text-white text-sm flex-1" numberOfLines={1}>{it.name}</Text>
                    <Text className="text-white text-sm">{formatMoney(it.lineTotal, e.currency)}</Text>
                  </View>
                  <Text className="text-muted text-xs mt-0.5">
                    {it.qty} {it.unit} × {formatMoney(it.unitPrice, e.currency)}
                  </Text>
                </View>
              ))
            )}
          </View>

          <View className="rounded-2xl border border-border/40 bg-black/20 p-4 gap-1">
            <TotalRow label={t('smeta.subtotal')} value={formatMoney(e.subtotal, e.currency)} />
            <TotalRow label={`${t('smeta.tax')} (${e.taxRate}%)`} value={formatMoney(e.taxAmount, e.currency)} />
            <View className="h-px bg-border/40 my-1" />
            <TotalRow label={t('smeta.total')} value={formatMoney(e.total, e.currency)} bold />
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function TotalRow({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <View className="flex-row justify-between">
      <Text className={bold ? 'text-white font-semibold' : 'text-muted text-sm'}>{label}</Text>
      <Text className={bold ? 'text-white font-bold' : 'text-white text-sm'}>{value}</Text>
    </View>
  );
}
