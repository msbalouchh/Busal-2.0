import "server-only";

import { NextResponse } from "next/server";

import { hasRequiredScopes, normalizeApiScopes } from "@/modules/platform/constants/api-scopes";
import {
  assertBusinessPlatformAccess,
  getPlatformConsumptionConfig,
} from "@/modules/platform/services/platform-config.service";
import { canEnableApiAccess } from "@/modules/platform/services/platform-entitlements.service";
import type { ApiPlatformAuthContext } from "@/modules/platform/types/platform-config.types";
import { validateApiKey } from "@/services/api-key-manager.service";
import { getDeveloperSettingsByBusinessId } from "@/services/api-application.service";
import { checkIpAllowList, resolveClientIp } from "@/services/api-rate-limiter.service";
import { prisma } from "@/lib/prisma";

export class PlatformApiAuthError extends Error {
  constructor(
    message: string,
    readonly statusCode: number,
  ) {
    super(message);
    this.name = "PlatformApiAuthError";
  }
}

function extractBearerToken(request: Request): string | null {
  const authorization = request.headers.get("authorization");
  if (!authorization?.startsWith("Bearer ")) {
    return null;
  }

  const token = authorization.slice("Bearer ".length).trim();
  return token.length > 0 ? token : null;
}

export async function authenticateApiRequest(
  request: Request,
): Promise<ApiPlatformAuthContext> {
  const token = extractBearerToken(request);
  if (!token) {
    throw new PlatformApiAuthError("Missing or invalid Authorization header.", 401);
  }

  if (!token.startsWith("bk_")) {
    throw new PlatformApiAuthError("Invalid API key format.", 401);
  }

  const keyRecord = await validateApiKey(token);
  if (!keyRecord) {
    throw new PlatformApiAuthError("Invalid or expired API key.", 401);
  }

  if (keyRecord.application.status !== "ACTIVE") {
    throw new PlatformApiAuthError("API application is not active.", 403);
  }

  const developerSettings = await getDeveloperSettingsByBusinessId(keyRecord.businessId);
  const clientIp = resolveClientIp(request);
  const ipCheck = checkIpAllowList(clientIp, developerSettings.ipAllowList);
  if (!ipCheck.allowed) {
    throw new PlatformApiAuthError("Request IP address is not allowed.", 403);
  }

  try {
    await assertBusinessPlatformAccess(keyRecord.businessId);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Platform access denied.";
    const statusCode = message.includes("not found") ? 404 : 403;
    throw new PlatformApiAuthError(message, statusCode);
  }

  const config = await getPlatformConsumptionConfig(keyRecord.businessId);
  if (!config.api.enabled) {
    throw new PlatformApiAuthError("API access is not enabled for this tenant.", 403);
  }

  const tenant = await prisma.tenantRecord.findUnique({
    where: { businessId: keyRecord.businessId },
    select: { subscriptionPlan: true },
  });

  if (!canEnableApiAccess(tenant?.subscriptionPlan)) {
    throw new PlatformApiAuthError("Current subscription plan does not include API access.", 403);
  }

  const scopes = normalizeApiScopes(keyRecord.permissions);

  return {
    businessId: keyRecord.businessId,
    applicationId: keyRecord.applicationId,
    keyId: keyRecord.id,
    scopes,
    keyName: keyRecord.name,
  };
}

export function requireApiScopes(
  auth: ApiPlatformAuthContext,
  requiredScopes: string[],
): void {
  if (requiredScopes.length === 0) {
    return;
  }

  if (!hasRequiredScopes(auth.scopes, requiredScopes)) {
    throw new PlatformApiAuthError(
      `Missing required scopes: ${requiredScopes.join(", ")}`,
      403,
    );
  }
}

export function handlePlatformApiAuthError(error: unknown): NextResponse {
  if (error instanceof PlatformApiAuthError) {
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        code: "API_AUTH_ERROR",
      },
      { status: error.statusCode },
    );
  }

  console.error("[platform-api]", error);
  return NextResponse.json(
    { success: false, error: "Internal server error", code: "INTERNAL_ERROR" },
    { status: 500 },
  );
}

export async function logPlatformApiRequest(input: {
  businessId: string;
  applicationId: string;
  keyId: string;
  method: string;
  path: string;
  statusCode: number;
  responseTimeMs: number;
  errorMessage?: string;
}): Promise<void> {
  try {
    await prisma.platformApiRequestLog.create({
      data: {
        businessId: input.businessId,
        applicationId: input.applicationId,
        method: input.method,
        path: input.path,
        statusCode: input.statusCode,
        duration: input.responseTimeMs,
        metadata: {
          keyId: input.keyId,
          errorMessage: input.errorMessage ?? null,
        },
      },
    });
  } catch (error) {
    console.error("[platform-api] failed to log request", error);
  }
}
