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

// Buyurtma oqimi: NEW -> ACCEPTED -> PREPARING -> IN_TRANSIT -> DELIVERED (+ CANCELLED).
// PENDING_PAYMENT/PAID — kelajakdagi to'lov integratsiyasi uchun.
export type OrderStatus =
  | 'NEW'
  | 'ACCEPTED'
  | 'PREPARING'
  | 'IN_TRANSIT'
  | 'PENDING_PAYMENT'
  | 'PAID'
  | 'DELIVERED'
  | 'CANCELLED';

export type NotificationType = 'NEW_ORDER' | 'ORDER_STATUS' | 'MESSAGE';

export type VendorStatus = 'ACTIVE' | 'BLOCKED';

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
  totpEnabled?: boolean;
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
  totalUnits: number;
  purchasePrice: number;
  address: string | null;
  description: string | null;
  startDate: string | null;
  manager?: Pick<User, 'id' | 'fullName' | 'avatarUrl'> | null;
  createdAt: string;
  updatedAt?: string;
}

// GET /api/projects/:id/summary — hisoblangan KPI'lar (T2)
export interface ProjectSummary {
  projectId: string;
  currency: 'UZS';
  budget: number;
  totalEstimates: number;
  estimatesCount: number;
  totalExpenses: number;
  totalIncome: number;
  netProfit: number;
  budgetUsedPercent: number | null; // budjet 0 bo'lsa null
}

// GET /api/projects/summaries — ro'yxat kartalari uchun jamlar
export type ProjectSummaries = Record<string, { spent: number; income: number; estimatesCount: number }>;

export interface ProjectFinance {
  projectId: string;
  title: string;
  currency: 'UZS';
  rate: number;
  totalUnits: number;
  soldUnits: number;
  purchasePrice: number;
  salesTotal: number;
  incoming: number;
  remaining: number;
  expenses: number;
  profit: number;
}

export interface Material {
  id: string;
  name: string;
  category: string;
  provider: string | null;
  description: string | null;
  unit: string;
  priceUzs: number;
  priceUsd: number;
  stock: number;
  rating: number;
  imageUrl: string | null;
  tenantId: string | null; // null = global katalog
  vendorId: string | null;
  isActive: boolean;
  vendor?: { id: string; name: string; shopName: string | null };
  createdAt: string;
}

export interface Vendor {
  id: string;
  name: string;
  phone: string | null;
  login: string;
  shopName: string | null;
  logoUrl: string | null;
  status: VendorStatus;
  mustChangePassword: boolean;
  productCount?: number;
  createdAt: string;
}

export interface OrderItem {
  id: string;
  orderId: string;
  materialId: string | null;
  name: string;
  unit: string;
  unitPrice: number;
  qty: number;
  lineTotal: number;
}

export interface Order {
  id: string;
  no: number; // inson o'qiydigan raqam: "#123"
  tenantId: string;
  userId: string | null; // buyurtmani bergan foydalanuvchi
  projectId: string | null; // xarajat qaysi loyihaga (binoga) yozilgan; null = umumiy
  customerName: string;
  customerPhone: string;
  address: string | null;
  note: string | null;
  currency: Currency;
  total: number;
  status: OrderStatus;
  items: OrderItem[];
  createdAt: string;
}

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  data: { orderNo?: number; status?: OrderStatus; from?: string } | null;
  orderId: string | null;
  isRead: boolean;
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
  totalExpenses: number; // smetalar (kalkulyator formulasi) + umumiy harajatlar, UZS
  pendingEstimates: number;
  pendingApproval: number;
  teamCount: number; // tenant jamoasi (real; eski fake workersCount o'rniga)
  activeObjects: number;
  productivity: number;
  budgetTrend: number[]; // 12 oylik REAL xarajat dinamikasi
}

export interface DashboardData {
  stats: DashboardStats;
  activeProjects: Project[];
  recentActivity: Activity[];
  aiRecommendation: string;
}

// Trend: joriy davr vs o'tgan teng davr (%). O'tgan davr ma'lumoti bo'lmasa null —
// frontend badge'ni umuman ko'rsatmaydi (fake foiz taqiqlangan).
export interface FinanceTrends {
  totalExpense: number | null;
  materialCost: number | null;
  laborCost: number | null;
  netProfit: number | null;
  incoming?: number | null;
}

// ─── Vazifa 3: xarajat kategoriyasi, daromad, byudjet rejasi ─────────────

export type ExpenseCategory = 'MATERIAL' | 'LABOR' | 'EQUIPMENT' | 'GENERAL';

export interface ExpenseItem {
  id: number;
  projectId: string | null;
  label: string;
  amount: number;
  currency: string;
  category: ExpenseCategory;
  spentAt: string | null;
  note: string | null;
  orderId: string | null; // buyurtmadan avtomatik yozilgan bo'lsa
  createdAt: string;
}

export interface Income {
  id: string;
  projectId: string | null;
  amount: number;
  currency: Currency;
  date: string;
  description: string | null;
  createdAt: string;
}

export interface BudgetPlan {
  id: string;
  projectId: string | null;
  category: ExpenseCategory;
  plannedAmount: number;
  currency: Currency;
  period: string; // 'YYYY-MM'
}

// Reja vs Fakt jadvali qatori (hammasi UZS'ga normallashtirilgan)
export interface PlanFaktRow {
  category: ExpenseCategory;
  planned: number;
  fakt: number;
  diff: number; // fakt - planned
  planId: string | null; // rejani o'chirish/tahrirlash uchun
}

// GET /api/reports/summary javobi
export interface ReportsSummary {
  currency: 'UZS';
  from: string;
  to: string;
  period: string; // 'YYYY-MM'
  projectId: string | null;
  totalExpense: number;
  materialCost: number;
  laborCost: number;
  generalCost: number;
  incoming: number;
  netProfit: number;
  trends: FinanceTrends;
  planFakt: PlanFaktRow[];
  resourceUsage: { label: string; percentage: number }[];
  costDynamics: { ym: string; actual: number; planned: number }[];
}

// P&L kategoriya kaliti — frontendda i18n bilan tarjima qilinadi
export type PnlKey = 'materials' | 'labor' | 'equipment' | 'general' | 'sales';
export type PnlStatus = 'ok' | 'warn' | 'good';

export interface ReportSummary {
  totalExpense: number;
  materialCost: number;
  laborCost: number;
  netProfit: number; // real: kelgan pullar - umumiy xarajat
  incoming: number;
  trends: FinanceTrends;
  resourceUsage: { label: string; percentage: number }[];
  costDynamics: { ym: string; actual: number; planned: number }[]; // ym: '2026-07'
  pnl: { key: PnlKey; revenue: number; expense: number; profit: number; status: PnlStatus }[];
  currency: 'UZS';
}

// GET /api/dashboard/stats javobi — finance.ts agregatlari
export interface TenantFinanceStats {
  materialCost: number;
  laborCost: number;
  equipmentCost: number;
  taxAmount: number;
  estimatesTotal: number;
  orderExpenses: number; // buyurtmadan avto yozuvlar (Vazifa 5)
  manualExpenses: number;
  generalExpensesTotal: number;
  totalExpense: number;
  incoming: number;
  netProfit: number;
  estimatesCount: number;
  pendingEstimates: number;
  trends: FinanceTrends;
  currency: 'UZS';
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
