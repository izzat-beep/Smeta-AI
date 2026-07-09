// SplitText + i18n xavfsiz hook (T5.7, brief v3 — MAJBURIY pattern).
// Til almashganda SplitText buziladi: revert -> rAF (React matnni qayta
// chizishini kutamiz) -> qayta split -> timeline'ni qayta qurish.
// Har bir SplitText ishlatilishi SHU hook orqali bo'lishi shart.
import { useEffect, useRef, type RefObject } from 'react';
import i18n from '../i18n';
import { gsap, SplitText, prefersReducedMotion } from './gsapSetup';

type Builder = (split: SplitText, ctx: gsap.Context) => void;

export function useSplitTextI18n(
  ref: RefObject<HTMLElement | null>,
  build: Builder,
  options: { type?: string; deps?: unknown[] } = {},
) {
  const buildRef = useRef(build);
  buildRef.current = build;
  const { type = 'chars,lines' } = options;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Reduced-motion: matn darhol ko'rinadi, split umuman qilinmaydi (5.8)
    if (prefersReducedMotion()) {
      gsap.set(el, { autoAlpha: 1 });
      return;
    }

    let split: SplitText | null = null;
    let ctx: gsap.Context | null = null;

    const create = () => {
      ctx = gsap.context(() => {
        split = new SplitText(el, { type: type as any });
        buildRef.current(split!, ctx!);
      });
    };
    const destroy = () => {
      ctx?.revert(); // timeline'lar + inline stillar tozalanadi
      split?.revert(); // original DOM tiklanadi
      split = null;
      ctx = null;
    };

    create();

    // Til almashganda: revert -> keyingi frame'da qayta qurish
    const onLang = () => {
      destroy();
      requestAnimationFrame(() => requestAnimationFrame(create));
    };
    i18n.on('languageChanged', onLang);

    return () => {
      i18n.off('languageChanged', onLang);
      destroy();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ref, type, ...(options.deps ?? [])]);
}
