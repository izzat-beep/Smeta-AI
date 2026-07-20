import { useState } from 'react';
import { View, Text, TextInput, Pressable, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/lib/auth/authStore';
import { ApiError } from '@/lib/api/client';
import { colors } from '@/theme/tokens';

// Login ekrani (skelet) — auth oqimini isbotlaydi. To'liq forma validatsiyasi
// (React Hook Form + Zod) 3-bosqichda qo'shiladi.
export default function LoginScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const login = useAuth((s) => s.login);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit() {
    setError(null);
    setLoading(true);
    try {
      await login(email.trim(), password);
      router.replace('/(tabs)');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('common.error'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      className="flex-1 bg-ink"
    >
      <View className="flex-1 justify-center px-6">
        <Text className="text-white text-3xl font-bold mb-2">Smeta AI</Text>
        <Text className="text-muted text-base mb-8">{t('auth.loginTitle')}</Text>

        {error ? (
          <View className="mb-4 rounded-xl border border-danger/40 bg-danger/10 px-4 py-3">
            <Text className="text-danger text-sm">{error}</Text>
          </View>
        ) : null}

        <Text className="text-muted text-xs uppercase mb-2">{t('auth.email')}</Text>
        <TextInput
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          autoComplete="email"
          placeholderTextColor={colors.muted}
          className="mb-4 rounded-xl border border-border/40 bg-black/20 px-4 py-3 text-white"
        />

        <Text className="text-muted text-xs uppercase mb-2">{t('auth.password')}</Text>
        <TextInput
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoComplete="password"
          placeholderTextColor={colors.muted}
          className="mb-6 rounded-xl border border-border/40 bg-black/20 px-4 py-3 text-white"
        />

        <Pressable
          onPress={onSubmit}
          disabled={loading || !email || !password}
          className="h-12 flex-row items-center justify-center rounded-xl bg-purple active:bg-purple-dark disabled:opacity-50"
        >
          {loading ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text className="text-white font-bold text-base">{t('auth.submit')}</Text>
          )}
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}
