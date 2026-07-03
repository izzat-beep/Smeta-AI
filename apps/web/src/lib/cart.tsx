import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

export interface CartItem {
  materialId: string;
  name: string;
  unit: string;
  priceUzs: number; // baza narx (UZS) — ko'rsatishda tanlangan valyutaga o'giriladi
  imageUrl: string | null;
  qty: number;
}

interface CartState {
  items: CartItem[];
  count: number; // pozitsiyalar soni
  totalUzs: number;
  add: (item: Omit<CartItem, 'qty'>, qty?: number) => void;
  setQty: (materialId: string, qty: number) => void;
  remove: (materialId: string) => void;
  clear: () => void;
}

const CartContext = createContext<CartState | null>(null);
const KEY = 'smeta_cart';

function load(): CartItem[] {
  try {
    const raw = localStorage.getItem(KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(load);

  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify(items));
  }, [items]);

  function add(item: Omit<CartItem, 'qty'>, qty = 1) {
    setItems((prev) => {
      const ex = prev.find((i) => i.materialId === item.materialId);
      if (ex) return prev.map((i) => (i.materialId === item.materialId ? { ...i, qty: i.qty + qty } : i));
      return [...prev, { ...item, qty }];
    });
  }
  function setQty(materialId: string, qty: number) {
    setItems((prev) => prev.map((i) => (i.materialId === materialId ? { ...i, qty: Math.max(1, qty) } : i)));
  }
  function remove(materialId: string) {
    setItems((prev) => prev.filter((i) => i.materialId !== materialId));
  }
  function clear() {
    setItems([]);
  }

  const count = items.length;
  const totalUzs = items.reduce((sum, i) => sum + i.priceUzs * i.qty, 0);

  return (
    <CartContext.Provider value={{ items, count, totalUzs, add, setQty, remove, clear }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart CartProvider ichida ishlatilishi kerak');
  return ctx;
}
