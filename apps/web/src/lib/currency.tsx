import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Currency } from '@smeta/shared';
import { useAuth } from './auth';

const CUR_KEY = 'smeta_currency';
const DEFAULT_RATE = 12600;

interface CurrencyState {
  currency: Currency; // ko'rsatiladigan valyuta
  rate: number; // 1 USD = rate so'm
  setCurrency: (c: Currency) => void;
  /** UZS'dagi summani tanlangan valyutada raqam sifatida qaytaradi. */
  convert: (amountUzs: number) => number;
  /** UZS'dagi summani tanlangan valyutada formatlangan matn sifatida qaytaradi. */
  fmt: (amountUzs: number) => string;
}

const CurrencyContext = createContext<CurrencyState | null>(null);

function initialCurrency(): Currency {
  const saved = localStorage.getItem(CUR_KEY);
  return saved === 'USD' ? 'USD' : 'UZS';
}

function format(amount: number, currency: Currency): string {
  if (currency === 'USD') {
    const n = new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount);
    return `${n} USD`;
  }
  const n = new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 }).format(Math.round(amount));
  return `${n} UZS`;
}

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const { tenant } = useAuth();
  const [currency, setCurrencyState] = useState<Currency>(initialCurrency);
  const [rate, setRate] = useState<number>(DEFAULT_RATE);

  // Tenant yuklanganda kursni sinxronlaymiz (admin kiritgan qiymat).
  useEffect(() => {
    if (tenant?.usdRate && tenant.usdRate > 0) setRate(tenant.usdRate);
  }, [tenant?.usdRate]);

  function setCurrency(c: Currency) {
    setCurrencyState(c);
    localStorage.setItem(CUR_KEY, c);
  }

  const convert = (amountUzs: number) => (currency === 'USD' ? amountUzs / (rate || DEFAULT_RATE) : amountUzs);
  const fmt = (amountUzs: number) => format(convert(amountUzs), currency);

  return (
    <CurrencyContext.Provider value={{ currency, rate, setCurrency, convert, fmt }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error('useCurrency CurrencyProvider ichida ishlatilishi kerak');
  return ctx;
}
