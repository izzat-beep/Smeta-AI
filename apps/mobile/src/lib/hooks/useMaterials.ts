import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { materialsApi, ordersApi, type CreateOrderInput } from '@/lib/api/endpoints';
import { qk } from '@/lib/hooks/useProjects';

export function useMaterials(params?: { q?: string; category?: string }) {
  return useQuery({
    queryKey: ['materials', 'list', params ?? {}],
    queryFn: () => materialsApi.list(params),
  });
}

export function useMaterialCategories() {
  return useQuery({ queryKey: ['materials', 'categories'], queryFn: () => materialsApi.categories() });
}

export function useOrders() {
  return useQuery({ queryKey: ['orders', 'list'], queryFn: () => ordersApi.list() });
}

export function useCreateOrder() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateOrderInput) => ordersApi.create(input),
    onSuccess: (order) => {
      // Buyurtma avto-xarajat yozadi — dashboard/loyiha/xarajatlar yangilanadi.
      void client.invalidateQueries({ queryKey: ['orders'] });
      void client.invalidateQueries({ queryKey: ['expenses'] });
      void client.invalidateQueries({ queryKey: qk.dashboard });
      void client.invalidateQueries({ queryKey: ['projects'] });
      if (order.projectId) void client.invalidateQueries({ queryKey: qk.project(order.projectId) });
    },
  });
}
