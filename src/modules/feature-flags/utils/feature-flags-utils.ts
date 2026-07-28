import type {
  FeatureFlag,
  FeatureFlagAuditLog,
  FeatureFlagEvaluationLog,
  FeatureFlagTarget,
  FeatureFlagVersion,
} from "@prisma/client";

import type {
  FeatureFlagsDashboardMetrics,
  FeatureFlagAuditLogView,
  FeatureFlagEvaluationView,
  FeatureFlagTargetView,
  FeatureFlagVersionView,
  FeatureFlagView,
} from "@/modules/feature-flags/types/feature-flags-types";

export function serializeFeatureFlag(flag: FeatureFlag): FeatureFlagView {
  return {
    id: flag.id,
    key: flag.key,
    name: flag.name,
    module: flag.module,
    flagType: flag.flagType,
    status: flag.status,
    defaultEnabled: flag.defaultEnabled,
    rolloutPercentage: flag.rolloutPercentage,
    currentVersion: flag.currentVersion,
    updatedAt: flag.updatedAt.toISOString(),
  };
}

export function serializeFeatureFlagTarget(target: FeatureFlagTarget): FeatureFlagTargetView {
  return {
    id: target.id,
    targetType: target.targetType,
    targetValue: target.targetValue,
    isIncluded: target.isIncluded,
    priority: target.priority,
  };
}

export function serializeFeatureFlagVersion(version: FeatureFlagVersion): FeatureFlagVersionView {
  return {
    id: version.id,
    flagId: version.flagId,
    version: version.version,
    changeReason: version.changeReason,
    createdAt: version.createdAt.toISOString(),
  };
}

export function serializeFeatureFlagEvaluation(
  log: FeatureFlagEvaluationLog,
): FeatureFlagEvaluationView {
  return {
    id: log.id,
    flagKey: log.flagKey,
    enabled: log.enabled,
    createdAt: log.createdAt.toISOString(),
  };
}

export function serializeFeatureFlagAuditLog(log: FeatureFlagAuditLog): FeatureFlagAuditLogView {
  return {
    id: log.id,
    eventType: log.eventType,
    flagKey: log.flagKey,
    createdAt: log.createdAt.toISOString(),
  };
}

export function serializeFeatureFlagsDashboard(
  metrics: FeatureFlagsDashboardMetrics,
): FeatureFlagsDashboardMetrics {
  return metrics;
}

export type FeatureFlagsDashboardView = FeatureFlagsDashboardMetrics;
