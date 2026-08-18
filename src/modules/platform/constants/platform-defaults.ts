import { BUSAL_LOGO, BUSAL_LOGO_ICON } from "@/constants/brand";

import type { PlatformConsumptionConfig } from "@/modules/platform/types/platform-config.types";

export const PLATFORM_DOMAIN_INDEX_DEFINITION_KEY = "platform.domain.index" as const;

export const PLATFORM_HEADERS = {
  BUSINESS_ID: "x-busal-business-id",
  HOST: "x-busal-host",
  DEPLOYMENT_MODE: "x-busal-deployment-mode",
} as const;

export const NATIVE_BUSAL_BRANDING = {
  platformName: "Busal OS",
  logoUrl: BUSAL_LOGO.src,
  faviconUrl: BUSAL_LOGO_ICON.src,
  primaryColor: "#6366f1",
  secondaryColor: "#818cf8",
  accentColor: "#a5b4fc",
  showBusalBranding: true,
  customerFacingBrandName: "Busal",
} as const;

export function defaultPlatformConsumptionConfig(): PlatformConsumptionConfig {
  const now = new Date().toISOString();

  return {
    deploymentMode: "native",
    whiteLabelEnabled: false,
    platformStatus: "active",
    branding: {
      platformName: NATIVE_BUSAL_BRANDING.platformName,
      logoUrl: NATIVE_BUSAL_BRANDING.logoUrl,
      faviconUrl: NATIVE_BUSAL_BRANDING.faviconUrl,
      primaryColor: NATIVE_BUSAL_BRANDING.primaryColor,
      secondaryColor: NATIVE_BUSAL_BRANDING.secondaryColor,
      accentColor: NATIVE_BUSAL_BRANDING.accentColor,
      showBusalBranding: true,
      customerFacingBrandName: NATIVE_BUSAL_BRANDING.customerFacingBrandName,
      emailBrandName: NATIVE_BUSAL_BRANDING.platformName,
      emailLogoUrl: NATIVE_BUSAL_BRANDING.logoUrl,
    },
    domains: {
      subdomain: null,
      customDomain: null,
      customDomainVerificationStatus: "pending",
      customDomainVerificationToken: null,
      customDomainVerifiedAt: null,
      allowedOrigins: [],
    },
    api: {
      enabled: false,
      rateLimitPerMinute: 120,
      maxKeys: 10,
    },
    webhooks: {
      enabled: false,
      maxSubscriptions: 25,
      retryMaxAttempts: 5,
    },
    embed: {
      enabled: false,
      allowedOrigins: [],
      widgetTypes: ["booking", "ordering", "menu", "portal", "payments", "ai", "analytics"],
    },
    updatedAt: now,
    updatedByUserId: null,
  };
}

export function isNativeBusalHostname(hostname: string): boolean {
  const normalized = hostname.toLowerCase();
  return (
    normalized === "www.getbusal.com" ||
    normalized === "getbusal.com" ||
    normalized === "localhost" ||
    normalized === "127.0.0.1" ||
    normalized.endsWith(".localhost")
  );
}

export function buildTenantSubdomainHostname(slug: string): string {
  return `${slug.toLowerCase()}.getbusal.com`;
}

export function normalizeHostname(host: string | null | undefined): string | null {
  if (!host) {
    return null;
  }

  return host.split(":")[0]?.trim().toLowerCase() ?? null;
}
