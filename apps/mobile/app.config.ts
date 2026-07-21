import type { ExpoConfig, ConfigContext } from 'expo/config';

// Dinamik Expo konfiguratsiyasi. Sirlar bu yerga yozilmaydi — API URL
// EXPO_PUBLIC_API_URL orqali (.env) build vaqtida keladi (src/lib/env.ts).
export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'Smeta AI',
  slug: 'smeta-ai',
  scheme: 'smetaai', // deep-linking: smetaai://... (G7)
  version: '1.0.0',
  orientation: 'portrait',
  userInterfaceStyle: 'automatic',
  newArchEnabled: true,
  icon: './assets/icon.png',
  splash: {
    image: './assets/splash.png',
    resizeMode: 'contain',
    backgroundColor: '#0F3473', // brend navy
  },
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'uz.smetaai.app',
  },
  android: {
    package: 'uz.smetaai.app',
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#0F3473',
    },
  },
  plugins: [
    'expo-router',
    'expo-secure-store',
    'expo-localization',
    ['expo-av', { microphonePermission: 'Ovozli buyruq uchun mikrofonga ruxsat bering.' }],
  ],
  experiments: {
    typedRoutes: true,
  },
});
