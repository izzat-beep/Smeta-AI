import { useQuery } from '@tanstack/react-query';
import { dashboardApi, projectsApi, type ProjectListParams } from '@/lib/api/endpoints';

// Query key'lar — invalidatsiya uchun markaziy.
export const qk = {
  dashboard: ['dashboard'] as const,
  projects: (params?: ProjectListParams) => ['projects', 'list', params ?? {}] as const,
  projectSummaries: ['projects', 'summaries'] as const,
  project: (id: string) => ['projects', 'detail', id] as const,
  projectSummary: (id: string) => ['projects', 'summary', id] as const,
};

export function useDashboard() {
  return useQuery({ queryKey: qk.dashboard, queryFn: () => dashboardApi.get() });
}

export function useProjects(params?: ProjectListParams) {
  return useQuery({ queryKey: qk.projects(params), queryFn: () => projectsApi.list(params) });
}

export function useProjectSummaries() {
  return useQuery({ queryKey: qk.projectSummaries, queryFn: () => projectsApi.summaries() });
}

export function useProject(id: string) {
  return useQuery({ queryKey: qk.project(id), queryFn: () => projectsApi.detail(id), enabled: !!id });
}

export function useProjectSummary(id: string) {
  return useQuery({ queryKey: qk.projectSummary(id), queryFn: () => projectsApi.summary(id), enabled: !!id });
}
