import "server-only";

import { checkRateLimit } from "@/modules/api-gateway/engine/rate-limit-engine";
import { getSubscriptionPlanBySlug } from "@/modules/control-center/billing/registry/subscription-plan-registry";
import { getPlatformConsumptionConfig } from "@/modules/platform/services/platform-config.service";
import { resolvePlatformEntitlements } from "@/modules/platform/services/platform-entitlements.service";
import type { ApiPlatformAuthContext } from "@/modules/platform/types/platform-config.types";
import { ensureApiGatewayDefaults } from "@/services/api-gateway.service";
import { prisma } from "@/lib/prisma";

export class PlatformApiRateLimitError extends Error {
  constructor(
    message: string,
    readonly retryAfterMs: number,
    readonly remaining: number,
    readonly limit: number,
  ) {
    super(message);
    this.name = "PlatformApiRateLimitError";
  }
}

export interface PlatformRateLimitResult {
  allowed: boolean;
  remaining: number;
  limit: number;
  retryAfterMs?: number;
}

async function countPlatformApiRequests(input: {
  businessId: string;
  keyId?: string;
  since: Date;
}): Promise<number> {
  const logs = await prisma.platformApiRequestLog.findMany({
    where: {
      businessId: input.businessId,
      createdAt: { gte: input.since },
    },
    select: { metadata: true },
    take: 5000,
  });

  if (!input.keyId) {
    return logs.length;
  }

  return logs.filter((entry) => {
    const metadata = entry.metadata;
    if (!metadata || typeof metadata !== "object") {
      return false;
    }
    return (metadata as Record<string, unknown>).keyId === input.keyId;
  }).length;
}

function resolveDefaultLimit(planSlug: string | null | undefined, configuredLimit: number): number {
  const entitlements = resolvePlatformEntitlements(planSlug);
  const plan = getSubscriptionPlanBySlug(planSlug ?? "busal-core");
  const planLimit = plan?.limits.maxApiCallsPerMonth ?? 10_000;

  const perMinuteFromPlan = Math.max(
    60,
    Math.floor(planLimit / (30 * 24 * 60)),
  );

  if (entitlements.advancedApiLimits) {
    return Math.max(configuredLimit, perMinuteFromPlan * 2);
  }

  return Math.min(configuredLimit, perMinuteFromPlan);
}

export async function enforcePlatformApiRateLimit(
  auth: ApiPlatformAuthContext,
): Promise<PlatformRateLimitResult> {
  await ensureApiGatewayDefaults(auth.businessId);

  const [config, tenant, businessPolicy, keyPolicy] = await Promise.all([
    getPlatformConsumptionConfig(auth.businessId),
    prisma.tenantRecord.findUnique({
      where: { businessId: auth.businessId },
      select: { subscriptionPlan: true },
    }),
    prisma.apiRateLimitPolicy.findFirst({
      where: {
        businessId: auth.businessId,
        scope: "BUSINESS",
        scopeIdentifier: auth.businessId,
        isActive: true,
      },
    }),
    prisma.apiRateLimitPolicy.findFirst({
      where: {
        businessId: auth.businessId,
        scope: "API_KEY",
        scopeIdentifier: auth.keyId,
        isActive: true,
      },
    }),
  ]);

  const since = new Date(Date.now() - 60_000);
  const businessCount = await countPlatformApiRequests({
    businessId: auth.businessId,
    since,
  });

  const businessLimit = businessPolicy?.requestsPerMinute
    ?? resolveDefaultLimit(tenant?.subscriptionPlan, config.api.rateLimitPerMinute);

  const businessCheck = checkRateLimit({
    scope: "BUSINESS",
    scopeIdentifier: auth.businessId,
    requestsPerMinute: businessLimit,
    burstLimit: businessPolicy?.burstLimit ?? 20,
    currentCount: businessCount,
  });

  if (!businessCheck.allowed) {
    throw new PlatformApiRateLimitError(
      "Tenant API rate limit exceeded.",
      businessCheck.retryAfterMs ?? 60_000,
      0,
      businessLimit,
    );
  }

  if (keyPolicy) {
    const keyCount = await countPlatformApiRequests({
      businessId: auth.businessId,
      keyId: auth.keyId,
      since,
    });

    const keyCheck = checkRateLimit({
      scope: "API_KEY",
      scopeIdentifier: auth.keyId,
      requestsPerMinute: keyPolicy.requestsPerMinute,
      burstLimit: keyPolicy.burstLimit,
      currentCount: keyCount,
    });

    if (!keyCheck.allowed) {
      throw new PlatformApiRateLimitError(
        "API key rate limit exceeded.",
        keyCheck.retryAfterMs ?? 60_000,
        0,
        keyPolicy.requestsPerMinute,
      );
    }

    return {
      allowed: true,
      remaining: keyCheck.remaining,
      limit: keyPolicy.requestsPerMinute,
    };
  }

  return {
    allowed: true,
    remaining: businessCheck.remaining,
    limit: businessLimit,
  };
}

export function buildRateLimitHeaders(result: PlatformRateLimitResult): Record<string, string> {
  return {
    "X-RateLimit-Limit": String(result.limit),
    "X-RateLimit-Remaining": String(Math.max(0, result.remaining)),
  };
}
