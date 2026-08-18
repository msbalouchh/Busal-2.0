"use server";

import { revalidatePath } from "next/cache";

import { PERMISSION_CODES } from "@/modules/authorization/constants/permissions";
import { protectedAction } from "@/modules/platform-guards/guards/action.guards";
import {
  updatePlatformApiConfig,
  updatePlatformBranding,
  updatePlatformDomains,
  updatePlatformEmbedConfig,
  updatePlatformWebhookConfig,
} from "@/modules/platform/services/platform-config.service";
import {
  initiateCustomDomainVerification,
  runCustomDomainVerification,
} from "@/modules/platform/services/platform-domain-verification.service";
import type {
  PlatformBrandingConfig,
  PlatformDomainConfig,
} from "@/modules/platform/types/platform-config.types";
import { TENANT_PLATFORM_ROUTES } from "@/modules/tenant-platform/constants/routes";
import { prisma } from "@/lib/prisma";

const WHITE_LABEL_ROUTE = "/dashboard/tenant-platform/white-label";

async function getPlanSlug(businessId: string): Promise<string | null> {
  const tenant = await prisma.tenantRecord.findUnique({
    where: { businessId },
    select: { subscriptionPlan: true },
  });
  return tenant?.subscriptionPlan ?? null;
}

export async function updatePlatformBrandingSettingsAction(
  patch: Partial<PlatformBrandingConfig>,
) {
  return protectedAction(PERMISSION_CODES.TENANT_PLATFORM_MANAGE, async ({ platform }) => {
    const planSlug = await getPlanSlug(platform.business.id);
    const result = await updatePlatformBranding(
      platform.business.id,
      platform.user.id,
      patch,
      planSlug,
    );
    revalidatePath(WHITE_LABEL_ROUTE);
    revalidatePath(TENANT_PLATFORM_ROUTES.overview);
    return result;
  });
}

export async function updatePlatformDomainSettingsAction(patch: Partial<PlatformDomainConfig>) {
  return protectedAction(PERMISSION_CODES.TENANT_PLATFORM_MANAGE, async ({ platform }) => {
    const planSlug = await getPlanSlug(platform.business.id);
    const result = await updatePlatformDomains(
      platform.business.id,
      platform.user.id,
      patch,
      planSlug,
    );
    revalidatePath(WHITE_LABEL_ROUTE);
    return result;
  });
}

export async function updatePlatformApiSettingsAction(input: { enabled: boolean }) {
  return protectedAction(PERMISSION_CODES.TENANT_PLATFORM_MANAGE, async ({ platform }) => {
    const planSlug = await getPlanSlug(platform.business.id);
    const result = await updatePlatformApiConfig(
      platform.business.id,
      platform.user.id,
      input.enabled,
      planSlug,
    );
    revalidatePath(WHITE_LABEL_ROUTE);
    return result;
  });
}

export async function verifyCustomDomainAction() {
  return protectedAction(PERMISSION_CODES.TENANT_PLATFORM_MANAGE, async ({ platform }) => {
    const result = await runCustomDomainVerification(platform.business.id, platform.user.id);
    revalidatePath(WHITE_LABEL_ROUTE);
    return result;
  });
}

export async function initiateCustomDomainVerificationAction(domain: string) {
  return protectedAction(PERMISSION_CODES.TENANT_PLATFORM_MANAGE, async ({ platform }) => {
    const result = await initiateCustomDomainVerification(
      platform.business.id,
      platform.user.id,
      domain,
    );
    revalidatePath(WHITE_LABEL_ROUTE);
    return result;
  });
}

export async function updatePlatformWebhookSettingsAction(input: { enabled: boolean }) {
  return protectedAction(PERMISSION_CODES.TENANT_PLATFORM_MANAGE, async ({ platform }) => {
    const planSlug = await getPlanSlug(platform.business.id);
    const result = await updatePlatformWebhookConfig(
      platform.business.id,
      platform.user.id,
      input.enabled,
      planSlug,
    );
    revalidatePath(WHITE_LABEL_ROUTE);
    return result;
  });
}

export async function updatePlatformEmbedSettingsAction(input: {
  enabled: boolean;
  allowedOrigins?: string[];
}) {
  return protectedAction(PERMISSION_CODES.TENANT_PLATFORM_MANAGE, async ({ platform }) => {
    const planSlug = await getPlanSlug(platform.business.id);
    const result = await updatePlatformEmbedConfig(
      platform.business.id,
      platform.user.id,
      input,
      planSlug,
    );
    revalidatePath(WHITE_LABEL_ROUTE);
    return result;
  });
}
