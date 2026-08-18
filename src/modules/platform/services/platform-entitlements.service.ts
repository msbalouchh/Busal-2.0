import "server-only";

import {
  BUSAL_COMMERCIAL_PLAN_SLUGS,
  getSubscriptionPlanBySlug,
} from "@/modules/control-center/billing/registry/subscription-plan-registry";
import type { PlatformEntitlements } from "@/modules/platform/types/platform-config.types";

const WHITE_LABEL_PLANS = new Set<string>([
  BUSAL_COMMERCIAL_PLAN_SLUGS.GROWTH,
  BUSAL_COMMERCIAL_PLAN_SLUGS.PRO,
  BUSAL_COMMERCIAL_PLAN_SLUGS.ENTERPRISE,
]);

const CUSTOM_DOMAIN_PLANS = new Set<string>([
  BUSAL_COMMERCIAL_PLAN_SLUGS.PRO,
  BUSAL_COMMERCIAL_PLAN_SLUGS.ENTERPRISE,
]);

const WEBHOOK_PLANS = new Set<string>([
  BUSAL_COMMERCIAL_PLAN_SLUGS.PRO,
  BUSAL_COMMERCIAL_PLAN_SLUGS.ENTERPRISE,
]);

const EMBED_PLANS = new Set<string>([BUSAL_COMMERCIAL_PLAN_SLUGS.ENTERPRISE]);

const ADVANCED_API_PLANS = new Set<string>([
  BUSAL_COMMERCIAL_PLAN_SLUGS.PRO,
  BUSAL_COMMERCIAL_PLAN_SLUGS.ENTERPRISE,
]);

export function resolvePlatformEntitlements(planSlug: string | null | undefined): PlatformEntitlements {
  const slug = planSlug?.toLowerCase() ?? BUSAL_COMMERCIAL_PLAN_SLUGS.CORE;
  const plan = getSubscriptionPlanBySlug(slug);
  const features = plan?.features ?? [];

  return {
    whiteLabel: WHITE_LABEL_PLANS.has(slug),
    customDomain: CUSTOM_DOMAIN_PLANS.has(slug),
    apiAccess: features.includes("api_gateway"),
    webhooks: WEBHOOK_PLANS.has(slug),
    embed: EMBED_PLANS.has(slug),
    advancedApiLimits: ADVANCED_API_PLANS.has(slug),
  };
}

export function canEnableWhiteLabel(planSlug: string | null | undefined): boolean {
  return resolvePlatformEntitlements(planSlug).whiteLabel;
}

export function canEnableApiAccess(planSlug: string | null | undefined): boolean {
  return resolvePlatformEntitlements(planSlug).apiAccess;
}

export function canEnableCustomDomain(planSlug: string | null | undefined): boolean {
  return resolvePlatformEntitlements(planSlug).customDomain;
}
