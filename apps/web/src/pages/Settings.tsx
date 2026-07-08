import { useEffect, useState } from 'react';
import { Icon } from '@iconify/react';
import { useTranslation } from 'react-i18next';
import { api, ApiError } from '../lib/api';
import { useAuth } from '../lib/auth';
import { useCurrency } from '../lib/currency';
import { useTheme } from '../lib/theme';
import { setLanguage, type Lang } from '../i18n';

interface SettingsForm {
  fullName: string;
  email: string;
  position: string;
  company: string;
  inn: string;
  phone: string;
  avatarUrl: string | null;
  usdRate: number;
}

const EMPTY: SettingsForm = {
  fullName: '', email: '', position: '', company: '', inn: '', phone: '', avatarUrl: null, usdRate: 12600,
};

export function Settings() {
  const { t, i18n } = useTranslation();
  const { user, refreshMe } = useAuth();
  const { currency, setCurrency } = useCurrency();
  const { theme, setTheme } = useTheme();
  const isOwner = user?.role === 'OWNER';

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [original, setOriginal] = useState<SettingsForm>(EMPTY);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [position, setPosition] = useState('');
  const [company, setCompany] = useState('');
  const [inn, setInn] = useState('');
  const [phone, setPhone] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [usdRate, setUsdRate] = useState('12600');

  const [unit, setUnit] = useState('Kvadrat (m²)');
  const [notifications, setNotifications] = useState(true);

  const lang = (i18n.language === 'ru' ? 'ru' : 'uz') as Lang;

  function applyForm(f: SettingsForm) {
    setFullName(f.fullName);
    setEmail(f.email);
    setPosition(f.position);
    setCompany(f.company);
    setInn(f.inn);
    setPhone(f.phone);
    setAvatarUrl(f.avatarUrl);
    setUsdRate(String(f.usdRate));
  }

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const data = await api.get<{ user: any; tenant: any }>('/settings');
        if (!active) return;
        const form: SettingsForm = {
          fullName: data.user?.fullName ?? '',
          email: data.user?.email ?? '',
          position: data.user?.position ?? '',
          company: data.tenant?.name ?? '',
          inn: data.tenant?.inn ?? '',
          phone: data.tenant?.phone ?? '',
          avatarUrl: data.user?.avatarUrl ?? null,
          usdRate: data.tenant?.usdRate ?? 12600,
        };
        setOriginal(form);
        applyForm(form);
      } catch (err) {
        if (!active) return;
        setError(err instanceof ApiError ? err.message : t('common.loadError'));
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function changeLang(next: Lang) {
    if (next === lang) return;
    setLanguage(next);
    api.patch('/settings', { language: next }).catch(() => {});
  }

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    setError(null);
    try {
      const patch: any = { fullName, position, language: lang };
      // Kompaniya ma'lumotlari va kursni faqat OWNER yubora oladi (aks holda 403).
      if (isOwner) {
        patch.company = { name: company, inn, phone, usdRate: parseFloat(usdRate) || undefined };
      }
      await api.patch('/settings', patch);
      const next: SettingsForm = { fullName, email, position, company, inn, phone, avatarUrl, usdRate: parseFloat(usdRate) || 12600 };
      setOriginal(next);
      setSaved(true);
      await refreshMe(); // tenant.usdRate global kontekstga yangilanishi uchun
      window.setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('common.saveError'));
    } finally {
      setSaving(false);
    }
  }

  function handleCancel() {
    applyForm(original);
    setSaved(false);
    setError(null);
  }

  const initial = (fullName.trim()[0] ?? '?').toUpperCase();

  return (
    <div className="p-4 lg:p-10 max-w-3xl mx-auto w-full">
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h2 className="text-3xl font-extrabold font-display tracking-tight text-white">{t('settings.title')}</h2>
            <p className="text-[var(--c-muted)] text-sm mt-1">{t('settings.subtitle')}</p>
          </div>
          <div className="px-3 py-1 bg-[#06B6D4]/5 border border-[#06B6D4]/30 rounded-full">
            <span className="text-[12px] font-semibold text-[#22D3EE]">{t('common.proVersion')}</span>
          </div>
        </div>

        {loading ? (
          <SettingsSkeleton />
        ) : (
          <>
            {/* Shaxsiy profil */}
            <section className="glass-panel rounded-xl p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                <Icon icon="lucide:user" className="w-24 h-24" />
              </div>
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 bg-[#5555E7]/10 border border-[#5555E7]/20 rounded-xl flex items-center justify-center">
                  <Icon icon="lucide:user" className="w-5 h-5 text-[#FF6B1A]" />
                </div>
                <h3 className="text-xl font-bold font-display text-white">{t('settings.personalProfile')}</h3>
              </div>

              <div className="flex flex-col md:flex-row gap-6 items-start md:items-center mb-8">
                {avatarUrl ? (
                  <img src={avatarUrl} alt={fullName} className="w-20 h-20 rounded-full object-cover shadow-xl border-2 border-[var(--c-border)]" />
                ) : (
                  <div className="w-20 h-20 rounded-full shadow-xl border-2 border-[var(--c-border)] bg-[#5555E7]/15 flex items-center justify-center">
                    <span className="text-2xl font-bold font-display text-[#5555E7]">{initial}</span>
                  </div>
                )}
                <div className="space-y-1">
                  <h4 className="text-lg font-bold font-display text-white">{fullName || t('settings.defaultUser')}</h4>
                  <p className="text-[12px] text-[var(--c-muted)] tracking-widest uppercase">{position || t('settings.noPosition')}</p>
                  <button type="button" className="mt-2 px-3 py-1.5 bg-[var(--c-bg)] border border-[var(--c-border)]/60 rounded-lg text-[12px] font-medium text-white hover:bg-[#1c1f26] transition-colors">
                    {t('settings.updatePhoto')}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <InputField label={t('settings.fullName')} value={fullName} onChange={setFullName} />
                <InputField label={t('settings.emailAddr')} value={email} onChange={() => {}} readOnly />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                <InputField label={t('settings.position')} value={position} onChange={setPosition} />
              </div>
            </section>

            {/* Kompaniya ma'lumotlari */}
            <section className="glass-panel rounded-xl p-6">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 bg-[#5555E7]/10 border border-[#5555E7]/20 rounded-xl flex items-center justify-center">
                  <Icon icon="lucide:building-2" className="w-5 h-5 text-[#FF6B1A]" />
                </div>
                <h3 className="text-xl font-bold font-display text-white">{t('settings.companyInfo')}</h3>
              </div>
              <div className="space-y-6">
                <InputField label={t('settings.orgName')} value={company} onChange={setCompany} readOnly={!isOwner} />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <InputField label={t('settings.inn')} value={inn} onChange={setInn} readOnly={!isOwner} />
                  <InputField label={t('settings.phone')} value={phone} onChange={setPhone} readOnly={!isOwner} />
                </div>
              </div>
            </section>

            {/* Tizim preferensiyalari */}
            <section className="glass-panel rounded-xl p-6">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 bg-[#5555E7]/10 border border-[#5555E7]/20 rounded-xl flex items-center justify-center">
                  <Icon icon="lucide:settings-2" className="w-5 h-5 text-[#FF6B1A]" />
                </div>
                <h3 className="text-xl font-bold font-display text-white">{t('settings.systemPrefs')}</h3>
              </div>

              <div className="space-y-8">
                {/* Valyuta */}
                <div className="flex items-center justify-between p-4 bg-[var(--c-border)]/20 border border-[var(--c-border)]/30 rounded-2xl">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-[#F97316]/10 rounded-xl flex items-center justify-center">
                      <Icon icon="lucide:refresh-ccw" className="w-4 h-4 text-[#FB923C]" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">{t('settings.baseCurrency')}</p>
                      <p className="text-[10px] text-[var(--c-muted)]">{t('settings.baseCurrencyDesc')}</p>
                    </div>
                  </div>
                  <div className="flex bg-[var(--c-bg)]/80 border border-[var(--c-border)]/50 p-1 rounded-xl">
                    {(['UZS', 'USD'] as const).map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setCurrency(c)}
                        className={currency === c ? 'px-4 py-1 bg-[#5555E7] text-white text-[12px] font-bold rounded-lg shadow-sm' : 'px-4 py-1 text-[var(--c-muted)] text-[12px] font-medium'}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Valyuta kursi (qo'lda) */}
                <div className="p-4 bg-[var(--c-border)]/20 border border-[var(--c-border)]/30 rounded-2xl">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 bg-[#22D3EE]/10 rounded-xl flex items-center justify-center">
                      <Icon icon="lucide:banknote" className="w-4 h-4 text-[#22D3EE]" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">{t('settings.exchangeRate')}</p>
                      <p className="text-[10px] text-[var(--c-muted)]">{t('settings.exchangeRateDesc')}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-[var(--c-muted)]">1 USD =</span>
                    <input
                      type="number"
                      value={usdRate}
                      onChange={(e) => setUsdRate(e.target.value)}
                      readOnly={!isOwner}
                      className={`w-40 bg-[var(--c-bg)]/50 border border-[var(--c-border)]/50 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-[#5555E7]/50 ${!isOwner ? 'opacity-60 cursor-not-allowed' : ''}`}
                    />
                    <span className="text-sm text-[var(--c-muted)]">UZS</span>
                  </div>
                  {!isOwner && <p className="text-[10px] text-[var(--c-muted)]/70 mt-2">{t('settings.exchangeRateOwnerOnly')}</p>}
                </div>

                {/* Birliklar */}
                <div>
                  <p className="text-[12px] font-semibold text-[var(--c-muted)] tracking-widest uppercase mb-4">{t('settings.units')}</p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {['Metr (m)', 'Kvadrat (m²)', 'Kub (m³)', 'Vazn (kg)'].map((label) => (
                      <UnitBadge key={label} label={label} active={unit === label} onClick={() => setUnit(label)} />
                    ))}
                  </div>
                </div>

                {/* Til + toggle'lar */}
                <div className="space-y-4">
                  <ToggleItem icon="lucide:bell" label={t('settings.notifications')} iconColor="text-[#22D3EE]" checked={notifications} onChange={setNotifications} />
                  {/* Tungi rejim — real ishlaydi: butun ilova temasi + localStorage (Vazifa 3) */}
                  <ToggleItem
                    icon="lucide:moon"
                    label={t('settings.darkMode')}
                    iconColor="text-[#818CF8]"
                    checked={theme === 'dark'}
                    onChange={(on) => setTheme(on ? 'dark' : 'light')}
                  />
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Icon icon="lucide:languages" className="w-4 h-4 text-[#34D399]" />
                      <span className="text-sm text-white">{t('settings.interfaceLang')}</span>
                    </div>
                    <div className="flex bg-[var(--c-bg)]/80 border border-[var(--c-border)]/50 p-1 rounded-xl">
                      <button type="button" onClick={() => changeLang('uz')} className={lang === 'uz' ? 'px-3 py-1 bg-[#5555E7] text-white text-[12px] font-bold rounded-lg' : 'px-3 py-1 text-[var(--c-muted)] text-[12px] font-medium'}>{t('settings.langUz')}</button>
                      <button type="button" onClick={() => changeLang('ru')} className={lang === 'ru' ? 'px-3 py-1 bg-[#5555E7] text-white text-[12px] font-bold rounded-lg' : 'px-3 py-1 text-[var(--c-muted)] text-[12px] font-medium'}>{t('settings.langRu')}</button>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {error && (
              <div className="px-4 py-3 bg-[#E11919]/10 border border-[#E11919]/30 rounded-xl text-[13px] text-[#FCA5A5]">{error}</div>
            )}

            <div className="flex flex-col sm:flex-row sm:items-center justify-end gap-4 pt-4 pb-10">
              {saved && (
                <span className="text-[13px] font-semibold text-[#26D926] flex items-center gap-1 mr-auto sm:mr-0">
                  <Icon icon="lucide:check" className="w-4 h-4" />
                  {t('common.saved')}
                </span>
              )}
              <button type="button" onClick={handleCancel} disabled={saving} className="px-6 py-2.5 text-[var(--c-muted)] font-medium hover:text-white transition-colors disabled:opacity-50">
                {t('common.cancel')}
              </button>
              <button type="button" onClick={handleSave} disabled={saving} className="px-10 py-2.5 bg-[#FF6B1A] text-white font-semibold rounded-xl hover:bg-[#e65a00] transition-all shadow-lg shadow-[#FF6B1A]/20 disabled:opacity-60 flex items-center justify-center gap-2">
                {saving && <Icon icon="lucide:loader" className="w-4 h-4 animate-spin" />}
                {t('settings.saveChanges')}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function InputField({ label, value, onChange, readOnly = false }: { label: string; value: string; onChange: (value: string) => void; readOnly?: boolean }) {
  return (
    <div className="space-y-2">
      <label className="text-[12px] font-medium text-[var(--c-muted)]">{label}</label>
      <input
        type="text"
        value={value}
        readOnly={readOnly}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full bg-[var(--c-bg)]/50 border border-[var(--c-border)]/50 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#5555E7]/50 transition-all ${readOnly ? 'text-[var(--c-muted)] cursor-not-allowed' : ''}`}
      />
    </div>
  );
}

function UnitBadge({ label, active = false, onClick }: { label: string; active?: boolean; onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-2 rounded-xl text-[10px] font-medium text-center border transition-all cursor-pointer ${
        active ? 'bg-[#5555E7]/10 border-[#5555E7]/40 text-[#5555E7]' : 'bg-[var(--c-border)]/10 border-[var(--c-border)]/30 text-[var(--c-muted)] hover:border-[var(--c-border)]/60'
      }`}
    >
      {label}
    </button>
  );
}

function ToggleItem({ icon, label, iconColor, checked, onChange }: { icon: string; label: string; iconColor: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Icon icon={icon} className={`w-4 h-4 ${iconColor}`} />
        <span className="text-sm text-white">{label}</span>
      </div>
      <label className="relative inline-flex items-center cursor-pointer">
        <input type="checkbox" className="sr-only peer" checked={checked} onChange={(e) => onChange(e.target.checked)} />
        <div className="w-11 h-6 bg-[var(--c-border)]/50 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#2020DF]"></div>
      </label>
    </div>
  );
}

function SettingsSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      {[0, 1, 2].map((i) => (
        <div key={i} className="glass-panel rounded-xl p-6 space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[var(--c-border)]/40" />
            <div className="h-5 w-48 rounded bg-[var(--c-border)]/40" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="h-12 rounded-xl bg-[var(--c-border)]/30" />
            <div className="h-12 rounded-xl bg-[var(--c-border)]/30" />
          </div>
        </div>
      ))}
    </div>
  );
}
