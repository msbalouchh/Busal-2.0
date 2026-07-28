import type {
  FeatureFlagConditionType,
  FeatureFlagStatus,
  FeatureFlagTargetType,
  FeatureFlagType,
} from "@prisma/client";

export interface FeatureConditionRule {
  type: FeatureFlagConditionType;
  field: string;
  operator: string;
  value: unknown;
}

export interface FeatureTargetRule {
  targetType: FeatureFlagTargetType;
  targetValue: string;
  isIncluded?: boolean;
  priority?: number;
}

export interface RegisteredFeatureDefinition {
  key: string;
  module: string;
  name: string;
  description?: string;
  flagType: FeatureFlagType;
  defaultEnabled: boolean;
  isActive: boolean;
}

export interface FeatureEvaluationContext {
  businessId?: string | null;
  branchId?: string | null;
  department?: string | null;
  roleSlug?: string | null;
  userId?: string | null;
  subscriptionPlan?: string | null;
  marketplaceLicense?: string | null;
  country?: string | null;
  region?: string | null;
  environment?: string | null;
  userAttributes?: Record<string, unknown>;
  businessAttributes?: Record<string, unknown>;
  customMetadata?: Record<string, unknown>;
  module?: string | null;
  version?: string | null;
}

export interface FeatureFlagRecord {
  id: string;
  key: string;
  name: string;
  module: string;
  flagType: FeatureFlagType;
  status: FeatureFlagStatus;
  defaultEnabled: boolean;
  rolloutPercentage: number;
  scheduledActivateAt: Date | null;
  scheduledDeactivateAt: Date | null;
  conditions: FeatureConditionRule[];
  metadata: Record<string, unknown> | null;
}

export interface FeatureEvaluationResult {
  key: string;
  enabled: boolean;
  reason: string;
  flagType: FeatureFlagType;
  flagId?: string;
}

export interface CreateFeatureFlagInput {
  key: string;
  name: string;
  description?: string;
  module: string;
  flagType: FeatureFlagType;
  defaultEnabled?: boolean;
  rolloutPercentage?: number;
  scheduledActivateAt?: Date | null;
  scheduledDeactivateAt?: Date | null;
  conditions?: FeatureConditionRule[];
  metadata?: Record<string, unknown>;
  targets?: FeatureTargetRule[];
  changeReason?: string;
}

export interface UpdateFeatureFlagInput {
  name?: string;
  description?: string;
  flagType?: FeatureFlagType;
  status?: FeatureFlagStatus;
  defaultEnabled?: boolean;
  rolloutPercentage?: number;
  scheduledActivateAt?: Date | null;
  scheduledDeactivateAt?: Date | null;
  conditions?: FeatureConditionRule[];
  metadata?: Record<string, unknown>;
  targets?: FeatureTargetRule[];
  changeReason?: string;
}

export interface FeatureFlagsDashboardMetrics {
  totalFlags: number;
  activeFlags: number;
  scheduledFlags: number;
  archivedFlags: number;
  totalEvaluations: number;
  recentEvaluations: number;
  registeredFeatures: number;
  targetingRules: number;
}

export interface FeatureFlagView {
  id: string;
  key: string;
  name: string;
  module: string;
  flagType: FeatureFlagType;
  status: FeatureFlagStatus;
  defaultEnabled: boolean;
  rolloutPercentage: number;
  currentVersion: number;
  updatedAt: string;
}

export interface FeatureFlagTargetView {
  id: string;
  targetType: FeatureFlagTargetType;
  targetValue: string;
  isIncluded: boolean;
  priority: number;
}

export interface FeatureFlagVersionView {
  id: string;
  flagId: string;
  version: number;
  changeReason: string | null;
  createdAt: string;
}

export interface FeatureFlagEvaluationView {
  id: string;
  flagKey: string;
  enabled: boolean;
  createdAt: string;
}

export interface FeatureFlagAuditLogView {
  id: string;
  eventType: string;
  flagKey: string | null;
  createdAt: string;
}
