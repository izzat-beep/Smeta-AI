import { useEffect, useState } from 'react';
import { View, Text, TextInput, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/lib/auth/authStore';
import { useSettings, type AppLanguage } from '@/lib/settingsStore';
import { settingsApi } from '@/lib/api/endpoints';
import { Button } from '@/components/Button';
import { colors } from '@/theme/tokens';
import type { Currency } from '@smeta/shared';

export default function SettingsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const user = useAuth((s) => s.user);
  const tenant = useAuth((s) => s.tenant);
  const refreshMe = useAuth((s) => s.refreshMe);
  const logout = useAuth((s) => s.logout);
  const { language, currency, setLanguage, setCurrency } = useSettings();

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [position, setPosition] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (user) {
      setFullName(user.fullName);
      setPhone(user.phone ?? '');
      setPosition(user.position ?? '');
    }
  }, [user]);

  async function onSave() {
    setSaving(true);
    setSaved(false);
    try {
      await settingsApi.update({ fullName: fullName.trim(), phone: phone.trim() || null, position: position.trim() || null });
      await refreshMe();
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch {
      /* xatoni jim o'tkazamiz — MVP */
    } finally {
      setSaving(false);
    }
  }

  const initial = (fullName.trim()[0] ?? '?').toUpperCase();

  return (
    <ScrollView className="flex-1 bg-ink" contentContainerClassName="p-4 gap-4" keyboardShouldPersistTaps="handled">
      {/* Profil kartasi */}
      <View className="items-center gap-2 py-2">
        <View className="w-20 h-20 rounded-full bg-purple/20 items-center justify-center">
          <Text className="text-purple text-2xl font-bold">{initial}</Text>
        </View>
        <Text className="text-white text-lg font-bold">{user?.fullName ?? '—'}</Text>
        <Text className="text-muted text-sm">{user?.email ?? '—'}</Text>
        <View className="flex-row gap-2 mt-1">
          <Badge text={user?.role ?? '—'} />
          {tenant ? <Badge text={tenant.name} /> : null}
        </View>
      </View>

      {/* Profil tahriri */}
      <View className="gap-3">
        <Text className="text-white text-base font-semibold">{t('settings.profile')}</Text>
        <Field label={t('settings.fullName')} value={fullName} onChangeText={setFullName} />
        <Field label={t('settings.phone')} value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
        <Field label={t('settings.position')} value={position} onChangeText={setPosition} />
        <Button title={saved ? t('settings.saved') : t('settings.save')} loading={saving} onPress={onSave} />
      </View>

      {/* Til */}
      <View>
        <Text className="text-muted text-xs uppercase mb-2">{t('settings.language')}</Text>
        <Toggle<AppLanguage>
          options={[{ v: 'uz', label: 'O‘zbek' }, { v: 'ru', label: 'Русский' }]}
          value={language}
          onChange={(v) => void setLanguage(v)}
        />
      </View>

      {/* Valyuta */}
      <View>
        <Text className="text-muted text-xs uppercase mb-2">{t('settings.currency')}</Text>
        <Toggle<Currency>
          options={[{ v: 'UZS', label: 'UZS (so‘m)' }, { v: 'USD', label: 'USD ($)' }]}
          value={currency}
          onChange={(v) => void setCurrency(v)}
        />
      </View>

      {/* Buyurtmalar */}
      <Pressable onPress={() => router.push('/buyurtmalar')} className="flex-row items-center justify-between rounded-2xl border border-border/40 bg-black/20 p-4 active:bg-white/5">
        <View className="flex-row items-center gap-2">
          <Ionicons name="receipt-outline" size={18} color={colors.purple} />
          <Text className="text-white text-sm font-medium">{t('settings.orders')}</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={colors.muted} />
      </Pressable>

      {/* Chiqish */}
      <Button title={t('settings.logout')} variant="danger" onPress={() => void logout()} />
      <View className="h-6" />
    </ScrollView>
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

function Badge({ text }: { text: string }) {
  return (
    <View className="rounded-full bg-white/5 px-3 py-1">
      <Text className="text-muted text-xs">{text}</Text>
    </View>
  );
}

function Toggle<T extends string>({ options, value, onChange }: { options: { v: T; label: string }[]; value: T; onChange: (v: T) => void }) {
  return (
    <View className="flex-row rounded-xl border border-border/40 overflow-hidden">
      {options.map((o) => (
        <Pressable key={o.v} onPress={() => onChange(o.v)} className={`flex-1 py-3 items-center ${value === o.v ? 'bg-purple' : 'bg-black/20'}`}>
          <Text className={value === o.v ? 'text-white font-semibold' : 'text-muted'}>{o.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}
