import { create } from 'zustand';

// Savat — client state (Zustand). Buyurtma yuborilgach tozalanadi.
// (Kelajakda AsyncStorage persist qo'shilishi mumkin.)
export interface CartItem {
  materialId: string;
  name: string;
  unit: string;
  priceUzs: number;
  imageUrl: string | null;
  qty: number;
}

interface CartState {
  items: CartItem[];
  add: (item: Omit<CartItem, 'qty'>) => void;
  setQty: (materialId: string, qty: number) => void;
  remove: (materialId: string) => void;
  clear: () => void;
}

export const useCart = create<CartState>((set) => ({
  items: [],
  add: (item) =>
    set((s) => {
      const existing = s.items.find((i) => i.materialId === item.materialId);
      if (existing) {
        return { items: s.items.map((i) => (i.materialId === item.materialId ? { ...i, qty: i.qty + 1 } : i)) };
      }
      return { items: [...s.items, { ...item, qty: 1 }] };
    }),
  setQty: (materialId, qty) =>
    set((s) => ({
      items: qty <= 0 ? s.items.filter((i) => i.materialId !== materialId) : s.items.map((i) => (i.materialId === materialId ? { ...i, qty } : i)),
    })),
  remove: (materialId) => set((s) => ({ items: s.items.filter((i) => i.materialId !== materialId) })),
  clear: () => set({ items: [] }),
}));

export function cartCount(items: CartItem[]): number {
  return items.reduce((n, i) => n + i.qty, 0);
}
export function cartTotalUzs(items: CartItem[]): number {
  return items.reduce((s, i) => s + i.priceUzs * i.qty, 0);
}
