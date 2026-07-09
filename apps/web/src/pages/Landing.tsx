// Landing sahifasi (Vazifa 4): to'liq ikki tilli (UZ/RU, i18n orqali —
// hardcoded matn yo'q), FAQ accordion, Biz haqimizda, ishlaydigan anchor
// navigatsiya (#imkoniyatlar, #biz-haqimizda, #narxlar, #mijozlar, #faq, #kontakt).
import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Icon } from '@iconify/react';
import { motion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { useGSAP } from '@gsap/react';
import { setLanguage, type Lang } from '../i18n';
import {
  Spotlight,
  GridBackground,
  Meteors,
  InfiniteMovingCards,
  Reveal,
  Counter,
} from '../components/aceternity';
// T5 (brief v3): GSAP dizayn tizimi — yagona easing tili (power3.out / elastic)
import { gsap, EASE_IN, MM_DESKTOP } from '../lib/gsapSetup';
import { useSplitTextI18n } from '../lib/useSplitTextI18n';
import { MagneticButton } from '../components/motion/MagneticButton';
import { CursorBlob } from '../components/motion/CursorBlob';
import { RevealHeading } from '../components/motion/RevealHeading';
import { FeatureDeck } from '../components/motion/FeatureDeck';
import { PricingCards, type PricingPlan } from '../components/motion/PricingCards';
import { VideoShowcase } from '../components/motion/VideoShowcase';

// Vizual konstantalar (matnlar i18n'da)
const FEATURE_META = [
  { icon: 'lucide:zap', color: '#FF6B1A', big: true },
  { icon: 'lucide:message-square', color: '#22D3EE', big: false },
  { icon: 'lucide:package', color: '#22D3EE', big: false },
  { icon: 'lucide:bar-chart-3', color: '#FF6B1A', big: false },
];
const STAT_META = [
  { value: 15000, suffix: '+', color: 'text-[#22D3EE]' },
  { value: 2500, suffix: '+', color: 'text-[#FF6B1A]' },
  { value: 20, suffix: 'T+', color: 'text-[#22D3EE]' },
  { value: 99, suffix: '.8%', color: 'text-[#FF6B1A]' },
];
const ABOUT_ICONS = ['lucide:target', 'lucide:users', 'lucide:shield-check'];
// Tarif narxlari (UZS/oy) — count-up uchun sonli; null = "Bog'laning"
const PLAN_PRICE_VALUES: (number | null)[] = [199000, 499000, null];

const CONTACT_EMAIL = 'info.smeta.ai@gmail.com';
const SOCIAL = [
  { label: 'Telegram', icon: 'mdi:telegram', href: 'https://t.me/smeta_a' },
  { label: 'Instagram', icon: 'mdi:instagram', href: 'https://instagram.com/smeta_ai' },
  { label: 'Facebook', icon: 'mdi:facebook', href: 'https://www.facebook.com/share/195MpvZ5Vi/?mibextid=wwXIfr' },
];

const NAV_ANCHORS = [
  { key: 'features', href: '#imkoniyatlar' },
  { key: 'about', href: '#biz-haqimizda' },
  { key: 'pricing', href: '#narxlar' },
  { key: 'customers', href: '#mijozlar' },
  { key: 'faq', href: '#faq' },
] as const;

export function Landing() {
  const { t } = useTranslation();
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  // /#faq kabi tashqi linklar (masalan dashboard footeridan) ishlashi uchun:
  // sahifa ochilganda hash bo'lsa o'sha bo'limga scroll qilamiz.
  useEffect(() => {
    if (location.hash) {
      const el = document.querySelector(location.hash);
      if (el) window.setTimeout(() => el.scrollIntoView({ behavior: 'smooth' }), 60);
    }
  }, [location.hash]);

  // i18n massivlari
  const arr = <T,>(key: string): T[] => t(key, { returnObjects: true }) as T[];
  const features = arr<{ title: string; desc: string }>('landing.features');
  const stats = arr<{ label: string }>('landing.stats');
  const aboutPoints = arr<{ title: string; desc: string }>('landing.aboutPoints');
  const plans = arr<{ name: string; items: string[] }>('landing.plans');
  const testimonials = arr<{ text: string; name: string; role: string }>('landing.testimonials');
  const faq = arr<{ q: string; a: string }>('landing.faq');

  return (
    <div className="min-h-screen bg-[var(--c-bg)] text-white font-sans overflow-x-hidden">
      {/* Navigation */}
      <motion.nav
        initial={{ y: -40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="fixed top-0 left-0 right-0 z-50 bg-[var(--c-bg)]/60 backdrop-blur-xl border-b border-[var(--c-border)]/40"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <img src="/logo.svg" alt="Smeta AI" className="h-12 sm:h-14 w-auto" />
          </Link>
          <div className="hidden md:flex items-center gap-1">
            {NAV_ANCHORS.map((l) => (
              <a key={l.key} href={l.href} className="nav-underline px-4 py-2 text-sm font-medium text-[var(--c-muted)] hover:text-white transition-colors">
                {t(`landing.nav.${l.key}`)}
              </a>
            ))}
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <LangSwitcher />
            <Link to="/kirish" className="hidden sm:block px-4 py-2 text-sm font-medium text-[#22D3EE] border border-[#22D3EE] rounded-lg hover:bg-[#22D3EE]/10 transition-colors">{t('landing.login')}</Link>
            <Link to="/kirish" className="hidden sm:block px-4 py-2 text-sm font-medium bg-[#FF6B1A] rounded-lg hover:bg-[#e55a10] transition-colors">{t('landing.register')}</Link>
            {/* Mobil hamburger */}
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="md:hidden w-11 h-11 flex items-center justify-center rounded-lg text-white hover:bg-white/5"
              aria-label="Menyu"
            >
              <Icon icon={menuOpen ? 'lucide:x' : 'lucide:menu'} className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Mobil menyu paneli */}
        {menuOpen && (
          <div className="md:hidden border-t border-[var(--c-border)]/40 bg-[var(--c-bg)]/95 backdrop-blur-xl px-4 py-4 space-y-1">
            {NAV_ANCHORS.map((l) => (
              <a key={l.key} href={l.href} onClick={() => setMenuOpen(false)} className="block px-4 py-3 rounded-xl text-sm font-medium text-[var(--c-muted)] hover:bg-white/5 hover:text-white transition-colors">
                {t(`landing.nav.${l.key}`)}
              </a>
            ))}
            <div className="grid grid-cols-2 gap-3 pt-3">
              <Link to="/kirish" onClick={() => setMenuOpen(false)} className="px-4 py-3 text-center text-sm font-medium text-[#22D3EE] border border-[#22D3EE] rounded-xl">{t('landing.login')}</Link>
              <Link to="/kirish" onClick={() => setMenuOpen(false)} className="px-4 py-3 text-center text-sm font-medium bg-[#FF6B1A] rounded-xl">{t('landing.register')}</Link>
            </div>
          </div>
        )}
      </motion.nav>

      {/* Hero — GSAP master timeline (T5.1): SplitText chars + fade-up + scale-in,
          jami ~1.5s; perspective konteynerda 3 parallaks qatlam (grid, blob,
          preview) sichqonchaga ±12px reaksiya; ScrambleText — "AI" aksentida. */}
      <HeroSection />

      {/* Imkoniyatlar — stacked card deck (T5.4): scroll'da kartalar ustma-ust
          yig'iladi (pin+scrub); mobil/reduced'da oddiy ro'yxat. */}
      <section id="imkoniyatlar" className="py-24 bg-[var(--c-panel)]/30 scroll-mt-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <RevealHeading className="text-4xl md:text-5xl font-bold font-display mb-4">{t('landing.featuresTitle')}</RevealHeading>
            <p className="text-[var(--c-muted)] max-w-lg mx-auto">{t('landing.featuresSub')}</p>
          </div>

          <FeatureDeck
            items={features.map((f, i) => {
              const m = FEATURE_META[i] ?? FEATURE_META[1];
              return {
                icon: <Icon icon={m.icon} className="w-7 h-7" style={{ color: m.color }} />,
                title: f.title,
                desc: f.desc,
              };
            })}
          />
        </div>
      </section>

      {/* Video ko'rgazma (T5.5) — hozircha poster placeholder; video asset
          qo'shilganda src berilsa scroll-scrub avtomatik ishlaydi */}
      <section className="py-24 px-4 sm:px-6 lg:px-8">
        <VideoShowcase poster="/assets/landing/IMG_6.webp" />
      </section>

      {/* Stats */}
      <section className="py-16 border-y border-[var(--c-border)]/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
            {stats.map((s, i) => {
              const m = STAT_META[i] ?? STAT_META[0];
              return (
                <div key={s.label}>
                  <div className={`text-4xl font-bold font-display mb-2 ${m.color}`}>
                    <Counter value={m.value} suffix={m.suffix} />
                  </div>
                  <div className="text-[14px] text-[var(--c-muted)] uppercase tracking-widest">{s.label}</div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Biz haqimizda */}
      <section id="biz-haqimizda" className="py-20 sm:py-24 scroll-mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
            <Reveal>
              <div>
                <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#FF6B1A]/10 border border-[#FF6B1A]/30 rounded-full text-[12px] font-semibold text-[#FF6B1A] mb-6">
                  <Icon icon="lucide:info" className="w-4 h-4" /> {t('landing.aboutBadge')}
                </span>
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold font-display mb-6 leading-tight">
                  {t('landing.aboutTitle1')} <span className="text-[#22D3EE]">{t('landing.aboutAccent')}</span> {t('landing.aboutTitle2')}
                </h2>
                <p className="text-[var(--c-muted)] leading-relaxed mb-4">{t('landing.aboutP1')}</p>
                <p className="text-[var(--c-muted)] leading-relaxed">{t('landing.aboutP2')}</p>
              </div>
            </Reveal>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
              {aboutPoints.map((p, i) => (
                <Reveal key={p.title} delay={i * 0.1}>
                  <div className="glass-card rounded-2xl p-6 flex items-start gap-4 bg-[var(--c-panel)]/40 h-full">
                    <div className="w-11 h-11 shrink-0 rounded-xl bg-[#22D3EE]/10 border border-[#22D3EE]/20 flex items-center justify-center">
                      <Icon icon={ABOUT_ICONS[i] ?? ABOUT_ICONS[0]} className="w-5 h-5 text-[#22D3EE]" />
                    </div>
                    <div>
                      <h3 className="font-bold font-display text-white mb-1">{p.title}</h3>
                      <p className="text-sm text-[var(--c-muted)] leading-relaxed">{p.desc}</p>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Narxlar */}
      {/* Narxlar — 3D tarif kartalari (T5.2): tilt, flip-in, count-up, popular float */}
      <section id="narxlar" className="py-24 scroll-mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <RevealHeading className="text-4xl md:text-5xl font-bold font-display mb-4">{t('landing.pricingTitle')}</RevealHeading>
            <p className="text-[var(--c-muted)]">{t('landing.pricingSub')}</p>
          </div>
          <PricingCards
            plans={plans.map((p, i): PricingPlan => ({
              name: p.name,
              priceValue: PLAN_PRICE_VALUES[i],
              items: p.items,
              popular: i === 1,
            }))}
          />
        </div>
      </section>

      {/* Mijozlar */}
      <section id="mijozlar" className="py-24 bg-[var(--c-panel)]/20 scroll-mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12">
          <RevealHeading className="text-3xl md:text-4xl font-bold font-display text-center">{t('landing.customersTitle')}</RevealHeading>
        </div>
        <InfiniteMovingCards items={testimonials} speed={36} />
      </section>

      {/* FAQ */}
      <section id="faq" className="py-24 scroll-mt-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal>
            <div className="text-center mb-12">
              <RevealHeading className="text-4xl md:text-5xl font-bold font-display mb-4">{t('landing.faqTitle')}</RevealHeading>
              <p className="text-[var(--c-muted)]">{t('landing.faqSub')}</p>
            </div>
          </Reveal>
          <div className="space-y-3">
            {faq.map((f, i) => (
              <Reveal key={f.q} delay={Math.min(i * 0.05, 0.3)}>
                <FaqItem q={f.q} a={f.a} />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-4 sm:px-6 lg:px-8">
        <Reveal className="max-w-7xl mx-auto">
          <div className="bg-gradient-to-br from-[#FF6B1A] to-[#EA580C] rounded-[40px] p-12 lg:p-20 relative overflow-hidden">
            <Meteors number={20} />
            <div className="absolute -top-48 -right-48 w-96 h-96 bg-white/10 rounded-full blur-[64px]" />
            <div className="relative z-10 max-w-2xl">
              <h2 className="text-4xl lg:text-6xl font-extrabold font-display mb-8 leading-tight">{t('landing.ctaTitle')}</h2>
              <p className="text-white/90 text-xl font-display mb-12 leading-relaxed">{t('landing.ctaSub')}</p>
              <div className="flex flex-col sm:flex-row items-center gap-6">
                <MagneticButton className="w-full sm:w-auto">
                  <Link to="/kirish" className="block w-full px-8 py-4 bg-white text-[#EA580C] rounded-xl text-lg font-bold text-center focus-visible:outline-2 focus-visible:outline-white">
                    {t('landing.ctaBtn')}
                  </Link>
                </MagneticButton>
                <div className="flex items-center gap-2 text-white text-lg font-medium">
                  <Icon icon="lucide:shield-check" className="w-6 h-6" />
                  {t('landing.ctaSafe')}
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      {/* Footer */}
      <footer id="kontakt" className="pt-16 pb-10 border-t border-[var(--c-border)]/40 scroll-mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-12">
            {/* Brend */}
            <div className="space-y-4">
              <img src="/logo.svg" alt="Smeta AI" className="h-14 w-auto" />
              <p className="text-sm text-[var(--c-muted)] leading-relaxed max-w-xs">{t('landing.footerDesc')}</p>
            </div>

            {/* Tezkor havolalar */}
            <div>
              <h4 className="font-display font-bold text-white mb-4">{t('landing.footerLinks')}</h4>
              <ul className="space-y-2.5 text-sm">
                {NAV_ANCHORS.map((l) => (
                  <li key={l.key}>
                    <a href={l.href} className="text-[var(--c-muted)] hover:text-white transition-colors">{t(`landing.nav.${l.key}`)}</a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Biz bilan bog'laning */}
            <div>
              <h4 className="font-display font-bold text-white mb-4">{t('landing.footerContact')}</h4>
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="inline-flex items-center gap-2 text-sm text-[var(--c-muted)] hover:text-[#22D3EE] transition-colors mb-5"
              >
                <Icon icon="lucide:mail" className="w-4 h-4 text-[#22D3EE]" />
                {CONTACT_EMAIL}
              </a>
              <div className="flex items-center gap-3">
                {SOCIAL.map((s) => (
                  <a
                    key={s.label}
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={s.label}
                    title={s.label}
                    className="w-11 h-11 flex items-center justify-center rounded-xl bg-[var(--c-panel)] border border-[var(--c-border)]/60 text-[var(--c-muted)] hover:text-white hover:border-[#FF6B1A]/50 hover:bg-[#FF6B1A]/10 transition-colors"
                  >
                    <Icon icon={s.icon} className="w-5 h-5" />
                  </a>
                ))}
              </div>
            </div>
          </div>

          <div className="pt-8 border-t border-[var(--c-border)]/40 flex flex-col sm:flex-row justify-between items-center gap-3">
            <p className="text-[12px] text-[var(--c-muted)] tracking-widest uppercase text-center">{t('landing.footerCopyright')}</p>
            {/* Huquqiy hujjatlar (T4) */}
            <div className="flex items-center gap-4 text-[12px]">
              <Link to="/privacy" className="text-[var(--c-muted)] hover:text-white transition-colors">{t('legal.privacy.title')}</Link>
              <Link to="/terms" className="text-[var(--c-muted)] hover:text-white transition-colors">{t('legal.terms.title')}</Link>
              <span className="text-[var(--c-muted)]/60">{t('landing.footerLocation')}</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Hero (T5.1): master timeline + 3D parallaks + ScrambleText.
function HeroSection() {
  const { t, i18n } = useTranslation();
  const sectionRef = useRef<HTMLElement>(null);
  const line1Ref = useRef<HTMLSpanElement>(null);
  const accentRef = useRef<HTMLSpanElement>(null);

  // H1 birinchi qatori — SplitText chars (i18n-xavfsiz: revert->rAF->rebuild)
  useSplitTextI18n(
    line1Ref,
    (split) => {
      gsap.from(split.chars, {
        yPercent: 60,
        autoAlpha: 0,
        duration: 0.7,
        ease: EASE_IN,
        stagger: 0.02,
        delay: 0.15,
      });
    },
    { type: 'chars' },
  );

  useGSAP(
    () => {
      const root = sectionRef.current;
      if (!root) return;
      const mm = gsap.matchMedia();

      // Kirish xoreografiyasi (~1.5s) — reduced-motion'da umuman ishlamaydi
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        const tl = gsap.timeline({ defaults: { ease: EASE_IN } });
        tl.from('.hero-badge', { scale: 0.85, autoAlpha: 0, duration: 0.5 }, 0)
          .from('.hero-line2', { y: 26, autoAlpha: 0, duration: 0.7 }, 0.45)
          .from('.hero-sub', { y: 22, autoAlpha: 0, duration: 0.6 }, 0.65)
          .from('.hero-cta', { scale: 0.92, autoAlpha: 0, duration: 0.5, stagger: 0.08 }, 0.8)
          .from('.hero-preview', { y: 56, autoAlpha: 0, duration: 0.8 }, 0.9);

        // ScrambleText — saytdagi 2 ta ruxsatdan biri ("AI" aksenti)
        const accent = accentRef.current;
        if (accent) {
          tl.to(accent, {
            duration: 1,
            scrambleText: { text: accent.textContent ?? '', chars: '01▮▯AI', speed: 0.4 },
          }, 0.5);
        }
      });

      // 3D parallaks qatlamlar — faqat desktop, sichqonchaga maks ±12px
      mm.add(MM_DESKTOP, () => {
        const layers = gsap.utils.toArray<HTMLElement>('[data-depth]', root);
        const movers = layers.map((el) => ({
          depth: Number(el.dataset.depth ?? 0.5),
          x: gsap.quickTo(el, 'x', { duration: 0.8, ease: 'power3.out' }),
          y: gsap.quickTo(el, 'y', { duration: 0.8, ease: 'power3.out' }),
        }));
        const onMove = (e: MouseEvent) => {
          const nx = e.clientX / window.innerWidth - 0.5;
          const ny = e.clientY / window.innerHeight - 0.5;
          movers.forEach((m) => {
            m.x(nx * 24 * m.depth); // maks ±12px (depth<=1)
            m.y(ny * 24 * m.depth);
          });
        };
        window.addEventListener('mousemove', onMove);
        return () => window.removeEventListener('mousemove', onMove);
      });

      return () => mm.revert();
    },
    // Til almashganda hero qayta ijro etiladi (SplitText hook bilan sinxron)
    { scope: sectionRef, dependencies: [i18n.language] },
  );

  return (
    <section ref={sectionRef} className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden" style={{ perspective: '1000px' }}>
      <CursorBlob />
      <Spotlight className="-top-40 left-0 md:-top-20 md:left-60" fill="#5555E7" />
      <div data-depth="0.3" className="absolute inset-0"><GridBackground /></div>
      <div data-depth="0.6" className="absolute top-0 left-1/2 -translate-x-1/2 w-[576px] h-[525px] bg-[#5555E7]/10 rounded-full blur-[120px] -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
        <div className="hero-badge inline-flex items-center gap-2 px-4 py-1.5 bg-[#22D3EE]/5 border border-[#22D3EE]/30 rounded-full backdrop-blur-md mb-8">
          <Icon icon="lucide:cpu" className="w-4 h-4 text-[#22D3EE]" />
          <span className="text-[12px] font-semibold text-[#22D3EE]">{t('landing.badge')}</span>
        </div>

        <h1 className="text-4xl sm:text-5xl md:text-7xl font-extrabold font-display leading-tight mb-6 tracking-tight break-words">
          <span ref={line1Ref} className="block">{t('landing.heroTitle1')}</span>
          <span className="hero-line2 block">
            {/* key={til}: ScrambleText matn tugunini o'zgartiradi — til almashganda
                React toza tugun bilan qayta o'rnatishi uchun remount qilamiz */}
            <span key={i18n.language} ref={accentRef} className="bg-gradient-to-r from-[#FF6B1A] to-[#FB923C] bg-clip-text text-transparent">{t('landing.heroAccent')}</span>{' '}
            {t('landing.heroTitle2')}
          </span>
        </h1>

        <p className="hero-sub max-w-2xl mx-auto text-lg md:text-xl text-[var(--c-muted)] font-display leading-relaxed mb-10">
          {t('landing.heroSub')}
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20">
          <MagneticButton className="hero-cta w-full sm:w-auto">
            <Link to="/kirish" className="block w-full px-8 py-4 bg-[#FF6B1A] rounded-xl text-lg font-medium text-white shadow-[0_10px_30px_rgba(255,107,26,0.3)] focus-visible:outline-2 focus-visible:outline-[#22D3EE]">
              {t('landing.tryFree')}
            </Link>
          </MagneticButton>
          <MagneticButton className="hero-cta w-full sm:w-auto">
            <Link to="/kirish" className="w-full px-8 py-4 bg-[var(--c-bg)] border border-[#22D3EE]/30 rounded-xl text-lg font-medium text-[#22D3EE] flex items-center justify-center gap-3 hover:bg-[#22D3EE]/5 transition-colors focus-visible:outline-2 focus-visible:outline-[#22D3EE]">
              {t('landing.login')} <Icon icon="lucide:arrow-right" className="w-5 h-5" />
            </Link>
          </MagneticButton>
        </div>

        {/* Dashboard preview — parallaks qatlam */}
        <div data-depth="1" className="hero-preview relative max-w-5xl mx-auto">
          <div className="absolute inset-0 bg-gradient-to-r from-[#F97316]/20 to-[#06B6D4]/20 blur-[40px] rounded-[32px] -z-10" />
          <div className="bg-[var(--c-panel)]/60 border border-white/10 rounded-[32px] p-4 backdrop-blur-2xl shadow-2xl">
            <img src="/assets/landing/IMG_6.webp" alt="Dashboard" className="w-full h-auto rounded-2xl" />
          </div>
        </div>
      </div>
    </section>
  );
}

// UZ/RU almashtirgich — app'dagi bilan bir xil i18n holati (localStorage: smeta_lang)
function LangSwitcher() {
  const { i18n } = useTranslation();
  const current = (i18n.language === 'ru' ? 'ru' : 'uz') as Lang;
  return (
    <div className="flex bg-[var(--c-border)]/50 border border-[var(--c-border)]/50 rounded-full p-0.5 text-[11px] font-bold uppercase">
      {(['uz', 'ru'] as Lang[]).map((l) => (
        <button
          key={l}
          onClick={() => l !== current && setLanguage(l)}
          className={`px-2.5 py-1 rounded-full transition-colors ${current === l ? 'bg-[#5555E7] text-white' : 'text-[var(--c-muted)] hover:text-white'}`}
        >
          {l === 'uz' ? 'UZ' : 'RU'}
        </button>
      ))}
    </div>
  );
}

// FAQ accordion elementi
function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="glass-card rounded-2xl bg-[var(--c-panel)]/40 overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left hover:bg-white/5 transition-colors"
      >
        <span className="font-display font-bold text-white">{q}</span>
        <Icon
          icon="lucide:chevron-down"
          className={`w-5 h-5 text-[#FF6B1A] shrink-0 transition-transform duration-300 ${open ? 'rotate-180' : ''}`}
        />
      </button>
      <div className={`grid transition-all duration-300 ${open ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
        <div className="overflow-hidden">
          <p className="px-6 pb-5 text-sm text-[var(--c-muted)] leading-relaxed">{a}</p>
        </div>
      </div>
    </div>
  );
}
