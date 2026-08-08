import type { TenantHealthStatus, TenantLifecycleStatus } from "@prisma/client";

import type { WorkspaceStatus } from "@/modules/tenant/types/status";
import type {
  TenantActivityView,
  TenantAuditLogView,
  TenantHealthView,
} from "@/modules/tenant-platform/types/tenant-platform-types";

export interface ControlCenterWorkspacePermissions {
  canView: boolean;
  canEdit: boolean;
  canSuspend: boolean;
  canDelete: boolean;
  canTransfer: boolean;
  canExport: boolean;
}

export interface ControlCenterWorkspaceDirectoryQuery {
  search?: string;
  status?: WorkspaceStatus | null;
  lifecycleStatus?: TenantLifecycleStatus | null;
  healthStatus?: TenantHealthStatus | null;
  subscriptionPlan?: string | null;
  country?: string | null;
  industry?: string | null;
  sortBy?:
    | "createdAt"
    | "workspaceName"
    | "lastActivity"
    | "branchCount"
    | "userCount"
    | "status";
  sortDirection?: "asc" | "desc";
  page?: number;
  pageSize?: number;
}

export interface ControlCenterWorkspaceStatistics {
  totalWorkspaces: number;
  activeWorkspaces: number;
  provisioningWorkspaces: number;
  archivedWorkspaces: number;
  totalBusinesses: number;
  totalBranches: number;
  totalUsers: number;
  totalMrrPence: number;
}

export interface ControlCenterWorkspaceDirectoryItem {
  id: string;
  workspaceId: string;
  businessId: string;
  tenantId: string;
  organizationId: string;
  workspaceName: string;
  businessName: string;
  slug: string;
  industry: string | null;
  country: string | null;
  ownerName: string | null;
  ownerEmail: string;
  status: WorkspaceStatus;
  lifecycleStatus: TenantLifecycleStatus;
  healthStatus: TenantHealthStatus;
  branchCount: number;
  userCount: number;
  businessCount: number;
  subscriptionPlan: string | null;
  subscriptionStatus: string;
  mrrPence: number;
  aiTokensThisMonth: number;
  storageUsedBytes: string;
  activityCount: number;
  lastActivityAt: string | null;
  createdAt: string;
}

export interface ControlCenterWorkspaceDirectoryResult {
  items: ControlCenterWorkspaceDirectoryItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  statistics: ControlCenterWorkspaceStatistics;
}

export interface ControlCenterWorkspaceOwnerInfo {
  id: string;
  fullName: string | null;
  email: string;
}

export interface ControlCenterWorkspaceBusinessSummary {
  id: string;
  name: string;
  industry: string | null;
  status: string;
  branchCount: number;
}

export interface ControlCenterWorkspaceBranchSummary {
  id: string;
  name: string;
  city: string | null;
  country: string | null;
  isMain: boolean;
  isActive: boolean;
  staffCount: number;
}

export interface ControlCenterWorkspaceUserSummary {
  id: string;
  fullName: string;
  email: string;
  role: string;
  status: string;
}

export interface ControlCenterWorkspaceSubscriptionSummary {
  plan: string | null;
  status: string;
  mrrPence: number;
}

export interface ControlCenterWorkspaceUsageSummary {
  storageUsedBytes: string;
  maxStorageBytes: string | null;
  aiTokensThisMonth: number;
  maxAiTokensPerMonth: number | null;
  activeUsers: number;
}

export interface ControlCenterWorkspaceProfile {
  workspaceId: string;
  businessId: string;
  tenantId: string;
  organizationId: string;
  workspaceName: string;
  slug: string;
  industry: string | null;
  country: string | null;
  timezone: string | null;
  currency: string | null;
  status: WorkspaceStatus;
  lifecycleStatus: TenantLifecycleStatus;
  healthStatus: TenantHealthStatus;
  createdAt: string;
  updatedAt: string;
  owner: ControlCenterWorkspaceOwnerInfo;
  businesses: ControlCenterWorkspaceBusinessSummary[];
  branches: ControlCenterWorkspaceBranchSummary[];
  users: ControlCenterWorkspaceUserSummary[];
  subscription: ControlCenterWorkspaceSubscriptionSummary;
  usage: ControlCenterWorkspaceUsageSummary;
  health: TenantHealthView | null;
  activities: TenantActivityView[];
  auditLogs: TenantAuditLogView[];
  lastActivityAt: string | null;
}

export interface ControlCenterWorkspaceManagementBundle {
  directory: ControlCenterWorkspaceDirectoryResult;
  permissions: ControlCenterWorkspacePermissions;
}

export interface ControlCenterWorkspaceDetailBundle {
  profile: ControlCenterWorkspaceProfile;
  permissions: ControlCenterWorkspacePermissions;
}

export interface UpdateControlCenterWorkspaceInput {
  workspaceId: string;
  workspaceName?: string;
  industry?: string;
  country?: string;
  timezone?: string;
  currency?: string;
}

export interface TransferControlCenterWorkspaceOwnershipInput {
  workspaceId: string;
  newOwnerId: string;
}

export interface ControlCenterWorkspaceBulkActionInput {
  workspaceIds: string[];
  action: "suspend" | "activate" | "archive";
}

export interface ControlCenterWorkspaceBulkActionResult {
  succeeded: string[];
  failed: Array<{ workspaceId: string; error: string }>;
}
