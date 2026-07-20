import { Stack } from 'expo-router';
import { colors } from '@/theme/tokens';

// Auth guruhi — sarlavhasiz stack (har ekran o'z brendini ko'rsatadi).
export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.ink },
      }}
    />
  );
}
