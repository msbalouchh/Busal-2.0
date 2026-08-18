import "server-only";

import {
  NATIVE_BUSAL_BRANDING,
  defaultPlatformConsumptionConfig,
  isNativeBusalHostname,
} from "@/modules/platform/constants/platform-defaults";
import {
  loadPlatformConsumptionConfig,
  mergePlatformConsumptionConfig,
} from "@/modules/platform/lib/platform-settings";
import { syncDomainIndexForBusiness } from "@/modules/platform/services/platform-domain.service";
import { PlatformApiAuthError } from "@/modules/platform/services/platform-api-auth.service";
import {
  canEnableApiAccess,
  canEnableCustomDomain,
  canEnableWhiteLabel,
  resolvePlatformEntitlements,
} from "@/modules/platform/services/platform-entitlements.service";
import type {
  PlatformBrandingConfig,
  PlatformConsumptionConfig,
  PlatformDeploymentMode,
  PlatformDomainConfig,
  PlatformEntitlements,
} from "@/modules/platform/types/platform-config.types";
import { prisma } from "@/lib/prisma";

export async function getPlatformConsumptionConfig(
  businessId: string,
): Promise<PlatformConsumptionConfig> {
  return loadPlatformConsumptionConfig(businessId);
}

export async function getPlatformEntitlementsForBusiness(
  businessId: string,
): Promise<PlatformEntitlements> {
  const tenant = await prisma.tenantRecord.findUnique({
    where: { businessId },
    select: { subscriptionPlan: true },
  });

  return resolvePlatformEntitlements(tenant?.subscriptionPlan);
}

export async function updatePlatformBranding(
  businessId: string,
  userId: string,
  patch: Partial<PlatformBrandingConfig>,
  planSlug?: string | null,
): Promise<PlatformConsumptionConfig> {
  const entitlements = resolvePlatformEntitlements(planSlug);
  if (!entitlements.whiteLabel) {
    throw new Error("White-label branding requires Busal Growth or higher.");
  }

  const current = await loadPlatformConsumptionConfig(businessId);
  const branding: PlatformBrandingConfig = {
    ...current.branding,
    ...patch,
    showBusalBranding: patch.showBusalBranding ?? current.branding.showBusalBranding,
  };

  const deploymentMode: PlatformDeploymentMode =
    branding.showBusalBranding && current.deploymentMode === "native"
      ? "hybrid"
      : "white_label";

  return mergePlatformConsumptionConfig(
    businessId,
    {
      whiteLabelEnabled: true,
      deploymentMode,
      branding,
    },
    userId,
  );
}

export async function updatePlatformDomains(
  businessId: string,
  userId: string,
  patch: Partial<PlatformDomainConfig>,
  planSlug?: string | null,
): Promise<PlatformConsumptionConfig> {
  const entitlements = resolvePlatformEntitlements(planSlug);

  if (patch.customDomain && !entitlements.customDomain) {
    throw new Error("Custom domains require Busal Pro or Enterprise.");
  }

  if (patch.subdomain && !entitlements.whiteLabel) {
    throw new Error("Tenant subdomains require Busal Growth or higher.");
  }

  const current = await loadPlatformConsumptionConfig(businessId);
  const domains: PlatformDomainConfig = {
    ...current.domains,
    ...patch,
  };

  const merged = await mergePlatformConsumptionConfig(
    businessId,
    {
      domains,
      deploymentMode: domains.customDomain || domains.subdomain ? "white_label" : current.deploymentMode,
      whiteLabelEnabled: Boolean(domains.customDomain || domains.subdomain || current.whiteLabelEnabled),
    },
    userId,
  );

  await syncDomainIndexForBusiness({
    businessId,
    subdomain: merged.domains.subdomain,
    customDomain: merged.domains.customDomain,
    customDomainVerified: merged.domains.customDomainVerificationStatus === "verified",
  });

  return merged;
}

export async function updatePlatformApiConfig(
  businessId: string,
  userId: string,
  enabled: boolean,
  planSlug?: string | null,
): Promise<PlatformConsumptionConfig> {
  if (enabled && !canEnableApiAccess(planSlug)) {
    throw new Error("API access requires a plan with API gateway entitlement.");
  }

  const current = await loadPlatformConsumptionConfig(businessId);

  return mergePlatformConsumptionConfig(
    businessId,
    {
      api: { ...current.api, enabled },
      deploymentMode: enabled && current.deploymentMode === "native" ? "hybrid" : current.deploymentMode,
    },
    userId,
  );
}

export async function updatePlatformWebhookConfig(
  businessId: string,
  userId: string,
  enabled: boolean,
  planSlug?: string | null,
): Promise<PlatformConsumptionConfig> {
  const entitlements = resolvePlatformEntitlements(planSlug);
  if (enabled && !entitlements.webhooks) {
    throw new Error("Webhooks require Busal Pro or Enterprise.");
  }

  const current = await loadPlatformConsumptionConfig(businessId);

  return mergePlatformConsumptionConfig(
    businessId,
    {
      webhooks: { ...current.webhooks, enabled },
    },
    userId,
  );
}

export async function updatePlatformEmbedConfig(
  businessId: string,
  userId: string,
  patch: Partial<PlatformConsumptionConfig["embed"]>,
  planSlug?: string | null,
): Promise<PlatformConsumptionConfig> {
  const entitlements = resolvePlatformEntitlements(planSlug);
  if (patch.enabled && !entitlements.embed) {
    throw new Error("Embeds require Busal Enterprise.");
  }

  const current = await loadPlatformConsumptionConfig(businessId);

  return mergePlatformConsumptionConfig(
    businessId,
    {
      embed: { ...current.embed, ...patch },
    },
    userId,
  );
}

export async function verifyCustomDomain(
  businessId: string,
  userId: string,
): Promise<Awaited<ReturnType<typeof import("@/modules/platform/services/platform-domain-verification.service").runCustomDomainVerification>>> {
  const { runCustomDomainVerification } = await import(
    "@/modules/platform/services/platform-domain-verification.service"
  );
  return runCustomDomainVerification(businessId, userId);
}

export function isPlatformConfigInitialized(config: PlatformConsumptionConfig): boolean {
  return config.updatedAt !== defaultPlatformConsumptionConfig().updatedAt;
}

export async function assertBusinessPlatformAccess(businessId: string): Promise<void> {
  const tenant = await prisma.tenantRecord.findUnique({
    where: { businessId },
    select: { lifecycleStatus: true },
  });

  if (!tenant) {
    throw new PlatformApiAuthError("Tenant not found.", 404);
  }

  const config = await loadPlatformConsumptionConfig(businessId);
  if (config.platformStatus === "suspended") {
    throw new PlatformApiAuthError("Platform access is suspended for this tenant.", 403);
  }
}

export function resolveDeploymentModeFromHost(
  hostname: string | null,
  config: PlatformConsumptionConfig,
): PlatformDeploymentMode {
  if (!hostname || isNativeBusalHostname(hostname)) {
    return "native";
  }

  return config.deploymentMode === "native" ? "white_label" : config.deploymentMode;
}

export { canEnableWhiteLabel, canEnableCustomDomain, canEnableApiAccess };
