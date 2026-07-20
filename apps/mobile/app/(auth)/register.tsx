import { useState } from 'react';
import { View, Text, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/lib/auth/authStore';
import { ApiError } from '@/lib/api/client';
import { registerSchema, type RegisterForm } from '@/lib/validation';
import { FormField } from '@/components/FormField';
import { Button } from '@/components/Button';

export default function RegisterScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const register = useAuth((s) => s.register);
  const [error, setError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: { fullName: '', companyName: '', email: '', phone: '', password: '' },
  });

  const onSubmit = handleSubmit(async (values) => {
    setError(null);
    try {
      await register({
        fullName: values.fullName.trim(),
        companyName: values.companyName.trim(),
        email: values.email.trim(),
        phone: values.phone?.trim() || undefined,
        password: values.password,
      });
      router.replace('/(tabs)');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('common.error'));
    }
  });

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1 bg-ink">
      <ScrollView contentContainerClassName="flex-grow justify-center px-6 py-10">
        <Text className="text-white text-3xl font-bold mb-2">Smeta AI</Text>
        <Text className="text-muted text-base mb-8">{t('auth.registerTitle')}</Text>

        {error ? (
          <View className="mb-4 rounded-xl border border-danger/40 bg-danger/10 px-4 py-3">
            <Text className="text-danger text-sm">{error}</Text>
          </View>
        ) : null}

        <FormField control={control} name="fullName" label={t('auth.fullName')}
          errorText={errors.fullName?.message ? t(errors.fullName.message) : undefined} />
        <FormField control={control} name="companyName" label={t('auth.companyName')}
          errorText={errors.companyName?.message ? t(errors.companyName.message) : undefined} />
        <FormField control={control} name="email" label={t('auth.email')}
          errorText={errors.email?.message ? t(errors.email.message) : undefined}
          autoCapitalize="none" keyboardType="email-address" autoComplete="email" />
        <FormField control={control} name="phone" label={t('auth.phone')}
          errorText={errors.phone?.message ? t(errors.phone.message) : undefined}
          keyboardType="phone-pad" autoComplete="tel" />
        <FormField control={control} name="password" label={t('auth.password')}
          errorText={errors.password?.message ? t(errors.password.message) : undefined}
          secureTextEntry autoComplete="password-new" />

        <Button title={t('auth.registerSubmit')} loading={isSubmitting} onPress={onSubmit} />

        <View className="mt-6">
          <Link href="/(auth)/login" className="text-purple text-center text-sm">
            {t('auth.haveAccount')}
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
