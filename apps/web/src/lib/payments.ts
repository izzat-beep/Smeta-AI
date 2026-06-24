import { api } from './api';

// DIQQAT: `api` — bu fetch asosidagi klient (axios EMAS). U javobni to'g'ridan-to'g'ri
// qaytaradi, `.data` mavjud emas. Avval `response.data` ishlatilgani sabab to'lovlar
// yuklanmasdi (undefined qaytardi) — shu bug tuzatildi.

export interface Payment {
  id: string;
  saleId: string;
  amount: number;
  currency: 'UZS' | 'USD';
  location?: string | null;
  method?: string | null;
  note?: string | null;
  paidAt: string;
  createdAt?: string;
}

export const getPayments = (saleId: string): Promise<Payment[]> =>
  api.get<Payment[]>(`/sales/${saleId}/payments`);

export const addPayment = (saleId: string, payload: Partial<Payment>): Promise<Payment> =>
  api.post<Payment>(`/sales/${saleId}/payments`, payload);

export const deletePayment = (id: string): Promise<void> =>
  api.delete(`/sales/payments/${id}`);
