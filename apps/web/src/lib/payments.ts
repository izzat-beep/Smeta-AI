import { api } from "./api"; // mavjud axios instance'ingiz

export interface Payment {
  id: string;
  saleId: string;
  amount: number;
  currency: string;
  location?: string;
  method?: string;
  note?: string;
  paidAt: string;
}

export const getPayments = async (saleId: string): Promise<Payment[]> => {
  // response obyekti ixtiyoriy tipda deb belgilansa, .data hech qachon xato bermaydi
  const response: any = await api.get(`/sales/${saleId}/payments`);
  return response.data;
};

export const addPayment = async (saleId: string, payload: Partial<Payment>): Promise<Payment> => {
  const response: any = await api.post(`/sales/${saleId}/payments`, payload);
  return response.data;
};

export const deletePayment = async (id: string): Promise<void> => {
  await api.delete(`/sales/payments/${id}`);
};