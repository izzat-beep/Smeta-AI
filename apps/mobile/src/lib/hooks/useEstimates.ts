import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { estimatesApi, type CreateEstimateInput } from '@/lib/api/endpoints';
import { qk } from '@/lib/hooks/useProjects';

export const estimateKeys = {
  list: (projectId?: string) => ['estimates', 'list', projectId ?? 'all'] as const,
  detail: (id: string) => ['estimates', 'detail', id] as const,
};

export function useEstimates(projectId?: string) {
  return useQuery({ queryKey: estimateKeys.list(projectId), queryFn: () => estimatesApi.list(projectId) });
}

export function useEstimate(id: string) {
  return useQuery({ queryKey: estimateKeys.detail(id), queryFn: () => estimatesApi.detail(id), enabled: !!id });
}

export function useCreateEstimate() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateEstimateInput) => estimatesApi.create(input),
    onSuccess: (created) => {
      // Ro'yxatlar va bog'liq loyiha ma'lumotlarini yangilash.
      void client.invalidateQueries({ queryKey: ['estimates'] });
      void client.invalidateQueries({ queryKey: qk.dashboard });
      void client.invalidateQueries({ queryKey: ['projects'] });
      if (created.projectId) void client.invalidateQueries({ queryKey: qk.project(created.projectId) });
    },
  });
}

export function useDeleteEstimate() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => estimatesApi.remove(id),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: ['estimates'] });
      void client.invalidateQueries({ queryKey: ['projects'] });
    },
  });
}
