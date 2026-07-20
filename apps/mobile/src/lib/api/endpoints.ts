import { api } from '@/lib/api/client';
import type {
  Project,
  DashboardData,
  ProjectSummaries,
  ProjectSummary,
  ProjectFinance,
  Estimate,
  EstimateItemType,
  Currency,
  ExpenseItem,
  ExpenseCategory,
  Material,
  Order,
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

// ─── Smeta (estimates) ───────────────────────────────────────────────────────
export interface CreateEstimateItem {
  materialId?: string | null;
  name: string;
  type?: EstimateItemType;
  qty: number;
  unit?: string;
  unitPrice: number;
}
export interface CreateEstimateInput {
  title: string;
  projectId?: string | null;
  currency?: Currency;
  taxRate?: number;
  items: CreateEstimateItem[];
}

export const estimatesApi = {
  list: (projectId?: string) => api.get<Estimate[]>(`/estimates${qs({ projectId })}`),
  detail: (id: string) => api.get<Estimate>(`/estimates/${id}`),
  create: (input: CreateEstimateInput) => api.post<Estimate>('/estimates', input),
  remove: (id: string) => api.delete<void>(`/estimates/${id}`),
};

// ─── Umumiy xarajatlar (GeneralExpenses) ─────────────────────────────────────
export interface AddExpenseInput {
  label: string;
  amount: number;
  currency?: Currency;
  category?: ExpenseCategory;
  projectId?: string | null;
  spentAt?: string | null;
  note?: string | null;
}

export const expensesApi = {
  list: (params?: { projectId?: string; from?: string; to?: string }) =>
    api.get<ExpenseItem[]>(`/expenses/list${qs(params)}`),
  add: (input: AddExpenseInput) => api.post<ExpenseItem>('/expenses/add', input),
  update: (id: number, patch: Partial<AddExpenseInput>) => api.patch<ExpenseItem>(`/expenses/${id}`, patch),
  remove: (id: number) => api.delete<void>(`/expenses/${id}`),
};

// ─── Materiallar marketplace + buyurtmalar ───────────────────────────────────
export const materialsApi = {
  list: (params?: { q?: string; category?: string }) => api.get<Material[]>(`/materials${qs(params)}`),
  categories: () => api.get<string[]>('/materials/categories'),
  detail: (id: string) => api.get<Material>(`/materials/${id}`),
};

export interface CreateOrderItem {
  materialId?: string | null;
  name: string;
  unit?: string;
  unitPrice: number;
  qty: number;
}
export interface CreateOrderInput {
  customerName: string;
  customerPhone: string;
  address?: string | null;
  note?: string | null;
  currency?: Currency;
  projectId?: string | null;
  items: CreateOrderItem[];
}

export const ordersApi = {
  list: () => api.get<Order[]>('/orders'),
  detail: (id: string) => api.get<Order>(`/orders/${id}`),
  create: (input: CreateOrderInput) => api.post<Order>('/orders', input),
};
