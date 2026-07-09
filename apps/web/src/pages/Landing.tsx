// Landing sahifasi (Vazifa 4): to'liq ikki tilli (UZ/RU, i18n orqali —
// hardcoded matn yo'q), FAQ accordion, Biz haqimizda, ishlaydigan anchor
// navigatsiya (#imkoniyatlar, #biz-haqimizda, #narxlar, #mijozlar, #faq, #kontakt).
import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Icon } from '@iconify/react';
import { motion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { setLanguage, type Lang } from '../i18n';
import {
  Spotlight,
  GridBackground,
  TextGenerateEffect,
  Meteors,
  SpotlightCard,
  InfiniteMovingCards,
  Reveal,
  Counter,
} from '../components/aceternity';

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
const PLAN_PRICES_LBL = ['199 000', '499 000', null]; // null = "Bog'laning"

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
              <a key={l.key} href={l.href} className="px-4 py-2 text-sm font-medium text-[var(--c-muted)] hover:text-white transition-colors">
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

      {/* Hero */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
        <Spotlight className="-top-40 left-0 md:-top-20 md:left-60" fill="#5555E7" />
        <GridBackground />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[576px] h-[525px] bg-[#5555E7]/10 rounded-full blur-[120px] -z-10" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#22D3EE]/5 border border-[#22D3EE]/30 rounded-full backdrop-blur-md mb-8"
          >
            <Icon icon="lucide:cpu" className="w-4 h-4 text-[#22D3EE]" />
            <span className="text-[12px] font-semibold text-[#22D3EE]">{t('landing.badge')}</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="text-4xl sm:text-5xl md:text-7xl font-extrabold font-display leading-tight mb-6 tracking-tight break-words"
          >
            {t('landing.heroTitle1')}<br />
            <span className="bg-gradient-to-r from-[#FF6B1A] to-[#FB923C] bg-clip-text text-transparent">{t('landing.heroAccent')}</span> {t('landing.heroTitle2')}
          </motion.h1>

          <p className="max-w-2xl mx-auto text-lg md:text-xl text-[var(--c-muted)] font-display leading-relaxed mb-10">
            <TextGenerateEffect words={t('landing.heroSub')} />
          </p>

          <Reveal delay={0.4}>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20">
              <Link to="/kirish" className="w-full sm:w-auto px-8 py-4 bg-[#FF6B1A] rounded-xl text-lg font-medium shadow-[0_10px_30px_rgba(255,107,26,0.3)] hover:scale-105 transition-transform">
                {t('landing.tryFree')}
              </Link>
              <Link to="/kirish" className="w-full sm:w-auto px-8 py-4 bg-[var(--c-bg)] border border-[#22D3EE]/30 rounded-xl text-lg font-medium text-[#22D3EE] flex items-center justify-center gap-3 hover:bg-[#22D3EE]/5 transition-colors">
                {t('landing.login')} <Icon icon="lucide:arrow-right" className="w-5 h-5" />
              </Link>
            </div>
          </Reveal>

          {/* Dashboard preview */}
          <motion.div
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.5 }}
            className="relative max-w-5xl mx-auto"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-[#F97316]/20 to-[#06B6D4]/20 blur-[40px] rounded-[32px] -z-10" />
            <div className="bg-[var(--c-panel)]/60 border border-white/10 rounded-[32px] p-4 backdrop-blur-2xl shadow-2xl">
              <img src="/assets/landing/IMG_6.webp" alt="Dashboard" className="w-full h-auto rounded-2xl" />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Imkoniyatlar */}
      <section id="imkoniyatlar" className="py-24 bg-[var(--c-panel)]/30 scroll-mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal>
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold font-display mb-4">{t('landing.featuresTitle')}</h2>
              <p className="text-[var(--c-muted)] max-w-lg mx-auto">{t('landing.featuresSub')}</p>
            </div>
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {features.map((f, i) => {
              const m = FEATURE_META[i] ?? FEATURE_META[1];
              return (
                <Reveal key={f.title} delay={i * 0.08} className={m.big ? 'md:col-span-2' : ''}>
                  <SpotlightCard className="h-full p-8">
                    <div className="w-14 h-14 rounded-xl flex items-center justify-center mb-6" style={{ background: `${m.color}1a`, border: `1px solid ${m.color}33` }}>
                      <Icon icon={m.icon} className="w-7 h-7" style={{ color: m.color }} />
                    </div>
                    <h3 className="text-2xl font-bold font-display mb-4">{f.title}</h3>
                    <p className="text-[var(--c-muted)] leading-relaxed">{f.desc}</p>
                  </SpotlightCard>
                </Reveal>
              );
            })}
          </div>
        </div>
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
      <section id="narxlar" className="py-24 scroll-mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal>
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold font-display mb-4">{t('landing.pricingTitle')}</h2>
              <p className="text-[var(--c-muted)]">{t('landing.pricingSub')}</p>
            </div>
          </Reveal>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
            {plans.map((p, i) => {
              const popular = i === 1;
              const price = PLAN_PRICES_LBL[i];
              return (
                <Reveal key={p.name} delay={i * 0.1}>
                  <div className={`glass-card rounded-2xl p-8 relative ${popular ? 'border-[#FF6B1A]/40 shadow-[0_0_40px_rgba(255,107,26,0.12)] md:scale-105 z-10 bg-[var(--c-panel)]/60' : 'bg-[var(--c-panel)]/30'}`}>
                    {popular && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#FF6B1A] text-white text-[12px] font-semibold px-4 py-1 rounded-full">{t('landing.popular')}</div>
                    )}
                    <div className="text-[var(--c-muted)] font-display font-medium mb-4">{p.name}</div>
                    <div className="flex items-baseline gap-2 mb-8">
                      <span className="text-3xl font-bold font-display">{price ?? t('landing.contactUs')}</span>
                      {price && <span className="text-[var(--c-muted)]">{t('landing.perMonth')}</span>}
                    </div>
                    <ul className="space-y-4 mb-10">
                      {p.items.map((it) => (
                        <li key={it} className="flex items-center gap-3 text-sm text-white/90">
                          <Icon icon="lucide:circle-check-big" className="w-5 h-5 text-[#22D3EE] shrink-0" />
                          {it}
                        </li>
                      ))}
                    </ul>
                    <Link to="/kirish" className={`block text-center w-full py-3 rounded-xl font-bold transition-all ${popular ? 'bg-[#FF6B1A] hover:scale-105 shadow-[0_4px_15px_rgba(255,107,26,0.3)]' : 'bg-[var(--c-border)] hover:bg-[var(--c-border)]/80'}`}>
                      {t('landing.start')}
                    </Link>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* Mijozlar */}
      <section id="mijozlar" className="py-24 bg-[var(--c-panel)]/20 scroll-mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12">
          <Reveal><h2 className="text-3xl md:text-4xl font-bold font-display text-center">{t('landing.customersTitle')}</h2></Reveal>
        </div>
        <InfiniteMovingCards items={testimonials} speed={36} />
      </section>

      {/* FAQ */}
      <section id="faq" className="py-24 scroll-mt-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal>
            <div className="text-center mb-12">
              <h2 className="text-4xl md:text-5xl font-bold font-display mb-4">{t('landing.faqTitle')}</h2>
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
                <Link to="/kirish" className="w-full sm:w-auto px-8 py-4 bg-white text-[#EA580C] rounded-xl text-lg font-bold hover:scale-105 transition-transform">
                  {t('landing.ctaBtn')}
                </Link>
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
