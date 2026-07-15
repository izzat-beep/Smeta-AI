// SplitText + i18n xavfsiz hook (T5.7, brief v3 — MAJBURIY pattern).
// Til almashganda SplitText buziladi: revert -> rAF (React matnni qayta
// chizishini kutamiz) -> qayta split -> timeline'ni qayta qurish.
// Har bir SplitText ishlatilishi SHU hook orqali bo'lishi shart.
//
// Qat'iy kafolatlar (bug-fix): matn HECH QACHON yashirin qolib ketmaydi —
// 1) builder qaytargan animatsiya tugashi bilan split to'liq revert qilinadi
//    (DOM yana toza React egaligiga o'tadi, keyingi til/tema almashishlar
//    oddiy matn ustida ishlaydi);
// 2) tez-tez til almashtirilganda rAF navbatlari bekor qilinadi — bitta
//    elementga ikki marta split qilinib, eskisi yashirin holatda "osilib"
//    qolishi mumkin emas;
// 3) rAF/gsap ticker qandaydir sabab bilan yurmay qolsa ham setTimeout
//    fail-safe splitni qaytarib, matnni ko'rsatadi.
import { useEffect, useRef, type RefObject } from 'react';
import i18n from '../i18n';
import { gsap, SplitText, prefersReducedMotion } from './gsapSetup';

type Builder = (split: SplitText, ctx: gsap.Context) => gsap.core.Animation | void;

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
    let raf = 0;
    let failSafe = 0;

    const destroy = () => {
      window.clearTimeout(failSafe);
      ctx?.revert(); // timeline'lar + inline stillar tozalanadi
      split?.revert(); // original DOM tiklanadi
      split = null;
      ctx = null;
    };
    const create = () => {
      destroy(); // bitta elementga hech qachon ikki split bo'lmasin
      // ref.current'ni HAR SAFAR yangi o'qiymiz: h1 key={language} bilan
      // qayta mount bo'lsa, yangi (to'g'ri tildagi) elementni olamiz.
      const current = ref.current;
      if (!current) return;
      ctx = gsap.context(() => {
        split = new SplitText(current, { type: type as any });
        const anim = buildRef.current(split!, ctx!);
        // Intro tugadi — splitni butunlay qaytaramiz: matn tabiiy holatda
        // ko'rinadi va React DOM'ni qayta to'liq boshqaradi.
        anim?.eventCallback('onComplete', () => {
          window.setTimeout(destroy, 0);
        });
      });
      // Kafolat: animatsiya 6s ichida tugamasa (ticker muzlagan va h.k.)
      // baribir revert qilamiz — matn yashirin qolmaydi.
      failSafe = window.setTimeout(destroy, 6000);
    };

    create();

    // Til almashganda: revert -> keyingi frame'da qayta qurish.
    // Oldingi kutayotgan rAF bekor qilinadi (tez ketma-ket almashishlar).
    const onLang = () => {
      destroy();
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        raf = requestAnimationFrame(create);
      });
    };
    i18n.on('languageChanged', onLang);

    return () => {
      i18n.off('languageChanged', onLang);
      cancelAnimationFrame(raf);
      destroy();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ref, type, ...(options.deps ?? [])]);
}
