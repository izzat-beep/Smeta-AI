import { useState } from 'react';
import { View, Text, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/lib/auth/authStore';
import { ApiError } from '@/lib/api/client';
import { loginSchema, type LoginForm } from '@/lib/validation';
import { FormField } from '@/components/FormField';
import { Button } from '@/components/Button';

export default function LoginScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const login = useAuth((s) => s.login);
  const [error, setError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({ resolver: zodResolver(loginSchema), defaultValues: { email: '', password: '' } });

  const onSubmit = handleSubmit(async (values) => {
    setError(null);
    try {
      await login(values.email.trim(), values.password);
      router.replace('/(tabs)');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('common.error'));
    }
  });

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1 bg-ink">
      <ScrollView contentContainerClassName="flex-grow justify-center px-6 py-10">
        <Text className="text-white text-3xl font-bold mb-2">Smeta AI</Text>
        <Text className="text-muted text-base mb-8">{t('auth.loginTitle')}</Text>

        {error ? (
          <View className="mb-4 rounded-xl border border-danger/40 bg-danger/10 px-4 py-3">
            <Text className="text-danger text-sm">{error}</Text>
          </View>
        ) : null}

        <FormField
          control={control}
          name="email"
          label={t('auth.email')}
          errorText={errors.email?.message ? t(errors.email.message) : undefined}
          autoCapitalize="none"
          keyboardType="email-address"
          autoComplete="email"
        />
        <FormField
          control={control}
          name="password"
          label={t('auth.password')}
          errorText={errors.password?.message ? t(errors.password.message) : undefined}
          secureTextEntry
          autoComplete="password"
        />

        <Button title={t('auth.submit')} loading={isSubmitting} onPress={onSubmit} />

        <View className="mt-6 gap-3">
          <Link href="/(auth)/register" className="text-purple text-center text-sm">
            {t('auth.noAccount')}
          </Link>
          <Link href="/(auth)/forgot-password" className="text-muted text-center text-sm">
            {t('auth.forgotLink')}
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
