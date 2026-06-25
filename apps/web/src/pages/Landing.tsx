import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Icon } from '@iconify/react';
import { motion } from 'motion/react';
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

const FEATURES = [
  { icon: 'lucide:zap', color: '#FF6B1A', title: 'Tezkor Smeta Generator', desc: "Loyiha parametrlarini kiriting va AI soniyalar ichida barcha materiallar, mehnat va kutilmagan xarajatlarni o'z ichiga olgan batafsil smetani tayyorlaydi.", big: true },
  { icon: 'lucide:message-square', color: '#22D3EE', title: 'AI Konsultant', desc: "SNiP me'yorlari, materiallar sarfi va bozor narxlari bo'yicha savollaringizga 24/7 javob oling." },
  { icon: 'lucide:package', color: '#22D3EE', title: 'Materiallar Katalogi', desc: "10 000 dan ortiq qurilish materiallarining yangilangan bozor narxlari bazasi." },
  { icon: 'lucide:bar-chart-3', color: '#FF6B1A', title: 'Chuqur Analitika', desc: "Xarajatlar dinamikasi va foydani interaktiv grafiklarda kuzatib boring." },
];

const PRICING = [
  { name: "Boshlang'ich", price: '199 000', items: ['Cheklanmagan loyihalar', 'Asosiy kalkulyator', 'PDF export', 'Materiallar bazasi'], popular: false },
  { name: 'Professional', price: '499 000', items: ["Barcha boshlang'ich imkoniyatlar", 'AI smeta assistenti', 'Xarajatlar analitikasi', 'Loyiha boshqaruvi', 'Prioritetli yordam'], popular: true },
  { name: 'Korporativ', price: "Bog'laning", items: ['Barcha professional', 'Maxsus integratsiyalar', 'Umumiy hisobotlar', 'Shaxsiy menejer', "Ko'p foydalanuvchi"], popular: false },
];

const TESTIMONIALS = [
  { text: '"Ilgari bitta smetani tayyorlash 2 kun olardi. Hozir Smeta AI bilan 1 soat kifoya. AI assistenti materiallar sarfini aniq aytib beradi."', name: 'Anvar Rahimov', role: "Pudratchi, 'Build-UP' MCHJ" },
  { text: '"Interyer dizayn loyihalarida ta\'mirlash xarajatlarini mijozga tezda taqdim etish juda muhim. Tizim sodda va samarali."', name: 'Malika Ahmedova', role: 'Dizayner' },
  { text: '"Narxlarning doimiy yangilanishi ishimni osonlashtirdi. Katalogdagi narxlar bozorga juda yaqin."', name: 'Jamshid Tursunov', role: 'Qurilish muhandisi' },
  { text: '"Bir nechta ob\'ektni bir vaqtda boshqarish endi oson. Hisobotlar avtomatik tayyor bo\'ladi."', name: 'Sardor Azimov', role: 'Loyiha rahbari' },
];

const STATS = [
  { value: 15000, suffix: '+', label: 'Tayyorlangan smetalar', color: 'text-[#22D3EE]' },
  { value: 2500, suffix: '+', label: 'Faol pudratchilar', color: 'text-[#FF6B1A]' },
  { value: 20, suffix: 'T+', label: 'Loyiha aylanmasi (UZS)', color: 'text-[#22D3EE]' },
  { value: 99, suffix: '.8%', label: 'Hisoblash aniqligi', color: 'text-[#FF6B1A]' },
];

const NAV_LINKS = [
  { label: 'Imkoniyatlar', href: '#Imkoniyatlar' },
  { label: 'Biz haqimizda', href: '#biz-haqimizda' },
  { label: 'Narxlar', href: '#Narxlar' },
  { label: 'Mijozlar', href: '#Mijozlar' },
];

// ⚠️ Haqiqiy manzillarga almashtiring (placeholder):
const CONTACT_EMAIL = 'info@smeta-ai.uz';
const SOCIAL = [
  { label: 'Telegram', icon: 'mdi:telegram', href: 'https://t.me/smeta_ai' },
  { label: 'Instagram', icon: 'mdi:instagram', href: 'https://instagram.com/smeta.ai' },
  { label: 'Facebook', icon: 'mdi:facebook', href: 'https://facebook.com/smeta.ai' },
];

const ABOUT_POINTS = [
  { icon: 'lucide:target', title: 'Bizning maqsad', desc: "O'zbekiston quruvchilari uchun smeta tayyorlashni soddalashtirish va xatolarni kamaytirish." },
  { icon: 'lucide:users', title: 'Jamoamiz', desc: 'Muhandislar, dasturchilar va qurilish mutaxassislaridan iborat tajribali jamoa.' },
  { icon: 'lucide:shield-check', title: 'Ishonch', desc: "Ma'lumotlaringiz xavfsiz saqlanadi, narxlar bozorga mos real vaqtda yangilanadi." },
];

export function Landing() {
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <div className="min-h-screen bg-[#16181D] text-white font-sans selection:bg-[#FF6B1A]/30 overflow-x-hidden">
      {/* Navigation */}
      <motion.nav
        initial={{ y: -40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="fixed top-0 left-0 right-0 z-50 bg-[#16181D]/60 backdrop-blur-xl border-b border-[#343841]/40"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <img src="/logo.svg" alt="Smeta AI" className="h-12 sm:h-14 w-auto" />
          </Link>
          <div className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map((l) => (
              <a key={l.label} href={l.href} className="px-4 py-2 text-sm font-medium text-[#BCC0C7] hover:text-white transition-colors">{l.label}</a>
            ))}
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <Link to="/kirish" className="hidden sm:block px-4 py-2 text-sm font-medium text-[#22D3EE] border border-[#22D3EE] rounded-lg hover:bg-[#22D3EE]/10 transition-colors">Kirish</Link>
            <Link to="/kirish" className="hidden sm:block px-4 py-2 text-sm font-medium bg-[#FF6B1A] rounded-lg hover:bg-[#FF6B1A]/90 transition-colors">Ro‘yxatdan o‘tish</Link>
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
          <div className="md:hidden border-t border-[#343841]/40 bg-[#16181D]/95 backdrop-blur-xl px-4 py-4 space-y-1">
            {NAV_LINKS.map((l) => (
              <a key={l.label} href={l.href} onClick={() => setMenuOpen(false)} className="block px-4 py-3 rounded-xl text-sm font-medium text-[#BCC0C7] hover:bg-white/5 hover:text-white transition-colors">{l.label}</a>
            ))}
            <div className="grid grid-cols-2 gap-3 pt-3">
              <Link to="/kirish" onClick={() => setMenuOpen(false)} className="px-4 py-3 text-center text-sm font-medium text-[#22D3EE] border border-[#22D3EE] rounded-xl">Kirish</Link>
              <Link to="/kirish" onClick={() => setMenuOpen(false)} className="px-4 py-3 text-center text-sm font-medium bg-[#FF6B1A] rounded-xl">Ro‘yxatdan o‘tish</Link>
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
            <span className="text-[12px] font-semibold text-[#22D3EE]">2026-yil texnologiyasi bilan jihozlangan</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="text-4xl sm:text-5xl md:text-7xl font-extrabold font-display leading-tight mb-6 tracking-tight break-words"
          >
            Qurilish smetalarini<br />
            <span className="bg-gradient-to-r from-[#FF6B1A] to-[#FB923C] bg-clip-text text-transparent">AI yordamida</span> hisoblang
          </motion.h1>

          <p className="max-w-2xl mx-auto text-lg md:text-xl text-[#BCC0C7] font-display leading-relaxed mb-10">
            <TextGenerateEffect words="Smeta AI — muhandislar, pudratchilar va hunarmandlar uchun intellektual kalkulyator. Murakkab loyihalarni soniyalarda hisoblang." />
          </p>

          <Reveal delay={0.4}>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20">
              <Link to="/kirish" className="w-full sm:w-auto px-8 py-4 bg-[#FF6B1A] rounded-xl text-lg font-medium shadow-[0_10px_30px_rgba(255,107,26,0.3)] hover:scale-105 transition-transform">
                Bepul sinab ko'ring
              </Link>
              <Link to="/kirish" className="w-full sm:w-auto px-8 py-4 bg-[#16181D] border border-[#22D3EE]/30 rounded-xl text-lg font-medium text-[#22D3EE] flex items-center justify-center gap-3 hover:bg-[#22D3EE]/5 transition-colors">
                Kirish <Icon icon="lucide:arrow-right" className="w-5 h-5" />
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
            <div className="bg-[#191B1F]/60 border border-white/10 rounded-[32px] p-4 backdrop-blur-2xl shadow-2xl">
              <img src="/assets/landing/IMG_6.webp" alt="Dashboard" className="w-full h-auto rounded-2xl" />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section id="Imkoniyatlar" className="py-24 bg-[#191B1F]/30 scroll-mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal>
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold font-display mb-4">Hammasi bitta tizimda</h2>
              <p className="text-[#BCC0C7] max-w-lg mx-auto">Rejalashtirishdan to'liq hisobotgacha bo'lgan barcha jarayonlarni avtomatlashtiring.</p>
            </div>
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {FEATURES.map((f, i) => (
              <Reveal key={f.title} delay={i * 0.08} className={f.big ? 'md:col-span-2' : ''}>
                <SpotlightCard className="h-full p-8">
                  <div className="w-14 h-14 rounded-xl flex items-center justify-center mb-6" style={{ background: `${f.color}1a`, border: `1px solid ${f.color}33` }}>
                    <Icon icon={f.icon} className="w-7 h-7" style={{ color: f.color }} />
                  </div>
                  <h3 className="text-2xl font-bold font-display mb-4">{f.title}</h3>
                  <p className="text-[#BCC0C7] leading-relaxed">{f.desc}</p>
                </SpotlightCard>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 border-y border-[#343841]/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
            {STATS.map((s) => (
              <div key={s.label}>
                <div className={`text-4xl font-bold font-display mb-2 ${s.color}`}>
                  <Counter value={s.value} suffix={s.suffix} />
                </div>
                <div className="text-[14px] text-[#BCC0C7] uppercase tracking-widest">{s.label}</div>
              </div>
            ))}
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
                  <Icon icon="lucide:info" className="w-4 h-4" /> Biz haqimizda
                </span>
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold font-display mb-6 leading-tight">
                  Qurilish hisob-kitoblarini <span className="text-[#22D3EE]">aqlli</span> qilamiz
                </h2>
                <p className="text-[#BCC0C7] leading-relaxed mb-4">
                  Smeta AI — O'zbekistondagi pudratchilar, muhandislar va hunarmandlar uchun yaratilgan
                  sun'iy intellektga asoslangan smeta platformasi. Biz murakkab va ko'p vaqt
                  oladigan hisob-kitoblarni soniyalar ichida, aniq va shaffof qilishni maqsad qilganmiz.
                </p>
                <p className="text-[#BCC0C7] leading-relaxed">
                  Materiallar katalogi, usta ish haqi kalkulyatori, loyiha boshqaruvi va AI konsultant —
                  barchasi yagona, qulay tizimda jamlangan.
                </p>
              </div>
            </Reveal>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
              {ABOUT_POINTS.map((p, i) => (
                <Reveal key={p.title} delay={i * 0.1}>
                  <div className="glass-card rounded-2xl p-6 flex items-start gap-4 bg-[#191B1F]/40 h-full">
                    <div className="w-11 h-11 shrink-0 rounded-xl bg-[#22D3EE]/10 border border-[#22D3EE]/20 flex items-center justify-center">
                      <Icon icon={p.icon} className="w-5 h-5 text-[#22D3EE]" />
                    </div>
                    <div>
                      <h3 className="font-bold font-display text-white mb-1">{p.title}</h3>
                      <p className="text-sm text-[#BCC0C7] leading-relaxed">{p.desc}</p>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="Narxlar" className="py-24 scroll-mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal>
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold font-display mb-4">Sizga mos tarifni tanlang</h2>
              <p className="text-[#BCC0C7]">Kichik brigadalardan yirik qurilish kompaniyalarigacha.</p>
            </div>
          </Reveal>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
            {PRICING.map((p, i) => (
              <Reveal key={p.name} delay={i * 0.1}>
                <div className={`glass-card rounded-2xl p-8 relative ${p.popular ? 'border-[#FF6B1A]/40 shadow-[0_0_40px_rgba(255,107,26,0.12)] md:scale-105 z-10 bg-[#191B1F]/60' : 'bg-[#191B1F]/30'}`}>
                  {p.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#FF6B1A] text-white text-[12px] font-semibold px-4 py-1 rounded-full">Eng mashhur</div>
                  )}
                  <div className="text-[#BCC0C7] font-display font-medium mb-4">{p.name}</div>
                  <div className="flex items-baseline gap-2 mb-8">
                    <span className="text-3xl font-bold font-display">{p.price}</span>
                    <span className="text-[#BCC0C7]">{p.price.includes('Bog') ? '' : 'UZS / oy'}</span>
                  </div>
                  <ul className="space-y-4 mb-10">
                    {p.items.map((it) => (
                      <li key={it} className="flex items-center gap-3 text-sm text-white/90">
                        <Icon icon="lucide:circle-check-big" className="w-5 h-5 text-[#22D3EE] shrink-0" />
                        {it}
                      </li>
                    ))}
                  </ul>
                  <Link to="/kirish" className={`block text-center w-full py-3 rounded-xl font-bold transition-all ${p.popular ? 'bg-[#FF6B1A] hover:scale-105 shadow-[0_4px_15px_rgba(255,107,26,0.3)]' : 'bg-[#343841] hover:bg-[#343841]/80'}`}>
                    Boshlash
                  </Link>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="Mijozlar" className="py-24 bg-[#191B1F]/20 scroll-mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12">
          <Reveal><h2 className="text-3xl md:text-4xl font-bold font-display text-center">Mijozlarimiz fikri</h2></Reveal>
        </div>
        <InfiniteMovingCards items={TESTIMONIALS} speed={36} />
      </section>

      {/* CTA */}
      <section className="py-24 px-4 sm:px-6 lg:px-8">
        <Reveal className="max-w-7xl mx-auto">
          <div className="bg-gradient-to-br from-[#FF6B1A] to-[#EA580C] rounded-[40px] p-12 lg:p-20 relative overflow-hidden">
            <Meteors number={20} />
            <div className="absolute -top-48 -right-48 w-96 h-96 bg-white/10 rounded-full blur-[64px]" />
            <div className="relative z-10 max-w-2xl">
              <h2 className="text-4xl lg:text-6xl font-extrabold font-display mb-8 leading-tight">Qurilishni bugunoq tizimlashtiring</h2>
              <p className="text-white/90 text-xl font-display mb-12 leading-relaxed">Raqamli o'zgarishni boshlang. Birinchi loyiha mutlaqo bepul!</p>
              <div className="flex flex-col sm:flex-row items-center gap-6">
                <Link to="/kirish" className="w-full sm:w-auto px-8 py-4 bg-white text-[#EA580C] rounded-xl text-lg font-bold hover:scale-105 transition-transform">
                  Hozir ro'yxatdan o'tish
                </Link>
                <div className="flex items-center gap-2 text-white text-lg font-medium">
                  <Icon icon="lucide:shield-check" className="w-6 h-6" />
                  Xavfsiz tizim
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      {/* Footer */}
      <footer id="kontakt" className="pt-16 pb-10 border-t border-[#343841]/40 scroll-mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-12">
            {/* Brend */}
            <div className="space-y-4">
              <img src="/logo.svg" alt="Smeta AI" className="h-14 w-auto" />
              <p className="text-sm text-[#BCC0C7] leading-relaxed max-w-xs">
                Sun'iy intellekt yordamida qurilish smetalarini soniyalarda tayyorlovchi O'zbekiston platformasi.
              </p>
            </div>

            {/* Tezkor havolalar */}
            <div>
              <h4 className="font-display font-bold text-white mb-4">Havolalar</h4>
              <ul className="space-y-2.5 text-sm">
                {NAV_LINKS.map((l) => (
                  <li key={l.label}>
                    <a href={l.href} className="text-[#BCC0C7] hover:text-white transition-colors">{l.label}</a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Biz bilan bog'laning */}
            <div>
              <h4 className="font-display font-bold text-white mb-4">Biz bilan bog'laning</h4>
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="inline-flex items-center gap-2 text-sm text-[#BCC0C7] hover:text-[#22D3EE] transition-colors mb-5"
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
                    className="w-11 h-11 flex items-center justify-center rounded-xl bg-[#191B1F] border border-[#343841]/60 text-[#BCC0C7] hover:text-white hover:border-[#FF6B1A]/50 hover:bg-[#FF6B1A]/10 transition-colors"
                  >
                    <Icon icon={s.icon} className="w-5 h-5" />
                  </a>
                ))}
              </div>
            </div>
          </div>

          <div className="pt-8 border-t border-[#343841]/40 flex flex-col sm:flex-row justify-between items-center gap-3">
            <p className="text-[12px] text-[#BCC0C7] tracking-widest uppercase text-center">© 2026 Smeta AI — Qurilish hisob-kitoblarining kelajagi</p>
            <p className="text-[12px] text-[#BCC0C7]/60">Toshkent, O'zbekiston</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
