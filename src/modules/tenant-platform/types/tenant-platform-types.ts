import type {
  TenantAuditEventType,
  TenantHealthStatus,
  TenantLifecycleStatus,
  TenantMaintenanceMode,
} from "@prisma/client";

export interface RegisteredTenantPolicyDefinition {
  policyKey: string;
  name: string;
  module: string;
  description?: string;
  rules: Record<string, unknown>;
  isActive: boolean;
}

export interface CreateTenantInput {
  ownerId: string;
  businessName: string;
  subscriptionPlan?: string;
  country?: string;
  timezone?: string;
}

export interface TenantProfileInput {
  businessName?: string;
  displayName?: string;
  supportEmail?: string;
  billingEmail?: string;
  country?: string;
  timezone?: string;
}

export interface SubscriptionAssignmentInput {
  subscriptionPlan: string;
  subscriptionStatus?: string;
}

export interface FeatureAssignmentInput {
  features: string[];
}

export interface ResourceLimitInput {
  maxUsers?: number;
  maxBranches?: number;
  maxStorageBytes?: bigint | number;
  maxApiCallsPerMonth?: number;
  maxAiTokensPerMonth?: number;
  maxDatabaseRows?: number;
  maxMarketplaceLicenses?: number;
}

export interface TenantSettingsInput {
  displayName?: string;
  supportEmail?: string;
  billingEmail?: string;
  defaultTimezone?: string;
  defaultLocale?: string;
  complianceMode?: string;
  customSettings?: Record<string, unknown>;
}

export interface ImpersonationInput {
  targetUserId?: string;
  reason: string;
}

export interface TenantPlatformDashboardMetrics {
  lifecycleStatus: TenantLifecycleStatus;
  healthStatus: TenantHealthStatus;
  maintenanceMode: TenantMaintenanceMode;
  scheduledMaintenanceAt: string | null;
  subscriptionPlan: string | null;
  subscriptionStatus: string;
  branchCount: number;
  assignedFeatureCount: number;
  activePolicies: number;
  activeImpersonations: number;
  totalActivityEvents: number;
}

export interface TenantRecordView {
  id: string;
  businessId: string;
  lifecycleStatus: TenantLifecycleStatus;
  healthStatus: TenantHealthStatus;
  subscriptionPlan: string | null;
  subscriptionStatus: string;
  maintenanceMode: TenantMaintenanceMode;
  scheduledMaintenanceAt: string | null;
  branchCount: number;
  suspendedAt: string | null;
  archivedAt: string | null;
}

export interface TenantSettingsView {
  id: string;
  displayName: string | null;
  supportEmail: string | null;
  billingEmail: string | null;
  defaultTimezone: string;
  defaultLocale: string;
  complianceMode: string;
}

export interface ResourceLimitView {
  maxUsers: number;
  maxBranches: number;
  maxStorageBytes: string;
  maxApiCallsPerMonth: number;
  maxAiTokensPerMonth: number;
  maxDatabaseRows: number;
  maxMarketplaceLicenses: number;
}

export interface ResourceUsageView {
  activeUsers: number;
  storageUsedBytes: string;
  apiCallsThisMonth: number;
  aiTokensThisMonth: number;
  databaseRows: number;
  marketplaceLicenses: number;
  fileCount: number;
  workflowCount: number;
  loginActivityCount: number;
  moduleUsage: Record<string, number>;
  lastCalculatedAt: string;
}

export interface TenantPolicyView {
  id: string;
  policyKey: string;
  name: string;
  module: string;
  isActive: boolean;
}

export interface TenantActivityView {
  id: string;
  eventType: string;
  title: string;
  description: string | null;
  createdAt: string;
}

export interface TenantAnalyticsView {
  activeUsers: number;
  storageUsagePct: number;
  apiUsagePct: number;
  aiConsumptionPct: number;
  loginActivityCount: number;
  fileCount: number;
  workflowCount: number;
  moduleUsage: Record<string, number>;
  subscriptionStatus: string;
  healthStatus: TenantHealthStatus;
}

export interface TenantAuditLogView {
  id: string;
  eventType: TenantAuditEventType;
  createdAt: string;
}

export interface TenantHealthView {
  healthStatus: TenantHealthStatus;
  lifecycleStatus: TenantLifecycleStatus;
  maintenanceMode: TenantMaintenanceMode;
  scheduledMaintenanceAt: string | null;
  checks: Array<{ name: string; status: string; message: string }>;
}

export interface ImpersonationSessionView {
  id: string;
  adminUserId: string;
  targetUserId: string | null;
  reason: string;
  isActive: boolean;
  startedAt: string;
  endedAt: string | null;
}
