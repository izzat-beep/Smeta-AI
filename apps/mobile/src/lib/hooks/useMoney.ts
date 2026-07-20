import { useMemo } from 'react';
import { useSettings } from '@/lib/settingsStore';
import { useAuth } from '@/lib/auth/authStore';
import { formatMoney, formatMoneyShort } from '@/lib/format';

// Ko'rsatish valyutasiga qarab UZS asosidagi summani formatlaydi.
// Backend ko'p joyda UZS'ga normallashtirilgan qiymat qaytaradi; foydalanuvchi
// USD tanlasa tenant.usdRate bo'yicha aylantiramiz.
export function useMoney() {
  const currency = useSettings((s) => s.currency);
  const rate = useAuth((s) => s.tenant?.usdRate) ?? 12600;

  return useMemo(() => {
    const conv = (uzs: number) => (currency === 'USD' ? uzs / (rate > 0 ? rate : 12600) : uzs);
    return {
      format: (amountUzs: number) => formatMoney(conv(amountUzs), currency),
      formatShort: (amountUzs: number) => formatMoneyShort(conv(amountUzs), currency),
    };
  }, [currency, rate]);
}
