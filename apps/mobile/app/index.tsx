import { View, ActivityIndicator } from 'react-native';
import { Redirect } from 'expo-router';
import { useAuth } from '@/lib/auth/authStore';
import { colors } from '@/theme/tokens';

// Kirish nuqtasi — sessiya holatiga qarab yo'naltirish.
export default function Index() {
  const status = useAuth((s) => s.status);

  if (status === 'loading') {
    return (
      <View className="flex-1 items-center justify-center bg-ink">
        <ActivityIndicator color={colors.purple} size="large" />
      </View>
    );
  }

  return <Redirect href={status === 'authenticated' ? '/(tabs)' : '/(auth)/login'} />;
}
