import "server-only";

import { getOrCreateBusinessForOwner } from "@/services/business-profile.service";

export async function getEnterpriseTenantId(ownerId: string): Promise<string> {
  const business = await getOrCreateBusinessForOwner(ownerId);
  return business.id;
}

export const IDENTITY_PROVIDER_FRAMEWORKS = ["sso", "saml", "oidc", "ldap", "scim"] as const;

export const ORGANIZATION_UNIT_TYPES = [
  "department",
  "business_unit",
  "division",
  "team",
  "region",
] as const;

export function validateProviderConfiguration(
  providerType: string,
  configuration: Record<string, unknown>,
): { valid: boolean; reason?: string } {
  if (!configuration || typeof configuration !== "object") {
    return { valid: false, reason: "Configuration must be an object" };
  }
  const framework = String(configuration.framework ?? providerType.toLowerCase());
  if (framework === "saml" && !configuration.entityId) {
    return { valid: false, reason: "SAML framework requires entityId in configuration" };
  }
  if (framework === "oidc" && !configuration.clientId) {
    return { valid: false, reason: "OIDC framework requires clientId in configuration" };
  }
  return { valid: true };
}

export function validatePolicyConfiguration(
  category: string,
  configuration: Record<string, unknown>,
): { valid: boolean; reason?: string } {
  if (!configuration || typeof configuration !== "object") {
    return { valid: false, reason: "Configuration must be an object" };
  }
  if (category === "SESSION" && configuration.maxSessionMinutes === undefined) {
    return { valid: true };
  }
  if (category === "PASSWORD" && configuration.minLength !== undefined) {
    const minLength = Number(configuration.minLength);
    if (minLength < 8) return { valid: false, reason: "Password minLength must be at least 8" };
  }
  return { valid: true };
}
