import { useEffect, useState } from 'react';
import { View, Text, TextInput, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useCart, cartTotalUzs } from '@/lib/cart';
import { useAuth } from '@/lib/auth/authStore';
import { useProjects } from '@/lib/hooks/useProjects';
import { useCreateOrder } from '@/lib/hooks/useMaterials';
import { EmptyState } from '@/components/States';
import { Button } from '@/components/Button';
import { ApiError } from '@/lib/api/client';
import { formatMoney } from '@/lib/format';
import { colors } from '@/theme/tokens';

export default function CartScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const items = useCart((s) => s.items);
  const setQty = useCart((s) => s.setQty);
  const clear = useCart((s) => s.clear);
  const user = useAuth((s) => s.user);
  const { data: projects } = useProjects();
  const create = useCreateOrder();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [projectId, setProjectId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setName((v) => v || user.fullName);
      setPhone((v) => v || user.phone || '');
    }
  }, [user]);

  const total = cartTotalUzs(items);

  async function onSubmit() {
    setError(null);
    if (!name.trim()) return setError(t('cart.needName'));
    if (!phone.trim()) return setError(t('cart.needPhone'));
    try {
      await create.mutateAsync({
        customerName: name.trim(),
        customerPhone: phone.trim(),
        address: address.trim() || null,
        currency: 'UZS',
        projectId,
        items: items.map((i) => ({ materialId: i.materialId, name: i.name, unit: i.unit, unitPrice: i.priceUzs, qty: i.qty })),
      });
      clear();
      router.replace('/buyurtmalar');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('common.error'));
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-ink" edges={['top']}>
      <View className="flex-row items-center gap-2 px-3 py-2 border-b border-border/40">
        <Pressable onPress={() => router.back()} className="w-10 h-10 items-center justify-center rounded-full active:bg-white/5">
          <Ionicons name="chevron-back" size={24} color={colors.white} />
        </Pressable>
        <Text className="text-white text-base font-semibold flex-1">{t('cart.title')}</Text>
      </View>

      {items.length === 0 ? (
        <EmptyState icon="cart-outline" message={t('cart.empty')} />
      ) : (
        <ScrollView className="flex-1" contentContainerClassName="p-4 gap-4" keyboardShouldPersistTaps="handled">
          {error ? (
            <View className="rounded-xl border border-danger/40 bg-danger/10 px-4 py-3">
              <Text className="text-danger text-sm">{error}</Text>
            </View>
          ) : null}

          <View className="gap-2">
            {items.map((i) => (
              <View key={i.materialId} className="rounded-xl border border-border/40 bg-black/20 p-3 flex-row items-center gap-3">
                <View className="flex-1">
                  <Text className="text-white text-sm" numberOfLines={1}>{i.name}</Text>
                  <Text className="text-muted text-xs mt-0.5">{formatMoney(i.priceUzs, 'UZS')} / {i.unit}</Text>
                </View>
                <View className="flex-row items-center gap-2">
                  <Pressable onPress={() => setQty(i.materialId, i.qty - 1)} className="w-8 h-8 items-center justify-center rounded-lg bg-white/5">
                    <Ionicons name="remove" size={16} color={colors.white} />
                  </Pressable>
                  <Text className="text-white w-6 text-center">{i.qty}</Text>
                  <Pressable onPress={() => setQty(i.materialId, i.qty + 1)} className="w-8 h-8 items-center justify-center rounded-lg bg-white/5">
                    <Ionicons name="add" size={16} color={colors.white} />
                  </Pressable>
                </View>
              </View>
            ))}
          </View>

          {/* Buyurtmachi ma'lumotlari */}
          <View className="gap-3">
            <Field label={t('cart.customerName')} value={name} onChangeText={setName} />
            <Field label={t('cart.customerPhone')} value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
            <Field label={t('cart.address')} value={address} onChangeText={setAddress} />
          </View>

          {projects && projects.length > 0 ? (
            <View>
              <Text className="text-muted text-xs uppercase mb-2">{t('cart.project')}</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-2">
                <Chip label={t('cart.noProject')} active={projectId === null} onPress={() => setProjectId(null)} />
                {projects.map((p) => (
                  <Chip key={p.id} label={p.title} active={projectId === p.id} onPress={() => setProjectId(p.id)} />
                ))}
              </ScrollView>
            </View>
          ) : null}

          <View className="rounded-2xl border border-border/40 bg-black/20 p-4 flex-row justify-between">
            <Text className="text-muted">{t('cart.total')}</Text>
            <Text className="text-white font-bold text-lg">{formatMoney(total, 'UZS')}</Text>
          </View>

          <Button title={create.isPending ? t('cart.submitting') : t('cart.submit')} loading={create.isPending} onPress={onSubmit} />
          <View className="h-6" />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function Field({ label, ...props }: { label: string } & React.ComponentProps<typeof TextInput>) {
  return (
    <View>
      <Text className="text-muted text-xs uppercase mb-2">{label}</Text>
      <TextInput placeholderTextColor={colors.muted} className="rounded-xl border border-border/40 bg-black/20 px-4 py-3 text-white" {...props} />
    </View>
  );
}

function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} className={`px-3 py-2 rounded-full border ${active ? 'bg-purple border-purple' : 'border-border/40 bg-black/20'}`}>
      <Text className={active ? 'text-white text-sm' : 'text-muted text-sm'} numberOfLines={1}>{label}</Text>
    </Pressable>
  );
}
