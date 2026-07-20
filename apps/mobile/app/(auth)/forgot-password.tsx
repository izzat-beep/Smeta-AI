import { useState } from 'react';
import { View, Text, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/lib/auth/authStore';
import { ApiError } from '@/lib/api/client';
import { forgotSchema, type ForgotForm } from '@/lib/validation';
import { FormField } from '@/components/FormField';
import { Button } from '@/components/Button';

export default function ForgotPasswordScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const forgotPassword = useAuth((s) => s.forgotPassword);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotForm>({
    resolver: zodResolver(forgotSchema),
    defaultValues: { email: '', phone: '', newPassword: '' },
  });

  const onSubmit = handleSubmit(async (values) => {
    setError(null);
    try {
      await forgotPassword({ email: values.email.trim(), phone: values.phone.trim(), newPassword: values.newPassword });
      setDone(true);
      setTimeout(() => router.replace('/(auth)/login'), 1500);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('common.error'));
    }
  });

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1 bg-ink">
      <ScrollView contentContainerClassName="flex-grow justify-center px-6 py-10">
        <Text className="text-white text-3xl font-bold mb-2">{t('auth.forgotTitle')}</Text>
        <Text className="text-muted text-sm mb-8">{t('auth.forgotHint')}</Text>

        {error ? (
          <View className="mb-4 rounded-xl border border-danger/40 bg-danger/10 px-4 py-3">
            <Text className="text-danger text-sm">{error}</Text>
          </View>
        ) : null}
        {done ? (
          <View className="mb-4 rounded-xl border border-success/40 bg-success/10 px-4 py-3">
            <Text className="text-success text-sm">{t('auth.resetSuccess')}</Text>
          </View>
        ) : null}

        <FormField control={control} name="email" label={t('auth.email')}
          errorText={errors.email?.message ? t(errors.email.message) : undefined}
          autoCapitalize="none" keyboardType="email-address" autoComplete="email" />
        <FormField control={control} name="phone" label={t('auth.phone')}
          errorText={errors.phone?.message ? t(errors.phone.message) : undefined}
          keyboardType="phone-pad" autoComplete="tel" />
        <FormField control={control} name="newPassword" label={t('auth.newPassword')}
          errorText={errors.newPassword?.message ? t(errors.newPassword.message) : undefined}
          secureTextEntry autoComplete="password-new" />

        <Button title={t('auth.resetSubmit')} loading={isSubmitting} onPress={onSubmit} />

        <View className="mt-6">
          <Link href="/(auth)/login" className="text-purple text-center text-sm">
            {t('auth.backToLogin')}
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
