// Stacked card deck (T5.4, 2026 trend): scroll paytida bo'lim pin qilinadi,
// kartalar birin-ketin ustma-ust chiqadi; oldingi karta scale 0.95 + xiralashadi.
// Desktop + reduced-motion'siz: pin+scrub; mobil/reduced: oddiy vertikal ro'yxat.
// Faqat transform/opacity/filter animatsiya qilinadi; ScrollTrigger cleanup useGSAP'da.
import { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import { gsap, MM_DESKTOP } from '../../lib/gsapSetup';

export interface DeckItem {
  icon: React.ReactNode;
  title: string;
  desc: string;
}

export function FeatureDeck({ items }: { items: DeckItem[] }) {
  const wrapRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const wrap = wrapRef.current;
      if (!wrap) return;
      const mm = gsap.matchMedia();

      mm.add(MM_DESKTOP, () => {
        const cards = gsap.utils.toArray<HTMLElement>('.deck-card', wrap);
        if (cards.length < 2) return;

        // Kartalar ustma-ust joylashadi (grid stack)
        gsap.set(cards, { position: 'absolute', inset: 0, willChange: 'transform' });
        gsap.set(cards.slice(1), { yPercent: 120 });

        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: wrap,
            start: 'top 15%',
            end: `+=${(cards.length - 1) * 70}%`,
            pin: true,
            scrub: 0.6,
          },
          defaults: { ease: 'none' },
        });
        cards.slice(1).forEach((card, i) => {
          const prev = cards[i];
          tl.to(prev, { scale: 0.95, autoAlpha: 0.55, filter: 'blur(3px)' }, i)
            .to(card, { yPercent: 0 }, i);
        });
        // pin tugagach will-change olib tashlanadi
        tl.eventCallback('onComplete', () => cards.forEach((c) => (c.style.willChange = 'auto')));
      });

      return () => mm.revert();
    },
    { scope: wrapRef },
  );

  return (
    <div ref={wrapRef} className="relative">
      {/* Desktopda absolute stack uchun balandlik birinchi kartadan olinadi */}
      <div className="relative md:min-h-[320px]">
        {items.map((it, i) => (
          <div
            key={i}
            className="deck-card md:will-change-transform mb-6 md:mb-0 glass-card rounded-3xl p-8 md:p-10 bg-[var(--c-panel)]/70 backdrop-blur-xl border border-white/10 md:h-[320px] flex flex-col justify-center"
            style={{ zIndex: i + 1 }}
          >
            <div className="w-14 h-14 rounded-xl flex items-center justify-center mb-6 bg-[#5555E7]/10 border border-[#5555E7]/20">
              {it.icon}
            </div>
            <h3 className="text-2xl font-bold font-display mb-3 text-white">{it.title}</h3>
            <p className="text-[var(--c-muted)] leading-relaxed max-w-2xl">{it.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
