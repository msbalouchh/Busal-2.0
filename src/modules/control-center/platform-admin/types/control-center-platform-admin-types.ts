import type {
  ConfigEnvironment,
  ConfigScope,
  FeatureFlagStatus,
  FeatureFlagType,
  TenantMaintenanceMode,
} from "@prisma/client";

export type PlatformAdminView =
  | "overview"
  | "settings"
  | "feature-flags"
  | "releases"
  | "environments"
  | "maintenance"
  | "administration"
  | "staff"
  | "audit"
  | "analytics";

export interface ControlCenterPlatformAdminPermissions {
  canViewSettings: boolean;
  canManageSettings: boolean;
  canViewFeatureFlags: boolean;
  canManageFeatureFlags: boolean;
  canViewReleases: boolean;
  canManageReleases: boolean;
  canViewMaintenance: boolean;
  canManageMaintenance: boolean;
  canViewStaff: boolean;
  canManageStaff: boolean;
  canViewAudit: boolean;
  canViewAnalytics: boolean;
}

export interface ControlCenterPlatformAdminWidgets {
  activeFeatureFlags: number;
  scheduledReleases: number;
  platformMaintenanceMode: TenantMaintenanceMode | "NONE";
  activeTenants: number;
  activeUsers: number;
  platformRevenuePence: number;
  aiTokensUsed: number;
  apiRequests: number;
  marketplaceInstalls: number;
  systemHealthPct: number;
}

export interface ControlCenterPlatformSettingItem {
  key: string;
  label: string;
  category: string;
  valueType: string;
  scope: ConfigScope;
  environment: ConfigEnvironment;
  value: unknown;
  defaultValue: unknown;
  helpText: string | null;
  allowedValues: unknown[] | null;
  updatedAt: string | null;
}

export interface ControlCenterFeatureFlagItem {
  id: string;
  key: string;
  name: string;
  module: string;
  flagType: FeatureFlagType;
  status: FeatureFlagStatus;
  defaultEnabled: boolean;
  rolloutPercentage: number;
  businessId: string | null;
  businessName: string | null;
  scheduledActivateAt: string | null;
  scheduledDeactivateAt: string | null;
  targetCount: number;
  updatedAt: string;
}

export interface ControlCenterFeatureFlagQuery {
  search?: string;
  status?: FeatureFlagStatus | null;
  page?: number;
  pageSize?: number;
}

export interface ControlCenterFeatureFlagDirectoryResult {
  items: ControlCenterFeatureFlagItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ControlCenterReleaseItem {
  id: string;
  version: string;
  releaseNotes: string;
  environment: string;
  rolloutStatus: string;
  scheduledAt: string | null;
  deployedAt: string | null;
  rollbackOf: string | null;
  createdAt: string;
  createdBy: string | null;
}

export interface ControlCenterReleaseQuery {
  search?: string;
  environment?: string | null;
  status?: string | null;
  page?: number;
  pageSize?: number;
}

export interface ControlCenterReleaseDirectoryResult {
  items: ControlCenterReleaseItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ControlCenterEnvironmentItem {
  key: string;
  label: string;
  status: "healthy" | "degraded" | "down";
  version: string;
  healthScore: number;
  lastDeploymentAt: string | null;
  deploymentCount: number;
}

export interface ControlCenterPlatformModuleItem {
  key: string;
  name: string;
  category: string;
  enabled: boolean;
  description: string;
}

export interface ControlCenterMaintenanceWindowItem {
  id: string;
  mode: TenantMaintenanceMode;
  businessId: string | null;
  businessName: string | null;
  scheduledAt: string | null;
  scope: "platform" | "tenant";
  message: string | null;
  createdAt: string;
}

export interface ControlCenterPlatformStaffItem {
  id: string;
  email: string;
  fullName: string;
  role: string;
  team: string;
  accessLevel: string;
  mfaEnabled: boolean;
  activeSessions: number;
  lastSeenAt: string | null;
  isOperator: boolean;
}

export interface ControlCenterPlatformAuditItem {
  id: string;
  category: string;
  eventType: string;
  summary: string;
  actorEmail: string | null;
  createdAt: string;
  metadata: Record<string, unknown> | null;
}

export interface ControlCenterPlatformAuditQuery {
  search?: string;
  category?: string | null;
  page?: number;
  pageSize?: number;
}

export interface ControlCenterPlatformAuditDirectoryResult {
  items: ControlCenterPlatformAuditItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ControlCenterPlatformAnalytics {
  tenantGrowth: Array<{ day: string; count: number }>;
  revenueTrend: Array<{ day: string; amountPence: number }>;
  aiUsageTrend: Array<{ day: string; tokens: number }>;
  apiUsageTrend: Array<{ day: string; requests: number }>;
  marketplaceGrowth: Array<{ day: string; installs: number }>;
  slaPerformancePct: number;
  agentPerformance: Array<{ agent: string; resolved: number }>;
}

export interface ControlCenterPlatformAdminManagementBundle {
  permissions: ControlCenterPlatformAdminPermissions;
  widgets: ControlCenterPlatformAdminWidgets;
  settings: ControlCenterPlatformSettingItem[];
  featureFlags: ControlCenterFeatureFlagDirectoryResult;
  releases: ControlCenterReleaseDirectoryResult;
  environments: ControlCenterEnvironmentItem[];
  modules: ControlCenterPlatformModuleItem[];
  maintenanceWindows: ControlCenterMaintenanceWindowItem[];
  staff: ControlCenterPlatformStaffItem[];
  audit: ControlCenterPlatformAuditDirectoryResult;
  analytics: ControlCenterPlatformAnalytics;
  refreshedAt: string;
}

export interface UpdateControlCenterPlatformSettingInput {
  key: string;
  value: unknown;
  scope?: ConfigScope;
  environment?: ConfigEnvironment;
  changeReason?: string;
}

export interface CreateControlCenterFeatureFlagInput {
  key: string;
  name: string;
  module: string;
  flagType: FeatureFlagType;
  defaultEnabled?: boolean;
  rolloutPercentage?: number;
  description?: string;
  scheduledActivateAt?: Date | null;
  scheduledDeactivateAt?: Date | null;
}

export interface UpdateControlCenterFeatureFlagInput {
  status?: FeatureFlagStatus;
  defaultEnabled?: boolean;
  rolloutPercentage?: number;
  scheduledActivateAt?: Date | null;
  scheduledDeactivateAt?: Date | null;
  changeReason?: string;
}

export interface CreateControlCenterReleaseInput {
  version: string;
  releaseNotes: string;
  environment: string;
  scheduledAt?: Date | null;
}

export interface ScheduleControlCenterMaintenanceInput {
  mode: TenantMaintenanceMode;
  message?: string;
  scheduledAt?: Date | null;
  scope?: "platform" | "tenant";
  businessId?: string;
}
