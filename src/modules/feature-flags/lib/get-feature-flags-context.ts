import { cache } from "react";

import { PERMISSION_CODES } from "@/modules/authorization/constants/permissions";
import { protectedPage } from "@/modules/platform-guards/guards/page.guards";
import {
  serializeFeatureFlag,
  serializeFeatureFlagAuditLog,
  serializeFeatureFlagEvaluation,
  serializeFeatureFlagTarget,
  serializeFeatureFlagVersion,
  serializeFeatureFlagsDashboard,
} from "@/modules/feature-flags/utils/feature-flags-utils";
import {
  ensureFeatureFlagsDefaults,
  getFeatureFlagsDashboard,
  listFeatureFlagAuditLogs,
  listFeatureFlagEvaluations,
  listFeatureFlags,
  listFeatureFlagTargets,
  listFeatureFlagVersions,
  listRegisteredFeatureDefinitions,
} from "@/services/feature-flags.service";

export const getFeatureFlagsOverviewContext = cache(async () => {
  const context = await protectedPage({ permission: PERMISSION_CODES.FEATURE_FLAGS_VIEW });
  await ensureFeatureFlagsDefaults(context.business.id);
  const dashboard = await getFeatureFlagsDashboard(context.business.id);

  return {
    context,
    dashboard: serializeFeatureFlagsDashboard(dashboard),
  };
});

export const getFeatureFlagsListContext = cache(async () => {
  const context = await protectedPage({ permission: PERMISSION_CODES.FEATURE_FLAGS_VIEW });
  const flags = await listFeatureFlags(context.business.id);

  return {
    context,
    flags: flags.map(serializeFeatureFlag),
  };
});

export const getFeatureFlagsTargetingContext = cache(async () => {
  const context = await protectedPage({ permission: PERMISSION_CODES.FEATURE_FLAGS_VIEW });
  const targets = await listFeatureFlagTargets(context.business.id);

  return {
    context,
    targets: targets.map(serializeFeatureFlagTarget),
  };
});

export const getFeatureFlagsSchedulesContext = cache(async () => {
  const context = await protectedPage({ permission: PERMISSION_CODES.FEATURE_FLAGS_VIEW });
  const flags = await listFeatureFlags(context.business.id);

  return {
    context,
    flags: flags
      .filter(
        (flag: { scheduledActivateAt: Date | null; scheduledDeactivateAt: Date | null }) =>
          flag.scheduledActivateAt || flag.scheduledDeactivateAt,
      )
      .map(serializeFeatureFlag),
  };
});

export const getFeatureFlagsEvaluationsContext = cache(async () => {
  const context = await protectedPage({ permission: PERMISSION_CODES.FEATURE_FLAGS_VIEW });
  const evaluations = await listFeatureFlagEvaluations(context.business.id);

  return {
    context,
    evaluations: evaluations.map(serializeFeatureFlagEvaluation),
  };
});

export const getFeatureFlagsVersionsContext = cache(async () => {
  const context = await protectedPage({ permission: PERMISSION_CODES.FEATURE_FLAGS_VIEW });
  const versions = await listFeatureFlagVersions(context.business.id);

  return {
    context,
    versions: versions.map(serializeFeatureFlagVersion),
  };
});

export const getFeatureFlagsRegistryContext = cache(async () => {
  const context = await protectedPage({ permission: PERMISSION_CODES.FEATURE_FLAGS_VIEW });
  const registrations = await listRegisteredFeatureDefinitions();

  return {
    context,
    registrations,
  };
});

export const getFeatureFlagsAuditContext = cache(async () => {
  const context = await protectedPage({ permission: PERMISSION_CODES.FEATURE_FLAGS_VIEW });
  const auditLogs = await listFeatureFlagAuditLogs(context.business.id);

  return {
    context,
    auditLogs: auditLogs.map(serializeFeatureFlagAuditLog),
  };
});
