export type PlatformDeploymentMode = "native" | "white_label" | "api_only" | "hybrid";

export type PlatformDomainType = "native" | "subdomain" | "custom";

export type PlatformDomainVerificationStatus = "pending" | "verified" | "failed";

export interface PlatformBrandingConfig {
  platformName: string;
  logoUrl: string | null;
  faviconUrl: string | null;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string | null;
  showBusalBranding: boolean;
  customerFacingBrandName: string | null;
  emailBrandName: string | null;
  emailLogoUrl: string | null;
}

export interface PlatformDomainConfig {
  subdomain: string | null;
  customDomain: string | null;
  customDomainVerificationStatus: PlatformDomainVerificationStatus;
  customDomainVerificationToken: string | null;
  customDomainVerifiedAt: string | null;
  allowedOrigins: string[];
}

export interface PlatformApiConfig {
  enabled: boolean;
  rateLimitPerMinute: number;
  maxKeys: number;
}

export interface PlatformWebhookConfig {
  enabled: boolean;
  maxSubscriptions: number;
  retryMaxAttempts: number;
}

export interface PlatformEmbedConfig {
  enabled: boolean;
  allowedOrigins: string[];
  widgetTypes: string[];
}

export interface PlatformConsumptionConfig {
  deploymentMode: PlatformDeploymentMode;
  whiteLabelEnabled: boolean;
  platformStatus: "active" | "suspended" | "provisioning";
  branding: PlatformBrandingConfig;
  domains: PlatformDomainConfig;
  api: PlatformApiConfig;
  webhooks: PlatformWebhookConfig;
  embed: PlatformEmbedConfig;
  updatedAt: string | null;
  updatedByUserId: string | null;
}

export interface ResolvedPlatformBranding {
  platformName: string;
  logoUrl: string;
  faviconUrl: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  showBusalBranding: boolean;
  customerFacingBrandName: string;
  isWhiteLabel: boolean;
  deploymentMode: PlatformDeploymentMode;
}

export interface TenantDomainResolution {
  businessId: string;
  hostname: string;
  domainType: PlatformDomainType;
  verified: boolean;
}

export interface PlatformBrandingSnapshot {
  branding: ResolvedPlatformBranding;
  hostname: string | null;
  businessId: string | null;
}

export interface ApiPlatformAuthContext {
  businessId: string;
  applicationId: string;
  keyId: string;
  scopes: string[];
  keyName: string;
}

export interface PlatformEntitlements {
  whiteLabel: boolean;
  customDomain: boolean;
  apiAccess: boolean;
  webhooks: boolean;
  embed: boolean;
  advancedApiLimits: boolean;
}
