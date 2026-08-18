export type {
  ApiPlatformAuthContext,
  PlatformBrandingSnapshot,
  PlatformConsumptionConfig,
  PlatformEntitlements,
  ResolvedPlatformBranding,
  TenantDomainResolution,
} from "@/modules/platform/types/platform-config.types";

export {
  PLATFORM_API_SCOPES,
  ALL_PLATFORM_API_SCOPES,
  hasRequiredScopes,
} from "@/modules/platform/constants/api-scopes";

export {
  NATIVE_BUSAL_BRANDING,
  PLATFORM_HEADERS,
  defaultPlatformConsumptionConfig,
} from "@/modules/platform/constants/platform-defaults";

export {
  getPlatformConsumptionConfig,
  getPlatformEntitlementsForBusiness,
  updatePlatformBranding,
  updatePlatformDomains,
  updatePlatformApiConfig,
} from "@/modules/platform/services/platform-config.service";

export {
  resolveBrandingForBusiness,
  resolveBrandingFromHost,
  getServerPlatformBrandingSnapshot,
  getDashboardPlatformBrandingSnapshot,
  resolveNativeBranding,
} from "@/modules/platform/services/platform-branding.service";

export { resolveTenantFromHostname } from "@/modules/platform/services/platform-domain.service";

export { PlatformBrandingProvider, usePlatformBranding } from "@/modules/platform/providers/platform-branding-provider";

export { PlatformBrandLogo, PlatformBrandMark } from "@/modules/platform/components/platform-brand-logo";

export { dispatchV1ApiRequest, listV1ApiRoutes } from "@/modules/platform/api/v1/router";

export { publishPlatformDomainEvent } from "@/modules/platform/services/platform-webhook-delivery.service";

export { issueEmbedToken } from "@/modules/platform/services/platform-embed.service";
