import { useMemo, useState } from 'react';
import { Alert, Platform, View, Text, TextInput, Pressable, FlatList } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useExpenses, useAddExpense, useDeleteExpense } from '@/lib/hooks/useExpenses';
import { Loading, ErrorState, EmptyState } from '@/components/States';
import { Button } from '@/components/Button';
import { formatMoney, formatDate } from '@/lib/format';
import { colors } from '@/theme/tokens';
import type { ExpenseItem, ExpenseCategory, Currency } from '@smeta/shared';

const CATS: ExpenseCategory[] = ['MATERIAL', 'LABOR', 'EQUIPMENT', 'GENERAL'];

export default function ExpensesScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { projectId } = useLocalSearchParams<{ projectId?: string }>();
  const pid = typeof projectId === 'string' ? projectId : undefined;

  const { data, isLoading, isError, refetch } = useExpenses(pid);
  const add = useAddExpense();
  const del = useDeleteExpense();

  const [formOpen, setFormOpen] = useState(false);
  const [label, setLabel] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<ExpenseCategory>('GENERAL');
  const [currency, setCurrency] = useState<Currency>('UZS');
  const [error, setError] = useState<string | null>(null);

  const total = useMemo(() => (data ?? []).reduce((s, e) => s + e.amount, 0), [data]);

  async function onAdd() {
    setError(null);
    if (!label.trim()) return setError(t('expenses.needLabel'));
    if (!(Number(amount) > 0)) return setError(t('expenses.needAmount'));
    try {
      await add.mutateAsync({ label: label.trim(), amount: Number(amount), category, currency, projectId: pid ?? null });
      setLabel(''); setAmount(''); setCategory('GENERAL'); setFormOpen(false);
    } catch {
      setError(t('common.error'));
    }
  }

  function confirmDelete(item: ExpenseItem) {
    const doDelete = () => void del.mutateAsync({ id: item.id, projectId: item.projectId });
    if (Platform.OS === 'web') {
      if (globalThis.confirm?.(t('expenses.deleteConfirm'))) doDelete();
      return;
    }
    Alert.alert('', t('expenses.deleteConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('common.delete'), style: 'destructive', onPress: doDelete },
    ]);
  }

  return (
    <SafeAreaView className="flex-1 bg-ink" edges={['top']}>
      <View className="flex-row items-center gap-2 px-3 py-2 border-b border-border/40">
        <Pressable onPress={() => router.back()} className="w-10 h-10 items-center justify-center rounded-full active:bg-white/5">
          <Ionicons name="chevron-back" size={24} color={colors.white} />
        </Pressable>
        <Text className="text-white text-base font-semibold flex-1">{t('expenses.title')}</Text>
        <Pressable onPress={() => setFormOpen((v) => !v)} className="w-10 h-10 items-center justify-center rounded-full active:bg-white/5">
          <Ionicons name={formOpen ? 'close' : 'add'} size={24} color={colors.purple} />
        </Pressable>
      </View>

      {formOpen ? (
        <View className="p-4 gap-3 border-b border-border/40">
          {error ? <Text className="text-danger text-xs">{error}</Text> : null}
          <TextInput value={label} onChangeText={setLabel} placeholder={t('expenses.labelPh')} placeholderTextColor={colors.muted}
            className="rounded-xl border border-border/40 bg-black/20 px-4 py-3 text-white" />
          <View className="flex-row gap-2">
            <TextInput value={amount} onChangeText={(v) => setAmount(v.replace(/[^\d.]/g, ''))} placeholder={t('expenses.amount')} keyboardType="numeric" placeholderTextColor={colors.muted}
              className="flex-1 rounded-xl border border-border/40 bg-black/20 px-4 py-3 text-white" />
            <View className="flex-row rounded-xl border border-border/40 overflow-hidden">
              {(['UZS', 'USD'] as Currency[]).map((c) => (
                <Pressable key={c} onPress={() => setCurrency(c)} className={`px-3 justify-center ${currency === c ? 'bg-purple' : 'bg-black/20'}`}>
                  <Text className={currency === c ? 'text-white text-xs font-semibold' : 'text-muted text-xs'}>{c}</Text>
                </Pressable>
              ))}
            </View>
          </View>
          <View className="flex-row flex-wrap gap-2">
            {CATS.map((c) => (
              <Pressable key={c} onPress={() => setCategory(c)} className={`px-3 py-1.5 rounded-full border ${category === c ? 'bg-purple border-purple' : 'border-border/40 bg-black/20'}`}>
                <Text className={category === c ? 'text-white text-xs' : 'text-muted text-xs'}>{t(`expenses.cat${c}`)}</Text>
              </Pressable>
            ))}
          </View>
          <Button title={t('expenses.save')} loading={add.isPending} onPress={onAdd} />
        </View>
      ) : null}

      {isLoading ? (
        <Loading />
      ) : isError || !data ? (
        <ErrorState onRetry={() => void refetch()} />
      ) : (
        <FlatList
          data={data}
          keyExtractor={(e) => String(e.id)}
          contentContainerClassName="p-4 gap-2"
          ListHeaderComponent={
            data.length > 0 ? (
              <View className="flex-row justify-between mb-2">
                <Text className="text-muted text-sm">{t('expenses.total')}</Text>
                <Text className="text-white font-bold">{formatMoney(total, (data[0]?.currency as Currency) ?? 'UZS')}</Text>
              </View>
            ) : null
          }
          ListEmptyComponent={<EmptyState icon="wallet-outline" message={t('expenses.empty')} />}
          renderItem={({ item }: { item: ExpenseItem }) => (
            <View className="rounded-xl border border-border/40 bg-black/20 p-3 flex-row items-center gap-3">
              <View className="flex-1">
                <Text className="text-white text-sm" numberOfLines={1}>{item.label}</Text>
                <Text className="text-muted text-[11px] mt-0.5">
                  {t(`expenses.cat${item.category}`)} · {formatDate(item.spentAt ?? item.createdAt)}
                  {item.orderId ? ` · ${t('expenses.fromOrder')}` : ''}
                </Text>
              </View>
              <Text className="text-white text-sm">{formatMoney(item.amount, (item.currency as Currency) ?? 'UZS')}</Text>
              {item.orderId ? null : (
                <Pressable onPress={() => confirmDelete(item)} className="w-8 h-8 items-center justify-center">
                  <Ionicons name="trash-outline" size={16} color={colors.danger} />
                </Pressable>
              )}
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}
