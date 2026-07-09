// Video ko'rgazma (T5.5): brauzer mockup ichida demo video, hover'da yengil
// 3D tilt. src berilsa — scroll-scrub (video.currentTime ScrollTrigger
// progress'idan boshqariladi, muted+playsinline). Hozircha video ASSET YO'Q:
// poster placeholder ko'rsatiladi.
// TODO: haqiqiy demo video (webm/mp4, keyframe-friendly) qo'shilганда
// `src` prop'ini bering — scrub avtomatik ishlaydi.
import { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import { gsap, MM_DESKTOP, ScrollTrigger } from '../../lib/gsapSetup';

export function VideoShowcase({ poster, src }: { poster: string; src?: string }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useGSAP(
    () => {
      const wrap = wrapRef.current;
      if (!wrap) return;
      const mm = gsap.matchMedia();

      mm.add(MM_DESKTOP, () => {
        const card = wrap.querySelector<HTMLElement>('.video-card');
        if (!card) return;
        gsap.set(card, { transformPerspective: 1000 });
        const rx = gsap.quickTo(card, 'rotationX', { duration: 0.6, ease: 'power3.out' });
        const ry = gsap.quickTo(card, 'rotationY', { duration: 0.6, ease: 'power3.out' });
        const onMove = (e: MouseEvent) => {
          const r = card.getBoundingClientRect();
          rx(-((e.clientY - r.top) / r.height - 0.5) * 5);
          ry(((e.clientX - r.left) / r.width - 0.5) * 5);
        };
        const onLeave = () => {
          rx(0);
          ry(0);
        };
        card.addEventListener('mousemove', onMove);
        card.addEventListener('mouseleave', onLeave);

        // Scroll-scrub: video mavjud bo'lsa currentTime progress'dan
        let st: ScrollTrigger | undefined;
        const video = videoRef.current;
        if (video && src) {
          const onMeta = () => {
            st = gsap.timeline({
              scrollTrigger: {
                trigger: wrap,
                start: 'top 80%',
                end: 'bottom 20%',
                scrub: 0.5,
                onUpdate: (self) => {
                  if (video.duration) video.currentTime = video.duration * self.progress;
                },
              },
            }).scrollTrigger;
          };
          if (video.readyState >= 1) onMeta();
          else video.addEventListener('loadedmetadata', onMeta, { once: true });
        }

        return () => {
          card.removeEventListener('mousemove', onMove);
          card.removeEventListener('mouseleave', onLeave);
          st?.kill();
        };
      });

      return () => mm.revert();
    },
    { scope: wrapRef },
  );

  return (
    <div ref={wrapRef} style={{ perspective: '1000px' }}>
      <div className="video-card mx-auto max-w-4xl rounded-[24px] border border-white/10 bg-[var(--c-panel)]/70 backdrop-blur-xl shadow-2xl overflow-hidden [transform-style:preserve-3d]">
        {/* Brauzer mockup paneli */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5 bg-white/5">
          <span className="w-3 h-3 rounded-full bg-[#E11919]/70" />
          <span className="w-3 h-3 rounded-full bg-[#F97316]/70" />
          <span className="w-3 h-3 rounded-full bg-[#10B981]/70" />
          <span className="ml-3 text-[11px] text-[var(--c-muted)]/60 font-mono">smeta-ai.uz</span>
        </div>
        {src ? (
          <video
            ref={videoRef}
            src={src}
            poster={poster}
            muted
            playsInline
            preload="metadata"
            className="w-full h-auto block"
          />
        ) : (
          <img src={poster} alt="Smeta AI demo" loading="lazy" className="w-full h-auto block" />
        )}
      </div>
    </div>
  );
}
