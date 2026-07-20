import { View, Text, FlatList, Pressable, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useOrders } from '@/lib/hooks/useMaterials';
import { Loading, ErrorState, EmptyState } from '@/components/States';
import { formatMoney, formatDate } from '@/lib/format';
import { colors } from '@/theme/tokens';
import type { Order, OrderStatus } from '@smeta/shared';

const STATUS_COLOR: Record<OrderStatus, string> = {
  NEW: colors.purple,
  ACCEPTED: colors.purple,
  PREPARING: '#F59E0B',
  IN_TRANSIT: '#F59E0B',
  PENDING_PAYMENT: '#F59E0B',
  PAID: colors.success,
  DELIVERED: colors.success,
  CANCELLED: colors.danger,
};

export default function OrdersScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { data, isLoading, isError, refetch, isRefetching } = useOrders();

  return (
    <SafeAreaView className="flex-1 bg-ink" edges={['top']}>
      <View className="flex-row items-center gap-2 px-3 py-2 border-b border-border/40">
        <Pressable onPress={() => router.back()} className="w-10 h-10 items-center justify-center rounded-full active:bg-white/5">
          <Ionicons name="chevron-back" size={24} color={colors.white} />
        </Pressable>
        <Text className="text-white text-base font-semibold flex-1">{t('orders.title')}</Text>
      </View>

      {isLoading ? (
        <Loading />
      ) : isError || !data ? (
        <ErrorState onRetry={() => void refetch()} />
      ) : (
        <FlatList
          data={data}
          keyExtractor={(o) => o.id}
          contentContainerClassName="p-4 gap-3"
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => void refetch()} tintColor={colors.purple} />}
          ListEmptyComponent={<EmptyState icon="receipt-outline" message={t('orders.empty')} />}
          renderItem={({ item }: { item: Order }) => (
            <View className="rounded-2xl border border-border/40 bg-black/20 p-4">
              <View className="flex-row items-center justify-between">
                <Text className="text-white font-semibold">#{item.no}</Text>
                <View className="rounded-full px-2 py-1" style={{ backgroundColor: `${STATUS_COLOR[item.status]}22` }}>
                  <Text className="text-[11px] font-semibold" style={{ color: STATUS_COLOR[item.status] }}>
                    {t(`orderStatus.${item.status}`)}
                  </Text>
                </View>
              </View>
              <Text className="text-muted text-xs mt-1">
                {item.items.length} {t('orders.items')} · {formatDate(item.createdAt)}
              </Text>
              <View className="flex-row justify-between mt-2">
                <Text className="text-muted text-xs">{t('orders.total')}</Text>
                <Text className="text-white font-medium">{formatMoney(item.total, item.currency)}</Text>
              </View>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}
