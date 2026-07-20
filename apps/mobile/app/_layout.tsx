import '../global.css';
import { useEffect } from 'react';
import { Slot } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClientProvider } from '@tanstack/react-query';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/i18n';
import { queryClient } from '@/lib/query';
import { useAuth } from '@/lib/auth/authStore';

// Ildiz layout — global providerlar va sessiya bootstrap.
export default function RootLayout() {
  const bootstrap = useAuth((s) => s.bootstrap);

  useEffect(() => {
    void bootstrap();
  }, [bootstrap]);

  return (
    <SafeAreaProvider>
      <I18nextProvider i18n={i18n}>
        <QueryClientProvider client={queryClient}>
          <StatusBar style="light" />
          <Slot />
        </QueryClientProvider>
      </I18nextProvider>
    </SafeAreaProvider>
  );
}
