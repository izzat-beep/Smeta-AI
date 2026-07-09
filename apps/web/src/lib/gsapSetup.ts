// GSAP markaziy sozlash (T5, brief v3). Bitta joyda ro'yxatdan o'tkazamiz —
// butun sayt YAGONA easing tilida ishlaydi:
//   kirishlar: power3.out; magnetic qaytish: elastic.out(1, 0.5).
// Vite (SSR yo'q) — modul faqat brauzerda yuklanadi.
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import { ScrambleTextPlugin } from 'gsap/ScrambleTextPlugin';

gsap.registerPlugin(ScrollTrigger, SplitText, ScrambleTextPlugin);

// Yagona easing tili
export const EASE_IN = 'power3.out';
export const EASE_MAGNET = 'elastic.out(1, 0.5)';

// matchMedia shartlari (5.8): reduced-motion'da dekorativ animatsiya o'chadi,
// mobil (touch)da tilt/magnetic/parallax o'chadi.
export const MM_DESKTOP = '(min-width: 769px) and (prefers-reduced-motion: no-preference)';
export const MM_MOBILE = '(max-width: 768px) and (prefers-reduced-motion: no-preference)';
export const MM_REDUCED = '(prefers-reduced-motion: reduce)';

export function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia(MM_REDUCED).matches;
}

export { gsap, ScrollTrigger, SplitText };
