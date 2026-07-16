// Lazy sahifa chunki yuklanayotganda ko'rsatiladigan yengil indikator.
// Dizayn tokenlariga tayanadi (--c-bg), brend rangi #FF6B1A — dizayn tizimiga mos.
export function PageLoader({ fullScreen = false }: { fullScreen?: boolean }) {
  return (
    <div
      role="status"
      aria-label="Yuklanmoqda"
      className={`flex items-center justify-center bg-[var(--c-bg)] ${
        fullScreen ? 'min-h-screen' : 'h-full min-h-[240px]'
      }`}
    >
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#FF6B1A] border-t-transparent" />
      <span className="sr-only">Yuklanmoqda…</span>
    </div>
  );
}
