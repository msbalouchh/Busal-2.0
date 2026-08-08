import type { TenantHealthStatus, TenantLifecycleStatus } from "@prisma/client";

import type {
  TenantActivityView,
  TenantAuditLogView,
  TenantHealthView,
} from "@/modules/tenant-platform/types/tenant-platform-types";

export interface ControlCenterBusinessPermissions {
  canView: boolean;
  canEdit: boolean;
  canSuspend: boolean;
  canDelete: boolean;
  canTransfer: boolean;
  canExport: boolean;
}

export interface ControlCenterBusinessDirectoryQuery {
  search?: string;
  status?: TenantLifecycleStatus | null;
  healthStatus?: TenantHealthStatus | null;
  subscriptionPlan?: string | null;
  businessType?: string | null;
  country?: string | null;
  industry?: string | null;
  sortBy?:
    | "createdAt"
    | "businessName"
    | "lastActivity"
    | "branchCount"
    | "staffCount"
    | "status";
  sortDirection?: "asc" | "desc";
  page?: number;
  pageSize?: number;
}

export interface ControlCenterBusinessStatistics {
  totalBusinesses: number;
  activeBusinesses: number;
  suspendedBusinesses: number;
  archivedBusinesses: number;
  totalBranches: number;
  totalStaff: number;
  totalMrrPence: number;
}

export interface ControlCenterBusinessDirectoryItem {
  id: string;
  businessId: string;
  businessName: string;
  businessCode: string | null;
  businessType: string | null;
  industry: string | null;
  country: string | null;
  ownerName: string | null;
  ownerEmail: string;
  status: TenantLifecycleStatus;
  healthStatus: TenantHealthStatus;
  branchCount: number;
  staffCount: number;
  subscriptionPlan: string | null;
  subscriptionStatus: string;
  mrrPence: number;
  aiTokensThisMonth: number;
  storageUsedBytes: string;
  revenuePence: number;
  lastActivityAt: string | null;
  createdAt: string;
}

export interface ControlCenterBusinessDirectoryResult {
  items: ControlCenterBusinessDirectoryItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  statistics: ControlCenterBusinessStatistics;
}

export interface ControlCenterBusinessOwnerInfo {
  id: string;
  fullName: string | null;
  email: string;
}

export interface ControlCenterBusinessBranchSummary {
  id: string;
  name: string;
  city: string | null;
  country: string | null;
  isMain: boolean;
  isActive: boolean;
  staffCount: number;
}

export interface ControlCenterBusinessInvoiceSummary {
  id: string;
  invoiceNumber: string;
  status: string;
  totalPence: number;
  amountPaidPence: number;
  dueAt: string | null;
  paidAt: string | null;
}

export interface ControlCenterBusinessPaymentSummary {
  id: string;
  amountPence: number;
  status: string;
  method: string;
  createdAt: string;
  reference: string | null;
}

export interface ControlCenterBusinessRevenueSummary {
  totalRevenuePence: number;
  paidInvoicesPence: number;
  outstandingPence: number;
  mrrPence: number;
}

export interface ControlCenterBusinessAiUsageSummary {
  aiTokensThisMonth: number;
  aiToolExecutions: number;
  aiAgentExecutions: number;
  maxAiTokensPerMonth: number | null;
}

export interface ControlCenterBusinessStorageSummary {
  storageUsedBytes: string;
  maxStorageBytes: string | null;
  fileCount: number;
  usagePercent: number;
}

export interface ControlCenterBusinessFeatureAccess {
  assignedFeatures: string[];
  enabledModules: string[];
  activeFeatureFlags: number;
}

export interface ControlCenterBusinessProfile {
  businessId: string;
  businessName: string | null;
  businessCode: string | null;
  businessType: string | null;
  industry: string | null;
  country: string | null;
  timezone: string | null;
  currency: string | null;
  phone: string | null;
  businessEmail: string | null;
  onboardingCompleted: boolean;
  createdAt: string;
  updatedAt: string;
  owner: ControlCenterBusinessOwnerInfo;
  status: TenantLifecycleStatus;
  healthStatus: TenantHealthStatus;
  subscriptionPlan: string | null;
  subscriptionStatus: string;
  branchCount: number;
  staffCount: number;
  branches: ControlCenterBusinessBranchSummary[];
  invoices: ControlCenterBusinessInvoiceSummary[];
  payments: ControlCenterBusinessPaymentSummary[];
  revenue: ControlCenterBusinessRevenueSummary;
  aiUsage: ControlCenterBusinessAiUsageSummary;
  storage: ControlCenterBusinessStorageSummary;
  featureAccess: ControlCenterBusinessFeatureAccess;
  health: TenantHealthView | null;
  activities: TenantActivityView[];
  auditLogs: TenantAuditLogView[];
  lastActivityAt: string | null;
}

export interface ControlCenterBusinessManagementBundle {
  directory: ControlCenterBusinessDirectoryResult;
  permissions: ControlCenterBusinessPermissions;
}

export interface ControlCenterBusinessDetailBundle {
  profile: ControlCenterBusinessProfile;
  permissions: ControlCenterBusinessPermissions;
}

export interface UpdateControlCenterBusinessInput {
  businessId: string;
  businessName?: string;
  businessType?: string;
  industry?: string;
  country?: string;
  timezone?: string;
  currency?: string;
  phone?: string;
  businessEmail?: string;
}

export interface TransferControlCenterBusinessOwnershipInput {
  businessId: string;
  newOwnerId: string;
}

export interface ControlCenterBusinessBulkActionInput {
  businessIds: string[];
  action: "suspend" | "activate" | "archive";
}

export interface ControlCenterBusinessBulkActionResult {
  succeeded: string[];
  failed: Array<{ businessId: string; error: string }>;
}
