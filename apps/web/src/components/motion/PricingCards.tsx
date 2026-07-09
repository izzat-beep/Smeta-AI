// 3D tarif kartalari (T5.2): perspective 1200 + kursor tilt (max 8°, quickTo),
// ichki kontent translateZ(40px) parallaks, hover'da chuqurlashuvchi soya,
// scroll'da flip-in (rotationY 90->0, stagger 0.12, bir marta), mashhur tarif
// sekin suzadi (y ±6, yoyo 3s) + glow puls. Narxlar ko'ringanda count-up;
// til almashganda qayta ishlaydi. Mobil/reduced'da tilt/float o'chadi,
// kirishlar soddalashadi (5.8).
import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { Icon } from '@iconify/react';
import { useTranslation } from 'react-i18next';
import { useGSAP } from '@gsap/react';
import { gsap, EASE_IN, MM_DESKTOP, MM_REDUCED } from '../../lib/gsapSetup';

export interface PricingPlan {
  name: string;
  priceValue: number | null; // null = "Bog'laning"
  items: string[];
  popular: boolean;
}

export function PricingCards({ plans }: { plans: PricingPlan[] }) {
  const { t, i18n } = useTranslation();
  const wrapRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const wrap = wrapRef.current;
      if (!wrap) return;
      const cards = gsap.utils.toArray<HTMLElement>('.price-card', wrap);
      const mm = gsap.matchMedia();

      // Narx count-up (barcha rejimlarda, reduced'da darhol)
      const runCounters = (instant: boolean) => {
        gsap.utils.toArray<HTMLElement>('.price-num', wrap).forEach((el) => {
          const target = Number(el.dataset.value ?? 0);
          if (!target) return;
          const obj = { v: 0 };
          if (instant) {
            el.textContent = target.toLocaleString('ru-RU');
            return;
          }
          gsap.to(obj, {
            v: target,
            duration: 1.2,
            ease: 'power2.out',
            snap: { v: 1 },
            scrollTrigger: { trigger: el, start: 'top 90%', once: true },
            onUpdate: () => {
              el.textContent = Math.round(obj.v).toLocaleString('ru-RU');
            },
          });
        });
      };

      mm.add(MM_DESKTOP, () => {
        // Flip-in kirish
        gsap.set(cards, { transformPerspective: 1200 });
        gsap.from(cards, {
          rotationY: 90,
          autoAlpha: 0,
          duration: 0.9,
          ease: EASE_IN,
          stagger: 0.12,
          scrollTrigger: { trigger: wrap, start: 'top 80%', once: true },
        });

        // Kursor tilt — har kartaga alohida quickTo
        const cleanups = cards.map((card) => {
          const inner = card.querySelector<HTMLElement>('.price-inner');
          const rx = gsap.quickTo(card, 'rotationX', { duration: 0.5, ease: 'power3.out' });
          const ry = gsap.quickTo(card, 'rotationY', { duration: 0.5, ease: 'power3.out' });
          const onMove = (e: MouseEvent) => {
            const r = card.getBoundingClientRect();
            const px = (e.clientX - r.left) / r.width - 0.5;
            const py = (e.clientY - r.top) / r.height - 0.5;
            card.style.willChange = 'transform';
            rx(-py * 8);
            ry(px * 8);
          };
          const onEnter = () => {
            if (inner) gsap.to(inner, { z: 40, duration: 0.4, ease: 'power3.out' });
            gsap.to(card, { boxShadow: '0 30px 60px -15px rgba(0,0,0,0.5)', duration: 0.4 });
          };
          const onLeave = () => {
            rx(0);
            ry(0);
            if (inner) gsap.to(inner, { z: 0, duration: 0.5, ease: 'power3.out' });
            gsap.to(card, { boxShadow: '0 0 0 0 rgba(0,0,0,0)', duration: 0.5, clearProps: 'willChange' });
          };
          card.addEventListener('mousemove', onMove);
          card.addEventListener('mouseenter', onEnter);
          card.addEventListener('mouseleave', onLeave);
          return () => {
            card.removeEventListener('mousemove', onMove);
            card.removeEventListener('mouseenter', onEnter);
            card.removeEventListener('mouseleave', onLeave);
          };
        });

        // Mashhur tarif: sekin suzish + glow puls
        const popular = wrap.querySelector<HTMLElement>('.price-card.is-popular');
        if (popular) {
          gsap.to(popular, { y: -6, duration: 3, yoyo: true, repeat: -1, ease: 'sine.inOut' });
          const glow = popular.querySelector<HTMLElement>('.price-glow');
          if (glow) gsap.to(glow, { opacity: 0.9, duration: 2.2, yoyo: true, repeat: -1, ease: 'sine.inOut' });
        }

        runCounters(false);
        return () => cleanups.forEach((fn) => fn());
      });

      mm.add('(max-width: 768px) and (prefers-reduced-motion: no-preference)', () => {
        // Mobil: faqat yengil fade-up kirish + count-up (tilt/float yo'q)
        gsap.from(cards, {
          y: 24,
          autoAlpha: 0,
          duration: 0.6,
          ease: EASE_IN,
          stagger: 0.1,
          scrollTrigger: { trigger: wrap, start: 'top 85%', once: true },
        });
        runCounters(false);
      });

      mm.add(MM_REDUCED, () => {
        gsap.set(cards, { autoAlpha: 1 });
        runCounters(true);
      });

      return () => mm.revert();
    },
    // Til almashganda narx raqamlari qayta chiziladi — counterlar qayta ishlaydi
    { scope: wrapRef, dependencies: [i18n.language] },
  );

  return (
    <div ref={wrapRef} className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center" style={{ perspective: '1200px' }}>
      {plans.map((p) => (
        <div
          key={p.name}
          className={`price-card relative glass-card rounded-2xl p-8 [transform-style:preserve-3d] ${
            p.popular
              ? 'is-popular border-[#FF6B1A]/40 md:scale-105 z-10 bg-[var(--c-panel)]/60'
              : 'bg-[var(--c-panel)]/30'
          }`}
        >
          {p.popular && (
            <>
              <div className="price-glow absolute inset-0 rounded-2xl pointer-events-none opacity-40" style={{ boxShadow: '0 0 40px rgba(255,107,26,0.25)' }} />
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#FF6B1A] text-white text-[12px] font-semibold px-4 py-1 rounded-full">
                {t('landing.popular')}
              </div>
            </>
          )}
          <div className="price-inner [transform-style:preserve-3d]">
            <div className="text-[var(--c-muted)] font-display font-medium mb-4">{p.name}</div>
            <div className="flex items-baseline gap-2 mb-8">
              {p.priceValue !== null ? (
                <>
                  <span className="price-num text-3xl font-bold font-display" data-value={p.priceValue}>
                    {p.priceValue.toLocaleString('ru-RU')}
                  </span>
                  <span className="text-[var(--c-muted)]">{t('landing.perMonth')}</span>
                </>
              ) : (
                <span className="text-3xl font-bold font-display">{t('landing.contactUs')}</span>
              )}
            </div>
            <ul className="space-y-4 mb-10">
              {p.items.map((it) => (
                <li key={it} className="flex items-center gap-3 text-sm text-white/90">
                  <Icon icon="lucide:circle-check-big" className="w-5 h-5 text-[#22D3EE] shrink-0" />
                  {it}
                </li>
              ))}
            </ul>
            <Link
              to="/kirish"
              className={`block text-center w-full py-3 rounded-xl font-bold transition-colors ${
                p.popular ? 'bg-[#FF6B1A] hover:bg-[#e55a10] text-white' : 'bg-[var(--c-border)] hover:bg-[var(--c-border)]/80'
              }`}
            >
              {t('landing.start')}
            </Link>
          </div>
        </div>
      ))}
    </div>
  );
}
