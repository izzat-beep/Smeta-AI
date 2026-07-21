import { useMemo, useState } from 'react';
import { View, Text, TextInput, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useProjects } from '@/lib/hooks/useProjects';
import { useCreateEstimate } from '@/lib/hooks/useEstimates';
import { computeTotals } from '@/lib/estimate';
import { formatMoney } from '@/lib/format';
import { ApiError } from '@/lib/api/client';
import { Button } from '@/components/Button';
import { VoiceButton } from '@/components/VoiceButton';
import type { VoiceResult } from '@/lib/voice';
import { colors } from '@/theme/tokens';
import type { EstimateItemType, Currency } from '@smeta/shared';

interface Row {
  key: string;
  type: EstimateItemType;
  name: string;
  qty: string;
  unitPrice: string;
  unit: string;
}

const TYPES: EstimateItemType[] = ['MATERIAL', 'LABOR', 'EQUIPMENT'];
let counter = 0;
const newRow = (): Row => ({ key: `r${counter++}`, type: 'MATERIAL', name: '', qty: '1', unitPrice: '', unit: 'dona' });

export default function CalculatorScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { data: projects } = useProjects();
  const create = useCreateEstimate();

  const [title, setTitle] = useState('');
  const [projectId, setProjectId] = useState<string | null>(null);
  const [currency, setCurrency] = useState<Currency>('UZS');
  const [taxRate, setTaxRate] = useState('12');
  const [rows, setRows] = useState<Row[]>([newRow()]);
  const [error, setError] = useState<string | null>(null);

  const totals = useMemo(
    () => computeTotals(rows.map((r) => ({ qty: Number(r.qty), unitPrice: Number(r.unitPrice) })), Number(taxRate)),
    [rows, taxRate],
  );

  function updateRow(key: string, patch: Partial<Row>) {
    setRows((prev) => prev.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  }
  function removeRow(key: string) {
    setRows((prev) => (prev.length > 1 ? prev.filter((r) => r.key !== key) : prev));
  }

  // Ovozli buyruq: "g'isht besh ming dona, donasi ming so'm" -> yangi qator.
  function onVoice(r: VoiceResult) {
    const i = r.intent;
    if (i.action === 'calculator_input') {
      setRows((prev) => [
        ...prev,
        {
          key: `r${counter++}`,
          type: 'MATERIAL',
          name: i.itemName ?? r.transcript.slice(0, 30),
          qty: i.qty != null ? String(i.qty) : '1',
          unitPrice: i.unitPrice != null ? String(i.unitPrice) : '',
          unit: i.unit ?? 'dona',
        },
      ]);
      if (i.currency) setCurrency(i.currency);
    }
  }

  async function onSave() {
    setError(null);
    if (!title.trim()) return setError(t('calc.needTitle'));
    const items = rows
      .filter((r) => r.name.trim() && Number(r.unitPrice) > 0)
      .map((r) => ({
        name: r.name.trim(),
        type: r.type,
        qty: Number(r.qty) || 0,
        unit: r.unit.trim() || 'dona',
        unitPrice: Number(r.unitPrice) || 0,
      }));
    if (items.length === 0) return setError(t('calc.needItems'));
    try {
      const created = await create.mutateAsync({
        title: title.trim(),
        projectId,
        currency,
        taxRate: Number(taxRate) || 0,
        items,
      });
      router.replace(`/smeta/${created.id}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('common.error'));
    }
  }

  return (
    <ScrollView className="flex-1 bg-ink" contentContainerClassName="p-4 gap-4" keyboardShouldPersistTaps="handled">
      {error ? (
        <View className="rounded-xl border border-danger/40 bg-danger/10 px-4 py-3">
          <Text className="text-danger text-sm">{error}</Text>
        </View>
      ) : null}

      <View>
        <Text className="text-muted text-xs uppercase mb-2">{t('calc.estimateTitle')}</Text>
        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder={t('calc.titlePh')}
          placeholderTextColor={colors.muted}
          className="rounded-xl border border-border/40 bg-black/20 px-4 py-3 text-white"
        />
      </View>

      {/* Loyiha tanlash */}
      {projects && projects.length > 0 ? (
        <View>
          <Text className="text-muted text-xs uppercase mb-2">{t('calc.project')}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-2">
            <Chip label={t('calc.noProject')} active={projectId === null} onPress={() => setProjectId(null)} />
            {projects.map((p) => (
              <Chip key={p.id} label={p.title} active={projectId === p.id} onPress={() => setProjectId(p.id)} />
            ))}
          </ScrollView>
        </View>
      ) : null}

      {/* Valyuta + soliq */}
      <View className="flex-row gap-3">
        <View className="flex-1">
          <Text className="text-muted text-xs uppercase mb-2">{t('calc.taxRate')}</Text>
          <TextInput
            value={taxRate}
            onChangeText={(v) => setTaxRate(v.replace(/[^\d.]/g, ''))}
            keyboardType="numeric"
            className="rounded-xl border border-border/40 bg-black/20 px-4 py-3 text-white"
          />
        </View>
        <View className="flex-1">
          <Text className="text-muted text-xs uppercase mb-2">UZS / USD</Text>
          <View className="flex-row rounded-xl border border-border/40 overflow-hidden">
            {(['UZS', 'USD'] as Currency[]).map((c) => (
              <Pressable
                key={c}
                onPress={() => setCurrency(c)}
                className={`flex-1 py-3 items-center ${currency === c ? 'bg-purple' : 'bg-black/20'}`}
              >
                <Text className={currency === c ? 'text-white font-semibold' : 'text-muted'}>{c}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      </View>

      {/* Ovozli buyruq */}
      <VoiceButton onResult={onVoice} />

      {/* Qatorlar */}
      <View className="gap-3">
        <Text className="text-white text-base font-semibold">{t('calc.items')}</Text>
        {rows.map((r) => (
          <View key={r.key} className="rounded-2xl border border-border/40 bg-black/20 p-3 gap-2">
            <View className="flex-row items-center justify-between">
              <View className="flex-row gap-1">
                {TYPES.map((ty) => (
                  <Pressable
                    key={ty}
                    onPress={() => updateRow(r.key, { type: ty })}
                    className={`px-2 py-1 rounded-lg ${r.type === ty ? 'bg-purple' : 'bg-white/5'}`}
                  >
                    <Text className={`text-[11px] ${r.type === ty ? 'text-white' : 'text-muted'}`}>{t(`calc.type${ty}`)}</Text>
                  </Pressable>
                ))}
              </View>
              <Pressable onPress={() => removeRow(r.key)} className="w-8 h-8 items-center justify-center">
                <Ionicons name="trash-outline" size={18} color={colors.danger} />
              </Pressable>
            </View>
            <TextInput
              value={r.name}
              onChangeText={(v) => updateRow(r.key, { name: v })}
              placeholder={t('calc.namePh')}
              placeholderTextColor={colors.muted}
              className="rounded-lg border border-border/40 bg-black/20 px-3 py-2 text-white text-sm"
            />
            <View className="flex-row gap-2">
              <LabeledInput label={t('calc.qty')} value={r.qty} onChangeText={(v) => updateRow(r.key, { qty: v.replace(/[^\d.]/g, '') })} keyboardType="numeric" />
              <LabeledInput label={t('calc.unit')} value={r.unit} onChangeText={(v) => updateRow(r.key, { unit: v })} />
              <LabeledInput label={t('calc.unitPrice')} value={r.unitPrice} onChangeText={(v) => updateRow(r.key, { unitPrice: v.replace(/[^\d.]/g, '') })} keyboardType="numeric" />
            </View>
            <Text className="text-right text-muted text-xs">
              = {formatMoney((Number(r.qty) || 0) * (Number(r.unitPrice) || 0), currency)}
            </Text>
          </View>
        ))}
        <Pressable onPress={() => setRows((p) => [...p, newRow()])} className="flex-row items-center justify-center gap-2 py-3 rounded-xl border border-dashed border-border/60">
          <Ionicons name="add" size={18} color={colors.purple} />
          <Text className="text-purple text-sm font-medium">{t('calc.addRow')}</Text>
        </Pressable>
      </View>

      {/* Jami */}
      <View className="rounded-2xl border border-border/40 bg-black/20 p-4 gap-1">
        <Row label={t('calc.subtotal')} value={formatMoney(totals.subtotal, currency)} />
        <Row label={`${t('calc.tax')} (${taxRate || 0}%)`} value={formatMoney(totals.taxAmount, currency)} />
        <View className="h-px bg-border/40 my-1" />
        <Row label={t('calc.total')} value={formatMoney(totals.total, currency)} bold />
      </View>

      <Button title={create.isPending ? t('calc.saving') : t('calc.save')} loading={create.isPending} onPress={onSave} />
      <View className="h-6" />
    </ScrollView>
  );
}

function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} className={`px-3 py-2 rounded-full border ${active ? 'bg-purple border-purple' : 'border-border/40 bg-black/20'}`}>
      <Text className={active ? 'text-white text-sm' : 'text-muted text-sm'} numberOfLines={1}>{label}</Text>
    </Pressable>
  );
}

function LabeledInput({ label, ...props }: { label: string } & React.ComponentProps<typeof TextInput>) {
  return (
    <View className="flex-1">
      <Text className="text-muted text-[10px] mb-1">{label}</Text>
      <TextInput placeholderTextColor={colors.muted} className="rounded-lg border border-border/40 bg-black/20 px-2 py-2 text-white text-sm" {...props} />
    </View>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <View className="flex-row justify-between">
      <Text className={bold ? 'text-white font-semibold' : 'text-muted text-sm'}>{label}</Text>
      <Text className={bold ? 'text-white font-bold' : 'text-white text-sm'}>{value}</Text>
    </View>
  );
}
