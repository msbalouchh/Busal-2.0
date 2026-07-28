"use server";

import { revalidatePath } from "next/cache";

import type { TenantMaintenanceMode } from "@prisma/client";

import { PERMISSION_CODES } from "@/modules/authorization/constants/permissions";
import { protectedAction } from "@/modules/platform-guards/guards/action.guards";
import { TENANT_PLATFORM_ROUTES } from "@/modules/tenant-platform/constants/routes";
import type {
  FeatureAssignmentInput,
  ImpersonationInput,
  RegisteredTenantPolicyDefinition,
  ResourceLimitInput,
  SubscriptionAssignmentInput,
  TenantProfileInput,
  TenantSettingsInput,
} from "@/modules/tenant-platform/types/tenant-platform-types";
import {
  activateTenant,
  archiveTenant,
  assignFeatures,
  assignSubscription,
  deleteTenant,
  endImpersonation,
  reactivateTenant,
  registerModuleTenantPolicy,
  setMaintenanceMode,
  startImpersonation,
  suspendTenant,
  updateResourceLimits,
  updateTenantProfile,
  updateTenantSettings,
} from "@/services/tenant-platform.service";

export async function activateTenantAction() {
  return protectedAction(PERMISSION_CODES.TENANT_PLATFORM_MANAGE, async ({ platform }) => {
    const result = await activateTenant(platform);
    revalidatePath(TENANT_PLATFORM_ROUTES.lifecycle);
    revalidatePath(TENANT_PLATFORM_ROUTES.audit);
    return result;
  });
}

export async function suspendTenantAction() {
  return protectedAction(PERMISSION_CODES.TENANT_PLATFORM_MANAGE, async ({ platform }) => {
    const result = await suspendTenant(platform);
    revalidatePath(TENANT_PLATFORM_ROUTES.lifecycle);
    revalidatePath(TENANT_PLATFORM_ROUTES.audit);
    return result;
  });
}

export async function reactivateTenantAction() {
  return protectedAction(PERMISSION_CODES.TENANT_PLATFORM_MANAGE, async ({ platform }) => {
    const result = await reactivateTenant(platform);
    revalidatePath(TENANT_PLATFORM_ROUTES.lifecycle);
    revalidatePath(TENANT_PLATFORM_ROUTES.audit);
    return result;
  });
}

export async function archiveTenantAction() {
  return protectedAction(PERMISSION_CODES.TENANT_PLATFORM_MANAGE, async ({ platform }) => {
    const result = await archiveTenant(platform);
    revalidatePath(TENANT_PLATFORM_ROUTES.lifecycle);
    revalidatePath(TENANT_PLATFORM_ROUTES.audit);
    return result;
  });
}

export async function deleteTenantAction() {
  return protectedAction(PERMISSION_CODES.TENANT_PLATFORM_ADMIN, async ({ platform }) => {
    const result = await deleteTenant(platform);
    revalidatePath(TENANT_PLATFORM_ROUTES.lifecycle);
    revalidatePath(TENANT_PLATFORM_ROUTES.audit);
    return result;
  });
}

export async function updateTenantProfileAction(input: TenantProfileInput) {
  return protectedAction(PERMISSION_CODES.TENANT_PLATFORM_MANAGE, async ({ platform }) => {
    await updateTenantProfile(platform, input);
    revalidatePath(TENANT_PLATFORM_ROUTES.business);
    revalidatePath(TENANT_PLATFORM_ROUTES.audit);
  });
}

export async function assignSubscriptionAction(input: SubscriptionAssignmentInput) {
  return protectedAction(PERMISSION_CODES.TENANT_PLATFORM_MANAGE, async ({ platform }) => {
    await assignSubscription(platform, input);
    revalidatePath(TENANT_PLATFORM_ROUTES.business);
    revalidatePath(TENANT_PLATFORM_ROUTES.audit);
  });
}

export async function assignFeaturesAction(input: FeatureAssignmentInput) {
  return protectedAction(PERMISSION_CODES.TENANT_PLATFORM_MANAGE, async ({ platform }) => {
    await assignFeatures(platform, input);
    revalidatePath(TENANT_PLATFORM_ROUTES.business);
    revalidatePath(TENANT_PLATFORM_ROUTES.audit);
  });
}

export async function updateResourceLimitsAction(input: ResourceLimitInput) {
  return protectedAction(PERMISSION_CODES.TENANT_PLATFORM_MANAGE, async ({ platform }) => {
    await updateResourceLimits(platform, input);
    revalidatePath(TENANT_PLATFORM_ROUTES.resources);
    revalidatePath(TENANT_PLATFORM_ROUTES.audit);
  });
}

export async function updateTenantSettingsAction(input: TenantSettingsInput) {
  return protectedAction(PERMISSION_CODES.TENANT_PLATFORM_MANAGE, async ({ platform }) => {
    await updateTenantSettings(platform, input);
    revalidatePath(TENANT_PLATFORM_ROUTES.settings);
    revalidatePath(TENANT_PLATFORM_ROUTES.audit);
  });
}

export async function setMaintenanceModeAction(
  mode: TenantMaintenanceMode,
  scheduledAt?: string | null,
) {
  return protectedAction(PERMISSION_CODES.TENANT_PLATFORM_MANAGE, async ({ platform }) => {
    await setMaintenanceMode(platform, mode, scheduledAt ? new Date(scheduledAt) : null);
    revalidatePath(TENANT_PLATFORM_ROUTES.lifecycle);
    revalidatePath(TENANT_PLATFORM_ROUTES.health);
    revalidatePath(TENANT_PLATFORM_ROUTES.audit);
  });
}

export async function startImpersonationAction(input: ImpersonationInput) {
  return protectedAction(PERMISSION_CODES.TENANT_PLATFORM_ADMIN, async ({ platform }) => {
    const result = await startImpersonation(platform, input);
    revalidatePath(TENANT_PLATFORM_ROUTES.activity);
    revalidatePath(TENANT_PLATFORM_ROUTES.audit);
    return result;
  });
}

export async function endImpersonationAction(sessionId: string) {
  return protectedAction(PERMISSION_CODES.TENANT_PLATFORM_ADMIN, async ({ platform }) => {
    await endImpersonation(platform, sessionId);
    revalidatePath(TENANT_PLATFORM_ROUTES.activity);
    revalidatePath(TENANT_PLATFORM_ROUTES.audit);
  });
}

export async function registerModuleTenantPolicyAction(
  definition: RegisteredTenantPolicyDefinition,
) {
  return protectedAction(PERMISSION_CODES.TENANT_PLATFORM_MANAGE, async ({ platform }) => {
    await registerModuleTenantPolicy(platform.business.id, definition);
    revalidatePath(TENANT_PLATFORM_ROUTES.security);
    revalidatePath(TENANT_PLATFORM_ROUTES.audit);
  });
}
