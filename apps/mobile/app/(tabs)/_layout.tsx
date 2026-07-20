import { Tabs } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { colors } from '@/theme/tokens';

// Bottom tabs — MVP asosiy bo'limlari. Ikonlar 3-bosqichda
// (@expo/vector-icons) qo'shiladi; hozircha matnli sarlavhalar.
export default function TabsLayout() {
  const { t } = useTranslation();
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: colors.ink },
        headerTintColor: colors.white,
        tabBarStyle: { backgroundColor: colors.ink, borderTopColor: colors.border },
        tabBarActiveTintColor: colors.purple,
        tabBarInactiveTintColor: colors.muted,
      }}
    >
      <Tabs.Screen name="index" options={{ title: t('tabs.dashboard') }} />
    </Tabs>
  );
}
