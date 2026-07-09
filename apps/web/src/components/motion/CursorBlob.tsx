// Kursorga ergashuvchi gradient blob (T5.6) — saytda FAQAT BITTA nusxa
// (hero orqasida). Og'ir kechikish bilan (duration 1.2) ergashadi.
// Mobil/reduced-motion'da ko'rsatilmaydi. Faqat transform animatsiya qilinadi.
import { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import { gsap, MM_DESKTOP } from '../../lib/gsapSetup';

export function CursorBlob() {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;
      const mm = gsap.matchMedia();
      mm.add(MM_DESKTOP, () => {
        gsap.set(el, { autoAlpha: 1 });
        const xTo = gsap.quickTo(el, 'x', { duration: 1.2, ease: 'power3.out' });
        const yTo = gsap.quickTo(el, 'y', { duration: 1.2, ease: 'power3.out' });
        const onMove = (e: MouseEvent) => {
          xTo(e.clientX - 200);
          yTo(e.clientY - 200);
        };
        window.addEventListener('mousemove', onMove);
        return () => {
          window.removeEventListener('mousemove', onMove);
          gsap.set(el, { autoAlpha: 0 });
        };
      });
      return () => mm.revert();
    },
    { scope: ref },
  );

  return (
    <div
      ref={ref}
      aria-hidden
      className="fixed top-0 left-0 w-[400px] h-[400px] rounded-full pointer-events-none opacity-0 invisible -z-0"
      style={{
        background: 'radial-gradient(circle, rgba(85,85,231,0.14) 0%, rgba(255,107,26,0.06) 45%, transparent 70%)',
        filter: 'blur(40px)',
      }}
    />
  );
}
