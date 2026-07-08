// Aceternity UI uslubidagi animatsiyali komponentlar (motion/react + Tailwind v4).
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { motion, useMotionValue, useMotionTemplate, stagger, useAnimate } from 'motion/react';
import { cn } from '../lib/cn';

// ─── Spotlight (hero foni uchun SVG nur) ──────────────────────────────────
export function Spotlight({ className, fill = '#5555E7' }: { className?: string; fill?: string }) {
  return (
    <svg
      className={cn('animate-spotlight pointer-events-none absolute z-[1] h-[169%] w-[138%] lg:w-[84%] opacity-0', className)}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 3787 2842"
      fill="none"
    >
      <g filter="url(#spot)">
        <ellipse cx="1924.71" cy="273.501" rx="1924.71" ry="273.501" transform="matrix(-0.822377 -0.568943 -0.568943 0.822377 3631.88 2291.09)" fill={fill} fillOpacity="0.22" />
      </g>
      <defs>
        <filter id="spot" x="0.860352" y="0.838989" width="3785.16" height="2840.26" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
          <feFlood floodOpacity="0" result="BackgroundImageFix" />
          <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
          <feGaussianBlur stdDeviation="151" result="effect1_foregroundBlur" />
        </filter>
      </defs>
    </svg>
  );
}

// ─── Aurora background (animatsiyali gradient bloblar) ─────────────────────
export function AuroraBackground({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('relative overflow-hidden', className)}>
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        <div className="animate-aurora absolute -top-40 -left-40 h-[40rem] w-[40rem] rounded-full bg-[#5555E7]/25 blur-[120px]" style={{ ['--aurora-duration' as string]: '16s' }} />
        <div className="animate-aurora absolute -bottom-40 -right-40 h-[40rem] w-[40rem] rounded-full bg-[#06B6D4]/25 blur-[120px]" style={{ ['--aurora-duration' as string]: '20s' }} />
        <div className="animate-aurora absolute top-1/3 left-1/2 h-[30rem] w-[30rem] rounded-full bg-[#FF6B1A]/15 blur-[120px]" style={{ ['--aurora-duration' as string]: '24s' }} />
      </div>
      <div className="relative z-10">{children}</div>
    </div>
  );
}

// ─── Background grid (nuqtali to'r) ────────────────────────────────────────
export function GridBackground({ className }: { className?: string }) {
  return (
    <div
      className={cn('pointer-events-none absolute inset-0 z-0 opacity-[0.07]', className)}
      style={{
        backgroundImage:
          'linear-gradient(to right, var(--c-muted) 1px, transparent 1px), linear-gradient(to bottom, var(--c-muted) 1px, transparent 1px)',
        backgroundSize: '48px 48px',
        maskImage: 'radial-gradient(ellipse at center, black 30%, transparent 75%)',
        WebkitMaskImage: 'radial-gradient(ellipse at center, black 30%, transparent 75%)',
      }}
    />
  );
}

// ─── Text Generate Effect (so'zlar blur bilan paydo bo'ladi) ───────────────
export function TextGenerateEffect({ words, className }: { words: string; className?: string }) {
  const [scope, animate] = useAnimate();
  const wordArr = words.split(' ');
  useEffect(() => {
    animate(
      'span',
      { opacity: 1, filter: 'blur(0px)' },
      { duration: 0.6, delay: stagger(0.12) },
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scope.current]);
  return (
    <span ref={scope} className={className}>
      {wordArr.map((w, i) => (
        <motion.span key={w + i} className="opacity-0" style={{ filter: 'blur(8px)' }}>
          {w}{' '}
        </motion.span>
      ))}
    </span>
  );
}

// ─── Meteors (tushuvchi meteorlar) ─────────────────────────────────────────
export function Meteors({ number = 16 }: { number?: number }) {
  const meteors = new Array(number).fill(true);
  return (
    <>
      {meteors.map((_, idx) => (
        <span
          key={idx}
          className="animate-meteor pointer-events-none absolute top-1/2 left-1/2 h-0.5 w-0.5 rounded-full bg-[#5555E7] shadow-[0_0_0_1px_#ffffff10] rotate-[215deg]"
          style={{
            top: 0,
            left: `${Math.floor(idx * (100 / number))}%`,
            ['--meteor-duration' as string]: `${2 + (idx % 5)}s`,
            animationDelay: `${(idx % 7) * 0.6}s`,
          }}
        >
          <span className="pointer-events-none absolute top-1/2 -z-10 h-px w-[60px] -translate-y-1/2 bg-gradient-to-r from-[#5555E7] to-transparent" />
        </span>
      ))}
    </>
  );
}

// ─── Spotlight Card (sichqoncha kursoriga ergashuvchi nur) ─────────────────
export function SpotlightCard({ children, className }: { children: ReactNode; className?: string }) {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const ref = useRef<HTMLDivElement>(null);

  function onMove(e: React.MouseEvent<HTMLDivElement>) {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    mouseX.set(e.clientX - rect.left);
    mouseY.set(e.clientY - rect.top);
  }

  const bg = useMotionTemplate`radial-gradient(320px circle at ${mouseX}px ${mouseY}px, rgba(85,85,231,0.18), transparent 70%)`;

  return (
    <div
      ref={ref}
      onMouseMove={onMove}
      className={cn('group relative overflow-hidden rounded-2xl border border-[var(--c-border)]/40 bg-[var(--c-panel)]/40 backdrop-blur-xl', className)}
    >
      <motion.div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100" style={{ background: bg }} />
      <div className="relative z-10">{children}</div>
    </div>
  );
}

// ─── Infinite Moving Cards (cheksiz aylanuvchi kartalar) ───────────────────
export function InfiniteMovingCards({
  items,
  speed = 40,
}: {
  items: { text: string; name: string; role: string }[];
  speed?: number;
}) {
  return (
    <div className="marquee-paused relative w-full overflow-hidden [mask-image:linear-gradient(to_right,transparent,white_12%,white_88%,transparent)]">
      <div className="animate-marquee flex w-max gap-4" style={{ ['--duration' as string]: `${speed}s` }}>
        {[...items, ...items].map((t, i) => (
          <div key={i} className="w-[320px] md:w-[420px] shrink-0 glass-card rounded-2xl p-7">
            <p className="text-white/80 italic leading-relaxed mb-6 text-sm">{t.text}</p>
            <div>
              <div className="font-display font-bold text-sm text-white">{t.name}</div>
              <div className="text-[var(--c-muted)] text-[12px]">{t.role}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Reveal (scroll/yuklanishda yumshoq paydo bo'lish) ─────────────────────
export function Reveal({ children, delay = 0, className }: { children: ReactNode; delay?: number; className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.6, delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ─── Number counter (raqam animatsiyasi) ───────────────────────────────────
export function Counter({ value, suffix = '', className }: { value: number; suffix?: string; className?: string }) {
  const [n, setN] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && !started.current) {
        started.current = true;
        const dur = 1400;
        const t0 = performance.now();
        const tick = (t: number) => {
          const p = Math.min((t - t0) / dur, 1);
          setN(Math.floor(value * (1 - Math.pow(1 - p, 3))));
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      }
    }, { threshold: 0.4 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [value]);
  return <span ref={ref} className={className}>{new Intl.NumberFormat('uz-UZ').format(n)}{suffix}</span>;
}
