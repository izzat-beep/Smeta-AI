// Huquqiy sahifalar (T4, brief v3): /privacy va /terms — OCHIQ (auth'siz),
// UZ/RU i18n bilan jonli almashadi, SEO uchun title/description o'rnatiladi.
import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Icon } from '@iconify/react';
import { useTranslation } from 'react-i18next';
import { setLanguage, type Lang } from '../i18n';
import type { LegalDoc } from '../i18n/legal';

export function Privacy() {
  return <LegalPage kind="privacy" />;
}
export function Terms() {
  return <LegalPage kind="terms" />;
}

function LegalPage({ kind }: { kind: 'privacy' | 'terms' }) {
  const { t } = useTranslation();
  const doc = t(`legal.${kind}`, { returnObjects: true }) as LegalDoc;
  const other = kind === 'privacy' ? 'terms' : 'privacy';
  const otherTitle = t(`legal.${other}.title`);

  // SEO: sahifa sarlavhasi va tavsifi (indexlanadigan ochiq sahifa)
  useEffect(() => {
    const prevTitle = document.title;
    document.title = `${doc.title} — Smeta AI`;
    let meta = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    const prevDesc = meta?.content ?? '';
    if (meta) meta.content = doc.metaDesc;
    return () => {
      document.title = prevTitle;
      if (meta) meta.content = prevDesc;
    };
  }, [doc.title, doc.metaDesc]);

  return (
    <div className="min-h-screen bg-[var(--c-bg)] text-white font-sans">
      {/* Yuqori panel */}
      <nav className="sticky top-0 z-40 bg-[var(--c-bg)]/80 backdrop-blur-xl border-b border-[var(--c-border)]/40">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <img src="/logo.svg" alt="Smeta AI" className="h-10 w-auto" />
          </Link>
          <div className="flex items-center gap-3">
            <LangSwitcher />
            <Link to="/" className="text-sm text-[var(--c-muted)] hover:text-white transition-colors flex items-center gap-1.5">
              <Icon icon="lucide:house" className="w-4 h-4" />
              <span className="hidden sm:inline">{t('login.home')}</span>
            </Link>
          </div>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
        <h1 className="font-display text-3xl md:text-4xl font-extrabold tracking-tight mb-2">{doc.title}</h1>
        <p className="text-[12px] text-[var(--c-muted)] mb-10">{doc.updated}</p>

        <div className="space-y-8">
          {doc.sections.map((sec) => (
            <section key={sec.h}>
              <h2 className="font-display text-lg font-bold text-white mb-3">{sec.h}</h2>
              <div className="space-y-3">
                {sec.p.map((para, i) => (
                  <p key={i} className="text-sm text-[var(--c-muted)] leading-relaxed">{para}</p>
                ))}
              </div>
            </section>
          ))}
        </div>

        {/* Boshqa hujjatga o'tish */}
        <div className="mt-12 pt-8 border-t border-[var(--c-border)]/40 flex flex-col sm:flex-row items-center justify-between gap-4">
          <Link to={`/${other}`} className="text-sm text-[#22D3EE] hover:underline flex items-center gap-1.5">
            <Icon icon="lucide:file-text" className="w-4 h-4" />
            {otherTitle}
          </Link>
          <p className="text-[12px] text-[var(--c-muted)]/60">© 2026 Smeta AI · smeta-ai.uz</p>
        </div>
      </main>
    </div>
  );
}

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
