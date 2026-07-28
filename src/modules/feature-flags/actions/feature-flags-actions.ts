"use server";

import { revalidatePath } from "next/cache";

import { PERMISSION_CODES } from "@/modules/authorization/constants/permissions";
import { protectedAction } from "@/modules/platform-guards/guards/action.guards";
import { FEATURE_FLAGS_ROUTES } from "@/modules/feature-flags/constants/routes";
import type {
  CreateFeatureFlagInput,
  UpdateFeatureFlagInput,
} from "@/modules/feature-flags/types/feature-flags-types";
import {
  archiveFeatureFlag,
  cloneFeatureFlag,
  createFeatureFlag,
  rollbackFeatureFlag,
  scheduleFeatureRollout,
  updateFeatureFlag,
} from "@/services/feature-flags.service";

export async function createFeatureFlagAction(input: CreateFeatureFlagInput) {
  return protectedAction(PERMISSION_CODES.FEATURE_FLAGS_MANAGE, async ({ platform }) => {
    const result = await createFeatureFlag(platform, input);
    revalidatePath(FEATURE_FLAGS_ROUTES.flags);
    return result;
  });
}

export async function updateFeatureFlagAction(flagId: string, input: UpdateFeatureFlagInput) {
  return protectedAction(PERMISSION_CODES.FEATURE_FLAGS_MANAGE, async ({ platform }) => {
    const result = await updateFeatureFlag(platform, flagId, input);
    revalidatePath(FEATURE_FLAGS_ROUTES.flags);
    revalidatePath(FEATURE_FLAGS_ROUTES.versions);
    return result;
  });
}

export async function cloneFeatureFlagAction(flagId: string, newKey: string) {
  return protectedAction(PERMISSION_CODES.FEATURE_FLAGS_MANAGE, async ({ platform }) => {
    const result = await cloneFeatureFlag(platform, flagId, newKey);
    revalidatePath(FEATURE_FLAGS_ROUTES.flags);
    return result;
  });
}

export async function archiveFeatureFlagAction(flagId: string) {
  return protectedAction(PERMISSION_CODES.FEATURE_FLAGS_MANAGE, async ({ platform }) => {
    await archiveFeatureFlag(platform, flagId);
    revalidatePath(FEATURE_FLAGS_ROUTES.flags);
    revalidatePath(FEATURE_FLAGS_ROUTES.audit);
  });
}

export async function scheduleFeatureRolloutAction(
  flagId: string,
  activateAt: string,
  deactivateAt?: string,
) {
  return protectedAction(PERMISSION_CODES.FEATURE_FLAGS_MANAGE, async ({ platform }) => {
    const result = await scheduleFeatureRollout(
      platform,
      flagId,
      new Date(activateAt),
      deactivateAt ? new Date(deactivateAt) : null,
    );
    revalidatePath(FEATURE_FLAGS_ROUTES.schedules);
    return result;
  });
}

export async function rollbackFeatureFlagAction(flagId: string, targetVersion: number) {
  return protectedAction(PERMISSION_CODES.FEATURE_FLAGS_MANAGE, async ({ platform }) => {
    const result = await rollbackFeatureFlag(platform, flagId, targetVersion);
    revalidatePath(FEATURE_FLAGS_ROUTES.versions);
    revalidatePath(FEATURE_FLAGS_ROUTES.flags);
    return result;
  });
}
