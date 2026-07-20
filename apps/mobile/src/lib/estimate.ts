// Smeta jami hisob-kitobi — backend finance.ts formulasi bilan bir xil
// (subtotal = Σ qty×narx; soliq = subtotal×taxRate%; jami = subtotal+soliq).
// Backend saqlashda qayta hisoblaydi (yagona manba), bu faqat jonli ko'rsatish.
export interface CalcRow {
  qty: number;
  unitPrice: number;
}

export function computeTotals(items: CalcRow[], taxRate: number) {
  const subtotal = items.reduce((sum, i) => sum + (Number(i.qty) || 0) * (Number(i.unitPrice) || 0), 0);
  const taxAmount = subtotal * ((Number(taxRate) || 0) / 100);
  return { subtotal, taxAmount, total: subtotal + taxAmount };
}
