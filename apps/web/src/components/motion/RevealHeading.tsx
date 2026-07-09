// Sarlavha line-mask reveal (T5.4): qatorlar maskadan chiqib keladi
// (ScrollTrigger, bir marta). SplitText i18n-xavfsiz hook orqali (T5.7).
import { useRef } from 'react';
import { useSplitTextI18n } from '../../lib/useSplitTextI18n';
import { gsap, EASE_IN } from '../../lib/gsapSetup';

export function RevealHeading({
  children,
  className = '',
  as: Tag = 'h2',
}: {
  children: React.ReactNode;
  className?: string;
  as?: 'h1' | 'h2' | 'h3';
}) {
  const ref = useRef<HTMLHeadingElement>(null);

  useSplitTextI18n(
    ref,
    (split) => {
      // Har qator mask ichida — pastdan chiqadi
      split.lines.forEach((line) => {
        const wrap = document.createElement('div');
        wrap.style.overflow = 'hidden';
        wrap.style.display = 'block';
        line.parentNode?.insertBefore(wrap, line);
        wrap.appendChild(line);
      });
      gsap.from(split.lines, {
        yPercent: 110,
        duration: 0.8,
        ease: EASE_IN,
        stagger: 0.08,
        scrollTrigger: { trigger: ref.current, start: 'top 85%', once: true },
      });
    },
    { type: 'lines' },
  );

  return (
    <Tag ref={ref as any} className={className}>
      {children}
    </Tag>
  );
}
