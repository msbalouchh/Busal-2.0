import "server-only";

import { PERMISSION_CODES } from "@/modules/authorization/constants/permissions";
import { hasPermission } from "@/modules/authorization/services/authorization.service";
import { getControlCenterOperatorEmails } from "@/modules/control-center/lib/resolve-control-center-authorization";
import { loadOperatorRegistry } from "@/modules/control-center/operators/repository/control-center-operator.repository";
import type {
  AssignControlCenterFeatureTargetsInput,
  ControlCenterFeatureManagementBundle,
  ControlCenterFeatureManagementPermissions,
  ControlCenterFeatureManagementQuery,
  ControlCenterFeatureFlagDetail,
  CreateControlCenterFeatureFlagInput,
  ImportControlCenterFeatureFlagsInput,
  UpdateControlCenterFeatureFlagInput,
} from "@/modules/control-center/features/types/control-center-feature-management-types";
import {
  assignControlCenterFeatureTargets,
  createControlCenterFeatureFlagRecord,
  emergencyDisableControlCenterFeatureFlag,
  exportControlCenterFeatureFlagsPayload,
  getControlCenterFeatureFlagDetail,
  importControlCenterFeatureFlags,
  loadFeatureManagementFilterOptions,
  loadFeatureManagementOverview,
  queryControlCenterFeatureFlags,
  updateControlCenterFeatureFlagRecord,
} from "@/modules/control-center/features/repository/control-center-feature-management.repository";
import type { ControlCenterOperatorContext } from "@/modules/control-center/types/control-center-types";

async function resolveIsPlatformOwner(actor: ControlCenterOperatorContext): Promise<boolean> {
  const registry = await loadOperatorRegistry();
  const record = registry.find((entry) => entry.userId === actor.userId);
  if (record?.role === "PLATFORM_OWNER") return true;

  if (registry.some((entry) => entry.role === "PLATFORM_OWNER")) {
    return false;
  }

  return getControlCenterOperatorEmails().includes(actor.email.trim().toLowerCase());
}

function buildPermissions(
  operator: ControlCenterOperatorContext,
  isPlatformOwner: boolean,
): ControlCenterFeatureManagementPermissions {
  const permissions = new Set(operator.permissions);
  const hasAdmin = permissions.has(PERMISSION_CODES.CONTROL_CENTER_ADMIN);
  const canView =
    hasAdmin ||
    hasPermission(permissions, PERMISSION_CODES.CONTROL_CENTER_FEATURE_FLAGS) ||
    hasPermission(permissions, PERMISSION_CODES.CONTROL_CENTER_VIEW);

  return {
    canView,
    canExport: canView,
    canImport: isPlatformOwner,
    canEdit: isPlatformOwner,
    isPlatformOwner,
  };
}

function assertCanEdit(permissions: ControlCenterFeatureManagementPermissions): void {
  if (!permissions.canEdit) {
    throw new Error("Only the Platform Owner may modify feature flags");
  }
}

export async function getControlCenterFeatureManagementBundle(
  operator: ControlCenterOperatorContext,
  query: ControlCenterFeatureManagementQuery = {},
): Promise<ControlCenterFeatureManagementBundle> {
  const isPlatformOwner = await resolveIsPlatformOwner(operator);
  const permissions = buildPermissions(operator, isPlatformOwner);

  if (!permissions.canView) {
    throw new Error("Permission denied");
  }

  const [overview, directory, filterOptions] = await Promise.all([
    loadFeatureManagementOverview(),
    queryControlCenterFeatureFlags(query),
    loadFeatureManagementFilterOptions(),
  ]);

  return {
    overview,
    directory,
    filterOptions,
    permissions,
    refreshedAt: new Date().toISOString(),
  };
}

export async function getControlCenterFeatureFlagDetailBundle(
  operator: ControlCenterOperatorContext,
  flagId: string,
): Promise<{ detail: ControlCenterFeatureFlagDetail; permissions: ControlCenterFeatureManagementPermissions }> {
  const isPlatformOwner = await resolveIsPlatformOwner(operator);
  const permissions = buildPermissions(operator, isPlatformOwner);

  if (!permissions.canView) {
    throw new Error("Permission denied");
  }

  const detail = await getControlCenterFeatureFlagDetail(flagId);
  if (!detail) {
    throw new Error("Feature flag not found");
  }

  return { detail, permissions };
}

export async function createControlCenterFeatureFlag(
  operator: ControlCenterOperatorContext,
  input: CreateControlCenterFeatureFlagInput,
): Promise<{ id: string }> {
  const isPlatformOwner = await resolveIsPlatformOwner(operator);
  const permissions = buildPermissions(operator, isPlatformOwner);
  assertCanEdit(permissions);
  return createControlCenterFeatureFlagRecord(operator.userId, input);
}

export async function updateControlCenterFeatureFlag(
  operator: ControlCenterOperatorContext,
  flagId: string,
  input: UpdateControlCenterFeatureFlagInput,
): Promise<void> {
  const isPlatformOwner = await resolveIsPlatformOwner(operator);
  const permissions = buildPermissions(operator, isPlatformOwner);
  assertCanEdit(permissions);
  await updateControlCenterFeatureFlagRecord(operator.userId, flagId, input);
}

export async function emergencyDisableControlCenterFeatureFlagService(
  operator: ControlCenterOperatorContext,
  flagId: string,
  changeReason?: string,
): Promise<void> {
  const isPlatformOwner = await resolveIsPlatformOwner(operator);
  const permissions = buildPermissions(operator, isPlatformOwner);
  assertCanEdit(permissions);
  await emergencyDisableControlCenterFeatureFlag(operator.userId, flagId, changeReason);
}

export async function assignControlCenterFeatureFlagTargets(
  operator: ControlCenterOperatorContext,
  input: AssignControlCenterFeatureTargetsInput,
): Promise<void> {
  const isPlatformOwner = await resolveIsPlatformOwner(operator);
  const permissions = buildPermissions(operator, isPlatformOwner);
  assertCanEdit(permissions);
  await assignControlCenterFeatureTargets(
    operator.userId,
    input.flagId,
    input.targetType,
    input.targetValues,
    input.changeReason,
  );
}

export async function exportControlCenterFeatureFlags(
  operator: ControlCenterOperatorContext,
  format: "csv" | "json" = "json",
): Promise<{ filename: string; content: string; mimeType: string }> {
  const isPlatformOwner = await resolveIsPlatformOwner(operator);
  const permissions = buildPermissions(operator, isPlatformOwner);

  if (!permissions.canExport) {
    throw new Error("Permission denied");
  }

  const payload = await exportControlCenterFeatureFlagsPayload();

  if (format === "json") {
    return {
      filename: "feature-flags-export.json",
      content: JSON.stringify(payload, null, 2),
      mimeType: "application/json",
    };
  }

  const rows = [
    "key,name,module,status,defaultEnabled,rolloutPercentage,scope,category",
    ...payload.map((flag) => {
      const metadata = (flag.metadata as Record<string, unknown> | null) ?? {};
      return [
        flag.key,
        flag.name,
        flag.module,
        flag.status,
        flag.defaultEnabled,
        flag.rolloutPercentage,
        metadata.scope ?? "global",
        metadata.category ?? "standard",
      ].join(",");
    }),
  ];

  return {
    filename: "feature-flags-export.csv",
    content: rows.join("\n"),
    mimeType: "text/csv",
  };
}

export async function importControlCenterFeatureFlagsService(
  operator: ControlCenterOperatorContext,
  input: ImportControlCenterFeatureFlagsInput,
): Promise<{ created: number; updated: number }> {
  const isPlatformOwner = await resolveIsPlatformOwner(operator);
  const permissions = buildPermissions(operator, isPlatformOwner);
  assertCanEdit(permissions);

  const parsed = JSON.parse(input.payload) as Array<Record<string, unknown>>;
  if (!Array.isArray(parsed)) {
    throw new Error("Import payload must be a JSON array");
  }

  return importControlCenterFeatureFlags(operator.userId, parsed, input.changeReason);
}
