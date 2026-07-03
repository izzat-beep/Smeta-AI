// ═══════════════════════════════════════════════════════════════════════
//  @smeta/shared — Smeta AI tizimining umumiy tiplari va konstantalari
//  Backend (API), web va admin ilovalar shu kontraktdan foydalanadi.
// ═══════════════════════════════════════════════════════════════════════

// ─── Enumlar ─────────────────────────────────────────────────────────────

export type Plan = 'BOSHLANGICH' | 'PROFESSIONAL' | 'KORPORATIV';

export type TenantStatus = 'TRIAL' | 'ACTIVE' | 'SUSPENDED' | 'CANCELLED';

export type UserRole = 'OWNER' | 'MANAGER' | 'ENGINEER';

export type AdminRole = 'SUPERADMIN' | 'SUPPORT';

export type ProjectStatus = 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'ARCHIVED';

export type Currency = 'UZS' | 'USD';

export type EstimateItemType = 'MATERIAL' | 'LABOR' | 'EQUIPMENT';

export type PaymentType = 'PER_M2' | 'PER_M3' | 'PER_METER' | 'PER_UNIT' | 'FIXED' | 'HOURLY';

export type Language = 'uz' | 'ru';

export type EstimateStatus = 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED';

export type InvoiceStatus = 'PAID' | 'PENDING' | 'OVERDUE' | 'CANCELLED';

export type ChatRole = 'user' | 'assistant';

// ─── Asosiy modellar (API javoblari) ────────────────────────────────────

export interface Tenant {
  id: string;
  name: string;
  inn: string | null;
  phone: string | null;
  plan: Plan;
  status: TenantStatus;
  usdRate: number; // 1 USD = X so'm (qo'lda kiritiladigan kurs)
  trialEndsAt: string | null;
  createdAt: string;
}

export interface User {
  id: string;
  tenantId: string;
  fullName: string;
  email: string;
  phone: string | null;
  role: UserRole;
  position: string | null;
  avatarUrl: string | null;
  language: Language;
  createdAt: string;
}

export interface AdminUser {
  id: string;
  email: string;
  fullName: string;
  role: AdminRole;
  createdAt: string;
}

export interface Project {
  id: string;
  tenantId: string;
  code: string;
  title: string;
  clientName: string;
  category: string;
  value: number;
  currency: Currency;
  deadline: string | null;
  progress: number;
  status: ProjectStatus;
  managerId: string | null;
  manager?: Pick<User, 'id' | 'fullName' | 'avatarUrl'> | null;
  createdAt: string;
}

export interface Material {
  id: string;
  name: string;
  category: string;
  provider: string | null;
  unit: string;
  priceUzs: number;
  priceUsd: number;
  stock: number;
  rating: number;
  imageUrl: string | null;
  tenantId: string | null; // null = global katalog
  createdAt: string;
}

export interface EstimateItem {
  id: string;
  estimateId: string;
  materialId: string | null;
  name: string;
  type: EstimateItemType;
  paymentType: PaymentType | null;
  qty: number;
  unit: string;
  unitPrice: number;
  lineTotal: number;
}

export interface EstimateStage {
  id: string;
  estimateId: string;
  label: string;
  date: string | null;
  amount: number;
  currency: Currency;
  order: number;
}

export interface Estimate {
  id: string;
  tenantId: string;
  projectId: string | null;
  title: string;
  currency: Currency;
  taxRate: number;
  subtotal: number;
  taxAmount: number;
  total: number;
  status: EstimateStatus;
  items: EstimateItem[];
  stages: EstimateStage[];
  createdAt: string;
}

export interface Activity {
  id: string;
  tenantId: string;
  userId: string | null;
  user?: Pick<User, 'id' | 'fullName' | 'avatarUrl'> | null;
  action: string;
  projectName: string | null;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  sessionId: string;
  role: ChatRole;
  content: string;
  createdAt: string;
}

export interface Invoice {
  id: string;
  tenantId: string;
  tenant?: Pick<Tenant, 'id' | 'name'> | null;
  amount: number;
  currency: Currency;
  period: string;
  status: InvoiceStatus;
  issuedAt: string;
  paidAt: string | null;
}

// ─── Auth ────────────────────────────────────────────────────────────────

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  fullName: string;
  email: string;
  password: string;
  companyName: string;
  phone?: string;
}

export interface AuthResponse {
  user: User;
  tenant: Tenant;
  tokens: AuthTokens;
}

export interface AdminAuthResponse {
  admin: AdminUser;
  tokens: AuthTokens;
}

// ─── Dashboard / Reports agregatlari ─────────────────────────────────────

export interface DashboardStats {
  totalExpenses: number;
  pendingEstimates: number;
  pendingApproval: number;
  workersCount: number;
  activeObjects: number;
  productivity: number;
  budgetTrend: number[]; // 12 oylik
}

export interface DashboardData {
  stats: DashboardStats;
  activeProjects: Project[];
  recentActivity: Activity[];
  aiRecommendation: string;
}

export interface ReportSummary {
  totalExpense: number;
  materialCost: number;
  laborCost: number;
  netProfit: number;
  trends: { totalExpense: number; materialCost: number; laborCost: number; netProfit: number };
  resourceUsage: { label: string; percentage: number }[];
  costDynamics: { month: string; actual: number; planned: number }[];
  pnl: { category: string; revenue: number; expense: number; profit: number; status: string }[];
}

// ─── Admin agregatlari ───────────────────────────────────────────────────

export interface AdminStats {
  totalTenants: number;
  activeTenants: number;
  trialTenants: number;
  suspendedTenants: number;
  totalUsers: number;
  totalProjects: number;
  mrr: number; // oylik takrorlanuvchi daromad (UZS)
  planBreakdown: { plan: Plan; count: number }[];
  signupsTrend: { month: string; count: number }[];
  recentTenants: Tenant[];
}

// ─── Umumiy ──────────────────────────────────────────────────────────────

export interface Paginated<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ApiError {
  error: string;
  message: string;
  details?: unknown;
}

// ─── Konstantalar ─────────────────────────────────────────────────────────

export const PLAN_LABELS: Record<Plan, string> = {
  BOSHLANGICH: "Boshlang'ich",
  PROFESSIONAL: 'Professional',
  KORPORATIV: 'Korporativ',
};

export const PLAN_PRICES: Record<Plan, number> = {
  BOSHLANGICH: 199000,
  PROFESSIONAL: 499000,
  KORPORATIV: 0, // bog'laning
};

export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  PLANNED: 'Rejalashtirilgan',
  IN_PROGRESS: 'Jarayonda',
  COMPLETED: 'Yakunlangan',
  ARCHIVED: 'Arxivlangan',
};

export const TENANT_STATUS_LABELS: Record<TenantStatus, string> = {
  TRIAL: 'Sinov',
  ACTIVE: 'Faol',
  SUSPENDED: "To'xtatilgan",
  CANCELLED: 'Bekor qilingan',
};

export const INVOICE_STATUS_LABELS: Record<InvoiceStatus, string> = {
  PAID: "To'langan",
  PENDING: 'Kutilmoqda',
  OVERDUE: 'Muddati o\'tgan',
  CANCELLED: 'Bekor qilingan',
};

// ─── Dizayn tokenlari (brend ranglari) ───────────────────────────────────

export const COLORS = {
  bg: '#16181D',
  panel: '#191B1F',
  primary: '#5555E7',
  accent: '#FF6B1A',
  accentAlt: '#F97316',
  cyan: '#22D3EE',
  cyanBright: '#3DF2FF',
  cyanDeep: '#06B6D4',
  border: '#343841',
  muted: '#BCC0C7',
  danger: '#E11919',
  success: '#26D926',
} as const;
