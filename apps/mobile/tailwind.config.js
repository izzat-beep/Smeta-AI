/** @type {import('tailwindcss').Config} */
// Brend token'lari — web bilan bir xil ranglar (#0F3473 navy, #5555E7 purple,
// #F6F4F1 cream). Klasslar: bg-navy, text-purple, bg-cream ...
module.exports = {
  content: ['./app/**/*.{ts,tsx}', './src/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        navy: '#0F3473',
        purple: '#5555E7',
        'purple-dark': '#4444D6',
        cream: '#F6F4F1',
        ink: '#16181D',
        muted: '#BCC0C7',
        danger: '#E11919',
        success: '#22C55E',
      },
    },
  },
  plugins: [],
};
