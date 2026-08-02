import "server-only";

import { validateApiKey } from "@/services/api-key-manager.service";
import { checkIpAllowList, checkRateLimit } from "@/services/api-rate-limiter.service";
import { logApiRequest } from "@/services/api-request-logger.service";
import { getDeveloperSettingsByBusinessId } from "@/services/api-application.service";
import { resolveApiVersion } from "@/services/api-version-manager.service";

export interface DeveloperApiAuthContext {
  businessId: string;
  applicationId: string;
  keyId: string;
  permissions: string[];
  apiVersion: ReturnType<typeof resolveApiVersion>;
}

export async function authenticateDeveloperApiRequest(input: {
  apiKey: string;
  ipAddress?: string;
}): Promise<DeveloperApiAuthContext | null> {
  const key = await validateApiKey(input.apiKey);
  if (!key || key.application.status !== "ACTIVE") return null;

  const settings = await getDeveloperSettingsByBusinessId(key.businessId);
  const ipCheck = checkIpAllowList(input.ipAddress ?? "", settings.ipAllowList);
  if (!ipCheck.allowed) return null;

  const rateLimit = checkRateLimit(`api:${key.businessId}:${key.id}`, settings.rateLimitPerMinute);
  if (!rateLimit.allowed) return null;

  return {
    businessId: key.businessId,
    applicationId: key.applicationId,
    keyId: key.id,
    permissions: Array.isArray(key.permissions) ? (key.permissions as string[]) : [],
    apiVersion: resolveApiVersion(key.application.apiVersion),
  };
}

export function authorizeDeveloperApiRequest(
  context: DeveloperApiAuthContext,
  requiredPermission: string,
): boolean {
  if (context.permissions.length === 0) return true;
  return context.permissions.includes(requiredPermission) || context.permissions.includes("*");
}

export async function handleDeveloperGatewayRequest(input: {
  apiKey: string;
  method: string;
  path: string;
  ipAddress?: string;
  requiredPermission?: string;
}) {
  const started = Date.now();
  const auth = await authenticateDeveloperApiRequest({
    apiKey: input.apiKey,
    ipAddress: input.ipAddress,
  });

  if (!auth) {
    return { statusCode: 401, body: { error: "Unauthorized" }, duration: Date.now() - started };
  }

  if (input.requiredPermission && !authorizeDeveloperApiRequest(auth, input.requiredPermission)) {
    await logApiRequest({
      businessId: auth.businessId,
      applicationId: auth.applicationId,
      method: input.method,
      path: input.path,
      statusCode: 403,
      duration: Date.now() - started,
      ipAddress: input.ipAddress,
    });
    return { statusCode: 403, body: { error: "Forbidden" }, duration: Date.now() - started };
  }

  await logApiRequest({
    businessId: auth.businessId,
    applicationId: auth.applicationId,
    method: input.method,
    path: input.path,
    statusCode: 200,
    duration: Date.now() - started,
    ipAddress: input.ipAddress,
    metadata: { version: auth.apiVersion },
  });

  return {
    statusCode: 200,
    body: { ok: true, version: auth.apiVersion, path: input.path },
    duration: Date.now() - started,
  };
}
