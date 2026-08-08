"use server";

import { revalidatePath } from "next/cache";

import { PERMISSION_CODES } from "@/modules/authorization/constants/permissions";
import { protectedControlCenterAction } from "@/modules/control-center/guards/control-center.guards";
import { CONTROL_CENTER_FEATURE_MANAGEMENT_ROUTES } from "@/modules/control-center/features/constants/control-center-feature-management";
import type {
  AssignControlCenterFeatureTargetsInput,
  ControlCenterFeatureManagementQuery,
  CreateControlCenterFeatureFlagInput,
  ImportControlCenterFeatureFlagsInput,
  UpdateControlCenterFeatureFlagInput,
} from "@/modules/control-center/features/types/control-center-feature-management-types";
import {
  assignControlCenterFeatureFlagTargets,
  createControlCenterFeatureFlag,
  emergencyDisableControlCenterFeatureFlagService,
  exportControlCenterFeatureFlags,
  getControlCenterFeatureFlagDetailBundle,
  getControlCenterFeatureManagementBundle,
  importControlCenterFeatureFlagsService,
  updateControlCenterFeatureFlag,
} from "@/services/control-center-feature-management.service";

function revalidateFeaturePages() {
  revalidatePath(CONTROL_CENTER_FEATURE_MANAGEMENT_ROUTES.hub);
}

export async function refreshControlCenterFeatureManagementAction(
  query: ControlCenterFeatureManagementQuery = {},
) {
  return protectedControlCenterAction(PERMISSION_CODES.CONTROL_CENTER_FEATURE_FLAGS, async ({
    operator,
  }) => getControlCenterFeatureManagementBundle(operator, query));
}

export async function getControlCenterFeatureFlagDetailAction(flagId: string) {
  return protectedControlCenterAction(PERMISSION_CODES.CONTROL_CENTER_FEATURE_FLAGS, async ({
    operator,
  }) => getControlCenterFeatureFlagDetailBundle(operator, flagId));
}

export async function createControlCenterFeatureFlagAction(
  input: CreateControlCenterFeatureFlagInput,
) {
  return protectedControlCenterAction(PERMISSION_CODES.CONTROL_CENTER_FEATURE_FLAGS, async ({
    operator,
  }) => {
    const result = await createControlCenterFeatureFlag(operator, input);
    revalidateFeaturePages();
    return result;
  });
}

export async function updateControlCenterFeatureFlagAction(
  flagId: string,
  input: UpdateControlCenterFeatureFlagInput,
) {
  return protectedControlCenterAction(PERMISSION_CODES.CONTROL_CENTER_FEATURE_FLAGS, async ({
    operator,
  }) => {
    await updateControlCenterFeatureFlag(operator, flagId, input);
    revalidateFeaturePages();
  });
}

export async function emergencyDisableControlCenterFeatureFlagAction(
  flagId: string,
  changeReason?: string,
) {
  return protectedControlCenterAction(PERMISSION_CODES.CONTROL_CENTER_FEATURE_FLAGS, async ({
    operator,
  }) => {
    await emergencyDisableControlCenterFeatureFlagService(operator, flagId, changeReason);
    revalidateFeaturePages();
  });
}

export async function assignControlCenterFeatureFlagTargetsAction(
  input: AssignControlCenterFeatureTargetsInput,
) {
  return protectedControlCenterAction(PERMISSION_CODES.CONTROL_CENTER_FEATURE_FLAGS, async ({
    operator,
  }) => {
    await assignControlCenterFeatureFlagTargets(operator, input);
    revalidateFeaturePages();
  });
}

export async function exportControlCenterFeatureFlagsAction(format: "csv" | "json" = "json") {
  return protectedControlCenterAction(PERMISSION_CODES.CONTROL_CENTER_FEATURE_FLAGS, async ({
    operator,
  }) => exportControlCenterFeatureFlags(operator, format));
}

export async function importControlCenterFeatureFlagsAction(
  input: ImportControlCenterFeatureFlagsInput,
) {
  return protectedControlCenterAction(PERMISSION_CODES.CONTROL_CENTER_FEATURE_FLAGS, async ({
    operator,
  }) => {
    const result = await importControlCenterFeatureFlagsService(operator, input);
    revalidateFeaturePages();
    return result;
  });
}
