import { useQuery } from '@tanstack/react-query';
import { reportsApi } from '@/lib/api/endpoints';

export function useReports(params?: { projectId?: string; period?: string }) {
  return useQuery({
    queryKey: ['reports', 'summary', params ?? {}],
    queryFn: () => reportsApi.summary(params),
  });
}
