// Brend dizayn token'lari — web bilan bir manba. NativeWind klasslari
// tailwind.config.js dan; bu yerda JS'dan foydalanish uchun (masalan
// StatusBar, navigatsiya ranglari, gradientlar).
export const colors = {
  navy: '#0F3473',
  purple: '#5555E7',
  purpleDark: '#4444D6',
  cream: '#F6F4F1',
  ink: '#16181D',
  muted: '#BCC0C7',
  border: '#343841',
  danger: '#E11919',
  success: '#22C55E',
  white: '#FFFFFF',
} as const;

export const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 } as const;
export const radius = { sm: 8, md: 12, lg: 16, xl: 24, pill: 999 } as const;

export type ColorToken = keyof typeof colors;
