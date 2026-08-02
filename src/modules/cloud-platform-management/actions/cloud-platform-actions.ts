"use server";

import { revalidatePath } from "next/cache";

import { PERMISSION_CODES } from "@/modules/authorization/constants/permissions";
import { CLOUD_PLATFORM_ROUTES } from "@/modules/cloud-platform-management/constants/routes";
import { requireCloudPlatformActionContext } from "@/modules/cloud-platform-management/lib/get-cloud-platform-context";
import { toggleTenantFeatureFlag } from "@/services/cloud-feature-flag-manager.service";
import { updateTenantRegion } from "@/services/region-manager.service";
import {
  createTenantSubscription,
  updateSubscriptionStatus,
} from "@/services/subscription-manager.service";
import { updateTenantStatus } from "@/services/tenant-provisioning.service";

function revalidateCloudPages(): void {
  for (const route of Object.values(CLOUD_PLATFORM_ROUTES).map((r) => r())) {
    revalidatePath(route);
  }
}

export async function activateSubscriptionAction(subscriptionId: string) {
  const context = await requireCloudPlatformActionContext(PERMISSION_CODES.SUBSCRIPTION_MANAGE);
  await updateSubscriptionStatus(context.user.id, subscriptionId, "ACTIVE");
  revalidateCloudPages();
}

export async function suspendTenantAction(tenantId: string) {
  const context = await requireCloudPlatformActionContext(PERMISSION_CODES.TENANT_MANAGE);
  await updateTenantStatus(context.user.id, tenantId, "SUSPENDED");
  revalidateCloudPages();
}

export async function toggleFeatureFlagAction(flagId: string, enabled: boolean) {
  const context = await requireCloudPlatformActionContext(PERMISSION_CODES.CLOUD_MANAGE);
  await toggleTenantFeatureFlag(context.user.id, flagId, enabled);
  revalidateCloudPages();
}

export async function updateRegionAction(region: string) {
  const context = await requireCloudPlatformActionContext(PERMISSION_CODES.CLOUD_MANAGE);
  await updateTenantRegion(context.user.id, region);
  revalidateCloudPages();
}

export async function upgradePlanAction(planId: string) {
  const context = await requireCloudPlatformActionContext(PERMISSION_CODES.SUBSCRIPTION_MANAGE);
  await createTenantSubscription(context.user.id, { planId, status: "ACTIVE" });
  revalidateCloudPages();
}
