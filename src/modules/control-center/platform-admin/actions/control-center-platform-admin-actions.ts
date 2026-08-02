"use server";

import { revalidatePath } from "next/cache";

import { PERMISSION_CODES } from "@/modules/authorization/constants/permissions";
import { protectedControlCenterAction } from "@/modules/control-center/guards/control-center.guards";
import { CONTROL_CENTER_PLATFORM_ADMIN_ROUTES } from "@/modules/control-center/platform-admin/constants/control-center-platform-admin";
import type {
  ControlCenterFeatureFlagQuery,
  ControlCenterPlatformAuditQuery,
  ControlCenterReleaseQuery,
  CreateControlCenterFeatureFlagInput,
  CreateControlCenterReleaseInput,
  ScheduleControlCenterMaintenanceInput,
  UpdateControlCenterFeatureFlagInput,
  UpdateControlCenterPlatformSettingInput,
} from "@/modules/control-center/platform-admin/types/control-center-platform-admin-types";
import {
  getControlCenterPlatformAdminManagementBundle,
  queryControlCenterFeatureFlags,
  queryControlCenterReleases,
  runControlCenterClearMaintenance,
  runControlCenterCreateFeatureFlag,
  runControlCenterCreateRelease,
  runControlCenterEmergencyMaintenance,
  runControlCenterRollbackRelease,
  runControlCenterScheduleMaintenance,
  runControlCenterUpdateFeatureFlag,
  runControlCenterUpdatePlatformSetting,
} from "@/services/control-center-platform-admin.service";

function revalidatePlatformAdminPages() {
  for (const route of Object.values(CONTROL_CENTER_PLATFORM_ADMIN_ROUTES)) {
    revalidatePath(route);
  }
}

export async function refreshControlCenterPlatformAdminBundleAction(
  featureFlagQuery: ControlCenterFeatureFlagQuery = {},
  releaseQuery: ControlCenterReleaseQuery = {},
  auditQuery: ControlCenterPlatformAuditQuery = {},
) {
  return protectedControlCenterAction(
    PERMISSION_CODES.CONTROL_CENTER_SETTINGS,
    async ({ operator }) =>
      getControlCenterPlatformAdminManagementBundle(
        operator,
        featureFlagQuery,
        releaseQuery,
        auditQuery,
      ),
  );
}

export async function queryControlCenterFeatureFlagsAction(query: ControlCenterFeatureFlagQuery) {
  return protectedControlCenterAction(PERMISSION_CODES.CONTROL_CENTER_FEATURE_FLAGS, async () =>
    queryControlCenterFeatureFlags(query),
  );
}

export async function queryControlCenterReleasesAction(query: ControlCenterReleaseQuery) {
  return protectedControlCenterAction(PERMISSION_CODES.CONTROL_CENTER_RELEASES, async () =>
    queryControlCenterReleases(query),
  );
}

export async function updateControlCenterPlatformSettingAction(
  input: UpdateControlCenterPlatformSettingInput,
) {
  return protectedControlCenterAction(
    PERMISSION_CODES.CONTROL_CENTER_SETTINGS,
    async ({ operator }) => {
      await runControlCenterUpdatePlatformSetting(operator, input);
      revalidatePlatformAdminPages();
    },
  );
}

export async function createControlCenterFeatureFlagAction(
  input: CreateControlCenterFeatureFlagInput,
) {
  return protectedControlCenterAction(
    PERMISSION_CODES.CONTROL_CENTER_FEATURE_FLAGS,
    async ({ operator }) => {
      const result = await runControlCenterCreateFeatureFlag(operator, input);
      revalidatePlatformAdminPages();
      return result;
    },
  );
}

export async function updateControlCenterFeatureFlagAction(
  flagId: string,
  input: UpdateControlCenterFeatureFlagInput,
) {
  return protectedControlCenterAction(
    PERMISSION_CODES.CONTROL_CENTER_FEATURE_FLAGS,
    async ({ operator }) => {
      await runControlCenterUpdateFeatureFlag(operator, flagId, input);
      revalidatePlatformAdminPages();
    },
  );
}

export async function createControlCenterReleaseAction(input: CreateControlCenterReleaseInput) {
  return protectedControlCenterAction(
    PERMISSION_CODES.CONTROL_CENTER_RELEASES,
    async ({ operator }) => {
      const result = await runControlCenterCreateRelease(operator, input);
      revalidatePlatformAdminPages();
      return result;
    },
  );
}

export async function rollbackControlCenterReleaseAction(releaseId: string) {
  return protectedControlCenterAction(
    PERMISSION_CODES.CONTROL_CENTER_RELEASES,
    async ({ operator }) => {
      await runControlCenterRollbackRelease(operator, releaseId);
      revalidatePlatformAdminPages();
    },
  );
}

export async function scheduleControlCenterMaintenanceAction(
  input: ScheduleControlCenterMaintenanceInput,
) {
  return protectedControlCenterAction(
    PERMISSION_CODES.CONTROL_CENTER_MAINTENANCE,
    async ({ operator }) => {
      await runControlCenterScheduleMaintenance(operator, input);
      revalidatePlatformAdminPages();
    },
  );
}

export async function emergencyControlCenterMaintenanceAction(message?: string) {
  return protectedControlCenterAction(
    PERMISSION_CODES.CONTROL_CENTER_MAINTENANCE,
    async ({ operator }) => {
      await runControlCenterEmergencyMaintenance(operator, message);
      revalidatePlatformAdminPages();
    },
  );
}

export async function clearControlCenterMaintenanceAction() {
  return protectedControlCenterAction(
    PERMISSION_CODES.CONTROL_CENTER_MAINTENANCE,
    async ({ operator }) => {
      await runControlCenterClearMaintenance(operator);
      revalidatePlatformAdminPages();
    },
  );
}
