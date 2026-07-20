import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { colors } from '@/theme/tokens';

// Bottom tabs — MVP asosiy bo'limlari. Qolgan bo'limlar (materiallar, hisobotlar,
// sozlamalar) keyingi STAGE 3 qadamlarida qo'shiladi.
export default function TabsLayout() {
  const { t } = useTranslation();
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: colors.ink },
        headerTintColor: colors.white,
        headerShadowVisible: false,
        sceneStyle: { backgroundColor: colors.ink },
        tabBarStyle: { backgroundColor: colors.ink, borderTopColor: colors.border },
        tabBarActiveTintColor: colors.purple,
        tabBarInactiveTintColor: colors.muted,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t('tabs.dashboard'),
          tabBarIcon: ({ color, size }) => <Ionicons name="home-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="loyihalar"
        options={{
          title: t('tabs.projects'),
          tabBarIcon: ({ color, size }) => <Ionicons name="business-outline" size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
