import type {
  FeatureFlagAuditEventType,
  FeatureFlagStatus,
  FeatureFlagTargetType,
  FeatureFlagType,
} from "@prisma/client";

export type ControlCenterFeatureScope =
  | "global"
  | "plan"
  | "tenant"
  | "business"
  | "workspace";

export type ControlCenterFeatureCategory =
  | "standard"
  | "beta"
  | "experimental"
  | "emergency";

export interface ControlCenterFeatureMetadata {
  scope?: ControlCenterFeatureScope;
  category?: ControlCenterFeatureCategory;
  dependencies?: string[];
  expiresAt?: string | null;
  emergencyDisabled?: boolean;
}

export interface ControlCenterFeatureManagementPermissions {
  canView: boolean;
  canExport: boolean;
  canImport: boolean;
  canEdit: boolean;
  isPlatformOwner: boolean;
}

export interface ControlCenterFeatureManagementQuery {
  search?: string;
  status?: FeatureFlagStatus | null;
  scope?: ControlCenterFeatureScope | null;
  category?: ControlCenterFeatureCategory | null;
  module?: string | null;
  page?: number;
  pageSize?: number;
}

export interface ControlCenterFeatureFlagSummary {
  id: string;
  key: string;
  name: string;
  description: string;
  module: string;
  flagType: FeatureFlagType;
  status: FeatureFlagStatus;
  defaultEnabled: boolean;
  rolloutPercentage: number;
  currentVersion: number;
  scope: ControlCenterFeatureScope;
  category: ControlCenterFeatureCategory;
  businessId: string | null;
  businessName: string | null;
  targetCount: number;
  dependencies: string[];
  expiresAt: string | null;
  scheduledActivateAt: string | null;
  scheduledDeactivateAt: string | null;
  updatedAt: string;
}

export interface ControlCenterFeatureFlagTargetItem {
  id: string;
  targetType: FeatureFlagTargetType;
  targetValue: string;
  isIncluded: boolean;
  priority: number;
}

export interface ControlCenterFeatureFlagVersionItem {
  id: string;
  version: number;
  changeReason: string | null;
  changedByEmail: string | null;
  createdAt: string;
}

export interface ControlCenterFeatureFlagAuditItem {
  id: string;
  eventType: FeatureFlagAuditEventType;
  flagKey: string | null;
  actorEmail: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

export interface ControlCenterFeatureFlagDetail extends ControlCenterFeatureFlagSummary {
  conditions: unknown;
  metadata: ControlCenterFeatureMetadata;
  targets: ControlCenterFeatureFlagTargetItem[];
  versions: ControlCenterFeatureFlagVersionItem[];
  audit: ControlCenterFeatureFlagAuditItem[];
}

export interface ControlCenterFeatureManagementOverview {
  totalFlags: number;
  activeFlags: number;
  betaFlags: number;
  experimentalFlags: number;
  emergencyFlags: number;
  scheduledFlags: number;
  globalFlags: number;
  tenantFlags: number;
  businessFlags: number;
}

export interface ControlCenterFeatureManagementDirectory {
  items: ControlCenterFeatureFlagSummary[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ControlCenterFeatureManagementFilterOptions {
  modules: string[];
  scopes: ControlCenterFeatureScope[];
  categories: ControlCenterFeatureCategory[];
  statuses: FeatureFlagStatus[];
  businesses: Array<{ id: string; name: string }>;
  plans: string[];
}

export interface ControlCenterFeatureManagementBundle {
  overview: ControlCenterFeatureManagementOverview;
  directory: ControlCenterFeatureManagementDirectory;
  filterOptions: ControlCenterFeatureManagementFilterOptions;
  permissions: ControlCenterFeatureManagementPermissions;
  refreshedAt: string;
}

export interface CreateControlCenterFeatureFlagInput {
  key: string;
  name: string;
  description?: string;
  module: string;
  flagType: FeatureFlagType;
  scope?: ControlCenterFeatureScope;
  category?: ControlCenterFeatureCategory;
  defaultEnabled?: boolean;
  rolloutPercentage?: number;
  businessId?: string | null;
  dependencies?: string[];
  expiresAt?: string | null;
  scheduledActivateAt?: string | null;
  scheduledDeactivateAt?: string | null;
  targets?: Array<{
    targetType: FeatureFlagTargetType;
    targetValue: string;
    isIncluded?: boolean;
    priority?: number;
  }>;
  changeReason?: string;
}

export interface UpdateControlCenterFeatureFlagInput {
  name?: string;
  description?: string;
  flagType?: FeatureFlagType;
  status?: FeatureFlagStatus;
  scope?: ControlCenterFeatureScope;
  category?: ControlCenterFeatureCategory;
  defaultEnabled?: boolean;
  rolloutPercentage?: number;
  dependencies?: string[];
  expiresAt?: string | null;
  scheduledActivateAt?: string | null;
  scheduledDeactivateAt?: string | null;
  targets?: Array<{
    targetType: FeatureFlagTargetType;
    targetValue: string;
    isIncluded?: boolean;
    priority?: number;
  }>;
  changeReason?: string;
  metadata?: ControlCenterFeatureMetadata;
}

export interface AssignControlCenterFeatureTargetsInput {
  flagId: string;
  targetType: FeatureFlagTargetType;
  targetValues: string[];
  changeReason?: string;
}

export interface ImportControlCenterFeatureFlagsInput {
  payload: string;
  changeReason?: string;
}
