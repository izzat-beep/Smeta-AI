import { useState } from 'react';
import { View, Text, TextInput, FlatList, Pressable, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useMaterials, useMaterialCategories } from '@/lib/hooks/useMaterials';
import { useCart, cartCount } from '@/lib/cart';
import { Loading, ErrorState, EmptyState } from '@/components/States';
import { formatMoney } from '@/lib/format';
import { colors } from '@/theme/tokens';
import type { Material } from '@smeta/shared';

export default function MaterialsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const [q, setQ] = useState('');
  const [category, setCategory] = useState<string | undefined>(undefined);
  const { data, isLoading, isError, refetch } = useMaterials({ q: q.trim() || undefined, category });
  const { data: categories } = useMaterialCategories();
  const cartItems = useCart((s) => s.items);
  const addToCart = useCart((s) => s.add);
  const count = cartCount(cartItems);

  return (
    <View className="flex-1 bg-ink">
      <View className="px-4 pt-3 gap-2">
        <View className="flex-row items-center rounded-xl border border-border/40 bg-black/20 px-3">
          <Ionicons name="search-outline" size={18} color={colors.muted} />
          <TextInput value={q} onChangeText={setQ} placeholder={t('materials.search')} placeholderTextColor={colors.muted}
            className="flex-1 py-3 px-2 text-white text-sm" />
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-2 pb-1">
          <Cat label={t('materials.all')} active={!category} onPress={() => setCategory(undefined)} />
          {(categories ?? []).map((c) => (
            <Cat key={c} label={c} active={category === c} onPress={() => setCategory(c)} />
          ))}
        </ScrollView>
      </View>

      {isLoading ? (
        <Loading />
      ) : isError || !data ? (
        <ErrorState onRetry={() => void refetch()} />
      ) : (
        <FlatList
          data={data}
          keyExtractor={(m) => m.id}
          contentContainerClassName="p-4 gap-3"
          ListEmptyComponent={<EmptyState icon="cube-outline" message={t('materials.empty')} />}
          renderItem={({ item }: { item: Material }) => (
            <View className="rounded-2xl border border-border/40 bg-black/20 p-4">
              <View className="flex-row justify-between gap-2">
                <View className="flex-1">
                  <Text className="text-white font-semibold" numberOfLines={2}>{item.name}</Text>
                  <Text className="text-muted text-xs mt-0.5">{item.provider ?? item.category}</Text>
                </View>
                <Text className="text-white font-bold">{formatMoney(item.priceUzs, 'UZS')}</Text>
              </View>
              <View className="flex-row items-center justify-between mt-3">
                <Text className="text-muted text-[11px]">{t('materials.stock')}: {item.stock} {item.unit}</Text>
                <Pressable
                  onPress={() => addToCart({ materialId: item.id, name: item.name, unit: item.unit, priceUzs: item.priceUzs, imageUrl: item.imageUrl })}
                  className="flex-row items-center gap-1 px-3 py-2 rounded-lg bg-purple active:bg-purple-dark"
                >
                  <Ionicons name="cart-outline" size={14} color={colors.white} />
                  <Text className="text-white text-xs font-semibold">{t('materials.addToCart')}</Text>
                </Pressable>
              </View>
            </View>
          )}
        />
      )}

      {count > 0 ? (
        <Pressable
          onPress={() => router.push('/savat')}
          className="absolute bottom-6 right-6 flex-row items-center gap-2 px-5 h-14 rounded-full bg-purple shadow-lg active:bg-purple-dark"
        >
          <Ionicons name="cart" size={20} color={colors.white} />
          <Text className="text-white font-bold">{count}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function Cat({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} className={`px-3 py-1.5 rounded-full border ${active ? 'bg-purple border-purple' : 'border-border/40 bg-black/20'}`}>
      <Text className={active ? 'text-white text-xs' : 'text-muted text-xs'}>{label}</Text>
    </Pressable>
  );
}
