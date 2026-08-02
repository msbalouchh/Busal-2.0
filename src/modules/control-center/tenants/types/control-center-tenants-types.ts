import type {
  TenantHealthStatus,
  TenantLifecycleStatus,
  TenantMaintenanceMode,
} from "@prisma/client";

import type {
  ResourceLimitView,
  ResourceUsageView,
  TenantActivityView,
  TenantAnalyticsView,
  TenantAuditLogView,
  TenantHealthView,
  TenantPolicyView,
  TenantRecordView,
  TenantSettingsView,
} from "@/modules/tenant-platform/types/tenant-platform-types";

export interface ControlCenterTenantPermissions {
  canView: boolean;
  canEdit: boolean;
  canSuspend: boolean;
  canDelete: boolean;
  canManagePolicies: boolean;
  canManageResources: boolean;
  canMaintenance: boolean;
  canViewAnalytics: boolean;
}

export interface ControlCenterTenantDirectoryQuery {
  search?: string;
  lifecycleStatus?: TenantLifecycleStatus | null;
  healthStatus?: TenantHealthStatus | null;
  subscriptionPlan?: string | null;
  country?: string | null;
  businessType?: string | null;
  sortBy?: "createdAt" | "businessName" | "lastActivity" | "lifecycleStatus";
  sortDirection?: "asc" | "desc";
  page?: number;
  pageSize?: number;
}

export interface ControlCenterTenantDirectoryItem {
  id: string;
  businessId: string;
  tenantId: string;
  businessName: string;
  ownerName: string | null;
  ownerEmail: string;
  lifecycleStatus: TenantLifecycleStatus;
  healthStatus: TenantHealthStatus;
  subscriptionPlan: string | null;
  subscriptionStatus: string;
  country: string | null;
  businessType: string | null;
  timezone: string | null;
  branchCount: number;
  userCount: number;
  createdAt: string;
  lastActivityAt: string | null;
}

export interface ControlCenterTenantDirectoryResult {
  items: ControlCenterTenantDirectoryItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ControlCenterTenantBranchSummary {
  id: string;
  name: string;
  city: string | null;
  country: string | null;
  isMain: boolean;
  isActive: boolean;
  staffCount: number;
  managerCount: number;
}

export interface ControlCenterTenantOwnerInfo {
  id: string;
  fullName: string | null;
  email: string;
}

export interface ControlCenterTenantProfile {
  businessId: string;
  tenantId: string;
  businessName: string | null;
  businessType: string | null;
  country: string | null;
  timezone: string | null;
  onboardingCompleted: boolean;
  createdAt: string;
  owner: ControlCenterTenantOwnerInfo;
  tenant: TenantRecordView;
  settings: TenantSettingsView | null;
  limits: ResourceLimitView | null;
  usage: ResourceUsageView | null;
  policies: TenantPolicyView[];
  branches: ControlCenterTenantBranchSummary[];
  analytics: TenantAnalyticsView | null;
  health: TenantHealthView | null;
  activities: TenantActivityView[];
  auditLogs: TenantAuditLogView[];
  activeSessions: number;
  maintenanceMode: TenantMaintenanceMode;
  scheduledMaintenanceAt: string | null;
}

export interface ControlCenterTenantManagementBundle {
  directory: ControlCenterTenantDirectoryResult;
  permissions: ControlCenterTenantPermissions;
}

export interface ControlCenterTenantDetailBundle {
  profile: ControlCenterTenantProfile;
  permissions: ControlCenterTenantPermissions;
}

export interface CreateControlCenterTenantInput {
  ownerId: string;
  businessName: string;
  subscriptionPlan?: string;
  country?: string;
  timezone?: string;
}

export interface ControlCenterTenantMaintenanceInput {
  businessId: string;
  mode: TenantMaintenanceMode;
  scheduledAt?: string | null;
}

export interface ControlCenterTenantResourceLimitsInput {
  businessId: string;
  maxUsers?: number;
  maxBranches?: number;
  maxStorageBytes?: number;
  maxApiCallsPerMonth?: number;
  maxAiTokensPerMonth?: number;
  maxDatabaseRows?: number;
  maxMarketplaceLicenses?: number;
}
