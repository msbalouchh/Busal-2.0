import type { SubscriptionPlanDefinition } from "@/modules/control-center/billing/registry/subscription-plan-registry";
import type { PromotionDefinition } from "@/modules/control-center/billing/registry/promotion-registry";

export interface ControlCenterBillingPermissions {
  canViewBilling: boolean;
  canManagePlans: boolean;
  canManageInvoices: boolean;
  canManagePayments: boolean;
  canManageRefunds: boolean;
  canManagePromotions: boolean;
  canViewAnalytics: boolean;
  canManageSubscriptions: boolean;
}

export interface ControlCenterBillingDashboardWidgets {
  totalSubscribers: number;
  activePlans: number;
  trialAccounts: number;
  expiringSubscriptions: number;
  cancelledPlans: number;
  mrrPence: number;
  arrPence: number;
  revenueGrowthPct: number;
  churnRatePct: number;
}

export interface ControlCenterPaymentItem {
  id: string;
  businessId: string;
  businessName: string;
  amountPence: number;
  status: string;
  method: string;
  createdAt: string;
  reference: string | null;
}

export interface ControlCenterInvoiceItem {
  id: string;
  businessId: string;
  businessName: string;
  invoiceNumber: string;
  status: string;
  totalPence: number;
  amountPaidPence: number;
  dueAt: string | null;
  paidAt: string | null;
}

export interface ControlCenterSubscriptionDirectoryItem {
  id: string;
  businessId: string;
  businessName: string;
  ownerEmail: string;
  subscriptionPlan: string | null;
  subscriptionStatus: string;
  billingCycle: string;
  renewalDate: string | null;
  trialStatus: string;
  paymentStatus: string;
  mrrPence: number;
  createdAt: string;
  usageSummary: {
    activeUsers: number;
    storageUsedBytes: string;
    apiCallsThisMonth: number;
    aiTokensThisMonth: number;
    marketplaceLicenses: number;
  } | null;
}

export interface ControlCenterSubscriptionDirectoryQuery {
  search?: string;
  subscriptionPlan?: string | null;
  subscriptionStatus?: string | null;
  sortBy?: "createdAt" | "businessName" | "mrr";
  page?: number;
  pageSize?: number;
}

export interface ControlCenterSubscriptionDirectoryResult {
  items: ControlCenterSubscriptionDirectoryItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ControlCenterUsageSummary {
  businessId: string;
  businessName: string;
  storageUsedBytes: string;
  aiTokensThisMonth: number;
  apiCallsThisMonth: number;
  activeUsers: number;
  branchCount: number;
  marketplaceLicenses: number;
}

export interface ControlCenterRevenueAnalytics {
  revenueTrends: Array<{ month: string; mrrPence: number }>;
  subscriptionGrowth: Array<{ month: string; subscribers: number }>;
  churnAnalysis: { churnRatePct: number; cancelledCount: number; activeCount: number };
  paymentSuccessRatePct: number;
  topCustomers: Array<{ businessId: string; businessName: string; mrrPence: number }>;
  planDistribution: Array<{ plan: string; count: number; mrrPence: number }>;
}

export interface ControlCenterBillingManagementBundle {
  widgets: ControlCenterBillingDashboardWidgets;
  permissions: ControlCenterBillingPermissions;
  recentPayments: ControlCenterPaymentItem[];
  outstandingInvoices: ControlCenterInvoiceItem[];
  failedPayments: ControlCenterPaymentItem[];
  plans: SubscriptionPlanDefinition[];
  promotions: PromotionDefinition[];
  directory: ControlCenterSubscriptionDirectoryResult;
  usageSummaries: ControlCenterUsageSummary[];
  analytics: ControlCenterRevenueAnalytics;
}

export interface ControlCenterSubscriptionDetailBundle {
  permissions: ControlCenterBillingPermissions;
  subscription: ControlCenterSubscriptionDirectoryItem;
  invoices: ControlCenterInvoiceItem[];
  payments: ControlCenterPaymentItem[];
  upgradeHistory: Array<{ id: string; title: string; createdAt: string }>;
  downgradeHistory: Array<{ id: string; title: string; createdAt: string }>;
  usage: ControlCenterUsageSummary | null;
  plans: SubscriptionPlanDefinition[];
}

export interface UpsertSubscriptionPlanInput {
  slug: string;
  name: string;
  description: string;
  mrrPence: number;
  billingCycle: "monthly" | "annual";
  features: string[];
  limits: SubscriptionPlanDefinition["limits"];
  marketplaceAccess: boolean;
}

export interface UpsertPromotionInput {
  code: string;
  name: string;
  description: string;
  discountPercent: number;
  planSlug: string | null;
  trialExtensionDays: number;
  active: boolean;
}

export interface AssignSubscriptionPlanInput {
  businessId: string;
  subscriptionPlan: string;
  subscriptionStatus?: string;
  applyLimits?: boolean;
}
