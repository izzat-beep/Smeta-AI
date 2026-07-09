// Magnit tugma (T5.3): kursor ~100px radiusda yaqinlashganda tugma kursor
// tomon siljiydi (quickTo), ichidagi matn ~40% masofada (ichki parallaks),
// chiqishda elastic.out qaytish. Bosilganda scale 0.97. Klaviatura uchun
// focus-visible halqa SAQLANADI (outline olib tashlanmaydi).
// Mobil/touch va prefers-reduced-motion'da magnit effekti butunlay o'chadi.
import { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import { gsap, EASE_MAGNET, MM_DESKTOP } from '../../lib/gsapSetup';

export function MagneticButton({
  children,
  className = '',
  radius = 100,
  as: Tag = 'div',
}: {
  children: React.ReactNode;
  className?: string;
  radius?: number;
  as?: 'div' | 'span';
}) {
  const wrapRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const wrap = wrapRef.current;
      if (!wrap) return;
      const inner = wrap.firstElementChild as HTMLElement | null;
      if (!inner) return;

      const mm = gsap.matchMedia();
      mm.add(MM_DESKTOP, () => {
        const xTo = gsap.quickTo(wrap, 'x', { duration: 0.4, ease: 'power3.out' });
        const yTo = gsap.quickTo(wrap, 'y', { duration: 0.4, ease: 'power3.out' });
        const lxTo = gsap.quickTo(inner, 'x', { duration: 0.4, ease: 'power3.out' });
        const lyTo = gsap.quickTo(inner, 'y', { duration: 0.4, ease: 'power3.out' });

        const onMove = (e: MouseEvent) => {
          const r = wrap.getBoundingClientRect();
          const cx = r.left + r.width / 2;
          const cy = r.top + r.height / 2;
          const dx = e.clientX - cx;
          const dy = e.clientY - cy;
          const dist = Math.hypot(dx, dy);
          if (dist < radius + Math.max(r.width, r.height) / 2) {
            // will-change faqat harakat paytida (JIT)
            wrap.style.willChange = 'transform';
            xTo(dx * 0.35);
            yTo(dy * 0.35);
            lxTo(dx * 0.14); // ~40% ichki parallaks
            lyTo(dy * 0.14);
          }
        };
        const onLeave = () => {
          gsap.to(wrap, { x: 0, y: 0, duration: 0.9, ease: EASE_MAGNET, clearProps: 'willChange' });
          gsap.to(inner, { x: 0, y: 0, duration: 0.9, ease: EASE_MAGNET });
        };
        const onDown = () => gsap.to(wrap, { scale: 0.97, duration: 0.12, ease: 'power2.out' });
        const onUp = () => gsap.to(wrap, { scale: 1, duration: 0.3, ease: EASE_MAGNET });

        wrap.addEventListener('mousemove', onMove);
        wrap.addEventListener('mouseleave', onLeave);
        wrap.addEventListener('mousedown', onDown);
        wrap.addEventListener('mouseup', onUp);
        return () => {
          wrap.removeEventListener('mousemove', onMove);
          wrap.removeEventListener('mouseleave', onLeave);
          wrap.removeEventListener('mousedown', onDown);
          wrap.removeEventListener('mouseup', onUp);
        };
      });
      return () => mm.revert();
    },
    { scope: wrapRef },
  );

  return (
    <Tag ref={wrapRef as any} className={`inline-block ${className}`}>
      {children}
    </Tag>
  );
}
