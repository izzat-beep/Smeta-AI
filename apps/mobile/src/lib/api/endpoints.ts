import { api } from '@/lib/api/client';
import type {
  Project,
  DashboardData,
  ProjectSummaries,
  ProjectSummary,
  ProjectFinance,
  Estimate,
} from '@smeta/shared';

// Query string quruvchi (bo'sh/undefined qiymatlarni tashlab).
function qs(params?: Record<string, string | undefined>): string {
  if (!params) return '';
  const entries = Object.entries(params).filter(([, v]) => v != null && v !== '');
  if (!entries.length) return '';
  return '?' + entries.map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`).join('&');
}

export const dashboardApi = {
  get: () => api.get<DashboardData>('/dashboard'),
};

export type ProjectDetail = Project & { estimates: Estimate[] };
// type alias (interface emas) — implicit index signature bilan qs() Record'iga mos.
export type ProjectListParams = {
  q?: string;
  status?: string;
};

export const projectsApi = {
  list: (params?: ProjectListParams) => api.get<Project[]>(`/projects${qs(params)}`),
  summaries: () => api.get<ProjectSummaries>('/projects/summaries'),
  detail: (id: string) => api.get<ProjectDetail>(`/projects/${id}`),
  summary: (id: string) => api.get<ProjectSummary>(`/projects/${id}/summary`),
  finance: (id: string) => api.get<ProjectFinance>(`/projects/${id}/finance`),
};
