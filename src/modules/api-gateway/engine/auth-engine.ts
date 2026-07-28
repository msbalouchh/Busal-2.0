import type { ApiAuthMethod } from "@prisma/client";

import type { GatewayAuthContext } from "@/modules/api-gateway/types/api-gateway-types";

export interface AuthCredentials {
  authMethod?: ApiAuthMethod;
  authToken?: string | null;
  apiKey?: string | null;
  serviceAccountId?: string | null;
}

export function detectAuthMethod(credentials: AuthCredentials): ApiAuthMethod | null {
  if (credentials.serviceAccountId) {
    return "SERVICE_ACCOUNT";
  }

  if (credentials.apiKey) {
    return "API_KEY";
  }

  if (credentials.authToken?.startsWith("oauth:")) {
    return "OAUTH2";
  }

  if (credentials.authToken) {
    return "JWT";
  }

  return credentials.authMethod ?? null;
}

export function validateAuthMethod(
  detected: ApiAuthMethod | null,
  allowedMethods: ApiAuthMethod[],
): boolean {
  if (!detected) {
    return false;
  }

  return allowedMethods.includes(detected);
}

export function buildAuthContext(input: {
  authMethod: ApiAuthMethod;
  userId?: string | null;
  businessId?: string | null;
  branchId?: string | null;
  roleSlug?: string | null;
  permissions?: string[];
  isOwner?: boolean;
  apiScopes?: string[];
}): GatewayAuthContext {
  return {
    userId: input.userId ?? null,
    businessId: input.businessId ?? null,
    branchId: input.branchId ?? null,
    roleSlug: input.roleSlug ?? null,
    permissions: input.permissions ?? [],
    isOwner: input.isOwner ?? false,
    apiScopes: input.apiScopes ?? [],
    authMethod: input.authMethod,
  };
}

export function parseApiKey(apiKey: string | null | undefined): { prefix: string; valid: boolean } {
  if (!apiKey || apiKey.length < 8) {
    return { prefix: "", valid: false };
  }

  return { prefix: apiKey.slice(0, 8), valid: apiKey.startsWith("busal_") };
}
