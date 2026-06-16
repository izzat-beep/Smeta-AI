import { useEffect, useState } from 'react';
import { Icon } from '@iconify/react';
import { api, ApiError } from '../lib/api';

interface SettingsForm {
  fullName: string;
  email: string;
  position: string;
  company: string;
  inn: string;
  phone: string;
  avatarUrl: string | null;
}

const EMPTY: SettingsForm = {
  fullName: '',
  email: '',
  position: '',
  company: '',
  inn: '',
  phone: '',
  avatarUrl: null,
};

export function Settings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetched baseline (for "Bekor qilish" reset)
  const [original, setOriginal] = useState<SettingsForm>(EMPTY);

  // Controlled inputs
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [position, setPosition] = useState('');
  const [company, setCompany] = useState('');
  const [inn, setInn] = useState('');
  const [phone, setPhone] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  // Visual-only preferences (local state)
  const [currency, setCurrency] = useState<'UZS' | 'USD'>('UZS');
  const [unit, setUnit] = useState('Kvadrat (m²)');
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(true);

  function applyForm(f: SettingsForm) {
    setFullName(f.fullName);
    setEmail(f.email);
    setPosition(f.position);
    setCompany(f.company);
    setInn(f.inn);
    setPhone(f.phone);
    setAvatarUrl(f.avatarUrl);
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
        };
        setOriginal(form);
        applyForm(form);
      } catch (err) {
        if (!active) return;
        setError(err instanceof ApiError ? err.message : 'Maʼlumotlarni yuklashda xatolik');
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    setError(null);
    try {
      await api.patch('/settings', {
        fullName,
        position,
        company: { name: company, inn, phone },
      });
      const next: SettingsForm = { fullName, email, position, company, inn, phone, avatarUrl };
      setOriginal(next);
      setSaved(true);
      window.setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Saqlashda xatolik yuz berdi');
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
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h2 className="text-3xl font-extrabold font-display tracking-tight text-white">Sozlamalar</h2>
            <p className="text-[#BCC0C7] text-sm mt-1">Tizim va profil preferensiyalarini boshqarish</p>
          </div>
          <div className="px-3 py-1 bg-[#06B6D4]/5 border border-[#06B6D4]/30 rounded-full">
            <span className="text-[12px] font-semibold text-[#22D3EE]">Pro Versiya</span>
          </div>
        </div>

        {loading ? (
          <SettingsSkeleton />
        ) : (
          <>
            {/* Personal Profile Card */}
            <section className="glass-panel rounded-xl p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                <Icon icon="lucide:user" className="w-24 h-24" />
              </div>
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 bg-[#5555E7]/10 border border-[#5555E7]/20 rounded-xl flex items-center justify-center">
                  <Icon icon="lucide:user" className="w-5 h-5 text-[#FF6B1A]" />
                </div>
                <h3 className="text-xl font-bold font-display text-white">Shaxsiy Profil</h3>
              </div>

              <div className="flex flex-col md:flex-row gap-6 items-start md:items-center mb-8">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={fullName}
                    className="w-20 h-20 rounded-full object-cover shadow-xl border-2 border-[#343841]"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-full shadow-xl border-2 border-[#343841] bg-[#5555E7]/15 flex items-center justify-center">
                    <span className="text-2xl font-bold font-display text-[#5555E7]">{initial}</span>
                  </div>
                )}
                <div className="space-y-1">
                  <h4 className="text-lg font-bold font-display text-white">{fullName || 'Foydalanuvchi'}</h4>
                  <p className="text-[12px] text-[#BCC0C7] tracking-widest uppercase">{position || 'Lavozim ko‘rsatilmagan'}</p>
                  <button
                    type="button"
                    className="mt-2 px-3 py-1.5 bg-[#16181D] border border-[#343841]/60 rounded-lg text-[12px] font-medium text-white hover:bg-[#1c1f26] transition-colors"
                  >
                    Rasmni yangilash
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <InputField label="To'liq ism" value={fullName} onChange={setFullName} />
                <InputField label="Email manzili" value={email} onChange={() => {}} readOnly />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                <InputField label="Lavozim" value={position} onChange={setPosition} />
              </div>
            </section>

            {/* Company Info Card */}
            <section className="glass-panel rounded-xl p-6">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 bg-[#5555E7]/10 border border-[#5555E7]/20 rounded-xl flex items-center justify-center">
                  <Icon icon="lucide:building-2" className="w-5 h-5 text-[#FF6B1A]" />
                </div>
                <h3 className="text-xl font-bold font-display text-white">Kompaniya Ma'lumotlari</h3>
              </div>
              <div className="space-y-6">
                <InputField label="Tashkilot nomi" value={company} onChange={setCompany} />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <InputField label="STIR (INN)" value={inn} onChange={setInn} />
                  <InputField label="Telefon" value={phone} onChange={setPhone} />
                </div>
              </div>
            </section>

            {/* System Preferences Card */}
            <section className="glass-panel rounded-xl p-6">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 bg-[#5555E7]/10 border border-[#5555E7]/20 rounded-xl flex items-center justify-center">
                  <Icon icon="lucide:settings-2" className="w-5 h-5 text-[#FF6B1A]" />
                </div>
                <h3 className="text-xl font-bold font-display text-white">Tizim Preferensiyalari</h3>
              </div>

              <div className="space-y-8">
                {/* Currency Toggle */}
                <div className="flex items-center justify-between p-4 bg-[#343841]/20 border border-[#343841]/30 rounded-2xl">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-[#F97316]/10 rounded-xl flex items-center justify-center">
                      <Icon icon="lucide:refresh-ccw" className="w-4 h-4 text-[#FB923C]" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">Asosiy Valyuta</p>
                      <p className="text-[10px] text-[#BCC0C7]">Hisob-kitoblar qaysi valyutada ko'rsatiladi</p>
                    </div>
                  </div>
                  <div className="flex bg-[#16181D]/80 border border-[#343841]/50 p-1 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setCurrency('UZS')}
                      className={
                        currency === 'UZS'
                          ? 'px-4 py-1 bg-[#5555E7] text-[#16181D] text-[12px] font-bold rounded-lg shadow-sm'
                          : 'px-4 py-1 text-[#BCC0C7] text-[12px] font-medium'
                      }
                    >
                      UZS
                    </button>
                    <button
                      type="button"
                      onClick={() => setCurrency('USD')}
                      className={
                        currency === 'USD'
                          ? 'px-4 py-1 bg-[#5555E7] text-[#16181D] text-[12px] font-bold rounded-lg shadow-sm'
                          : 'px-4 py-1 text-[#BCC0C7] text-[12px] font-medium'
                      }
                    >
                      USD
                    </button>
                  </div>
                </div>

                {/* Units */}
                <div>
                  <p className="text-[12px] font-semibold text-[#BCC0C7] tracking-widest uppercase mb-4">O'lchov Birliklari</p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {['Metr (m)', 'Kvadrat (m²)', 'Kub (m³)', 'Vazn (kg)'].map((label) => (
                      <UnitBadge key={label} label={label} active={unit === label} onClick={() => setUnit(label)} />
                    ))}
                  </div>
                </div>

                {/* Toggles */}
                <div className="space-y-4">
                  <ToggleItem
                    icon="lucide:bell"
                    label="Bildirishnomalar"
                    iconColor="text-[#22D3EE]"
                    checked={notifications}
                    onChange={setNotifications}
                  />
                  <ToggleItem
                    icon="lucide:moon"
                    label="Tungi rejim (Doimiy)"
                    iconColor="text-[#818CF8]"
                    checked={darkMode}
                    onChange={setDarkMode}
                  />
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Icon icon="lucide:languages" className="w-4 h-4 text-[#34D399]" />
                      <span className="text-sm text-white">Interfeys tili</span>
                    </div>
                    <span className="text-[12px] font-medium text-[#5555E7]">O'zbek (Lotin)</span>
                  </div>
                </div>
              </div>
            </section>

            {/* Inline status */}
            {error && (
              <div className="px-4 py-3 bg-[#E11919]/10 border border-[#E11919]/30 rounded-xl text-[13px] text-[#FCA5A5]">
                {error}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-end gap-4 pt-4 pb-10">
              {saved && (
                <span className="text-[13px] font-semibold text-[#26D926] flex items-center gap-1 mr-auto sm:mr-0">
                  <Icon icon="lucide:check" className="w-4 h-4" />
                  Saqlandi ✓
                </span>
              )}
              <button
                type="button"
                onClick={handleCancel}
                disabled={saving}
                className="px-6 py-2.5 text-[#BCC0C7] font-medium hover:text-white transition-colors disabled:opacity-50"
              >
                Bekor qilish
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="px-10 py-2.5 bg-[#FF6B1A] text-white font-semibold rounded-xl hover:bg-[#e65a00] transition-all shadow-lg shadow-[#FF6B1A]/20 disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {saving && <Icon icon="lucide:loader" className="w-4 h-4 animate-spin" />}
                O'zgarishlarni saqlash
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// Helper Components
function InputField({
  label,
  value,
  onChange,
  readOnly = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  readOnly?: boolean;
}) {
  return (
    <div className="space-y-2">
      <label className="text-[12px] font-medium text-[#BCC0C7]">{label}</label>
      <input
        type="text"
        value={value}
        readOnly={readOnly}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full bg-[#16181D]/50 border border-[#343841]/50 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#5555E7]/50 transition-all ${
          readOnly ? 'text-[#BCC0C7] cursor-not-allowed' : ''
        }`}
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
        active
          ? 'bg-[#5555E7]/10 border-[#5555E7]/40 text-[#5555E7]'
          : 'bg-[#343841]/10 border-[#343841]/30 text-[#BCC0C7] hover:border-[#343841]/60'
      }`}
    >
      {label}
    </button>
  );
}

function ToggleItem({
  icon,
  label,
  iconColor,
  checked,
  onChange,
}: {
  icon: string;
  label: string;
  iconColor: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Icon icon={icon} className={`w-4 h-4 ${iconColor}`} />
        <span className="text-sm text-white">{label}</span>
      </div>
      <label className="relative inline-flex items-center cursor-pointer">
        <input
          type="checkbox"
          className="sr-only peer"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
        />
        <div className="w-11 h-6 bg-[#343841]/50 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#2020DF]"></div>
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
            <div className="w-10 h-10 rounded-xl bg-[#343841]/40" />
            <div className="h-5 w-48 rounded bg-[#343841]/40" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="h-12 rounded-xl bg-[#343841]/30" />
            <div className="h-12 rounded-xl bg-[#343841]/30" />
          </div>
        </div>
      ))}
    </div>
  );
}
