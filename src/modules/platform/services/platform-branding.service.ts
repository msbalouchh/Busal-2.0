import "server-only";

import { headers } from "next/headers";

import {
  NATIVE_BUSAL_BRANDING,
  isNativeBusalHostname,
  normalizeHostname,
} from "@/modules/platform/constants/platform-defaults";
import { loadPlatformConsumptionConfig } from "@/modules/platform/lib/platform-settings";
import { resolveTenantFromHostname } from "@/modules/platform/services/platform-domain.service";
import { resolveDeploymentModeFromHost } from "@/modules/platform/services/platform-config.service";
import type {
  PlatformBrandingSnapshot,
  ResolvedPlatformBranding,
} from "@/modules/platform/types/platform-config.types";

export function resolveNativeBranding(): ResolvedPlatformBranding {
  return {
    platformName: NATIVE_BUSAL_BRANDING.platformName,
    logoUrl: NATIVE_BUSAL_BRANDING.logoUrl,
    faviconUrl: NATIVE_BUSAL_BRANDING.faviconUrl,
    primaryColor: NATIVE_BUSAL_BRANDING.primaryColor,
    secondaryColor: NATIVE_BUSAL_BRANDING.secondaryColor,
    accentColor: NATIVE_BUSAL_BRANDING.accentColor,
    showBusalBranding: true,
    customerFacingBrandName: NATIVE_BUSAL_BRANDING.customerFacingBrandName,
    isWhiteLabel: false,
    deploymentMode: "native",
  };
}

export function resolveBrandingFromConfig(
  config: Awaited<ReturnType<typeof loadPlatformConsumptionConfig>>,
): ResolvedPlatformBranding {
  const branding = config.branding;
  const isWhiteLabel = config.whiteLabelEnabled && !branding.showBusalBranding;

  if (!config.whiteLabelEnabled || branding.showBusalBranding) {
    return {
      ...resolveNativeBranding(),
      platformName: branding.platformName || NATIVE_BUSAL_BRANDING.platformName,
      customerFacingBrandName:
        branding.customerFacingBrandName || NATIVE_BUSAL_BRANDING.customerFacingBrandName,
      showBusalBranding: branding.showBusalBranding,
      isWhiteLabel: config.whiteLabelEnabled && !branding.showBusalBranding,
      deploymentMode: config.deploymentMode,
    };
  }

  return {
    platformName: branding.platformName,
    logoUrl: branding.logoUrl ?? NATIVE_BUSAL_BRANDING.logoUrl,
    faviconUrl: branding.faviconUrl ?? NATIVE_BUSAL_BRANDING.faviconUrl,
    primaryColor: branding.primaryColor,
    secondaryColor: branding.secondaryColor,
    accentColor: branding.accentColor ?? branding.secondaryColor,
    showBusalBranding: false,
    customerFacingBrandName:
      branding.customerFacingBrandName ?? branding.platformName,
    isWhiteLabel,
    deploymentMode: config.deploymentMode,
  };
}

export async function resolveBrandingForBusiness(
  businessId: string,
): Promise<ResolvedPlatformBranding> {
  const config = await loadPlatformConsumptionConfig(businessId);
  return resolveBrandingFromConfig(config);
}

export async function resolveBrandingFromHost(
  host: string | null | undefined,
): Promise<PlatformBrandingSnapshot> {
  const hostname = normalizeHostname(host);

  if (!hostname || isNativeBusalHostname(hostname)) {
    return {
      branding: resolveNativeBranding(),
      hostname,
      businessId: null,
    };
  }

  const resolution = await resolveTenantFromHostname(hostname);
  if (!resolution) {
    return {
      branding: resolveNativeBranding(),
      hostname,
      businessId: null,
    };
  }

  const config = await loadPlatformConsumptionConfig(resolution.businessId);
  const branding = resolveBrandingFromConfig(config);

  return {
    branding: {
      ...branding,
      deploymentMode: resolveDeploymentModeFromHost(hostname, config),
    },
    hostname,
    businessId: resolution.businessId,
  };
}

export async function getServerPlatformBrandingSnapshot(): Promise<PlatformBrandingSnapshot> {
  const headerStore = await headers();
  const host =
    headerStore.get("x-busal-host") ??
    headerStore.get("x-forwarded-host") ??
    headerStore.get("host");

  return resolveBrandingFromHost(host);
}

export async function getDashboardPlatformBrandingSnapshot(
  businessId: string,
): Promise<ResolvedPlatformBranding> {
  const config = await loadPlatformConsumptionConfig(businessId);
  return resolveBrandingFromConfig(config);
}
