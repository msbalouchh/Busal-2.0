import "server-only";

import { createHash } from "node:crypto";

import { getOrCreateBusinessForOwner } from "@/services/business-profile.service";

export async function getCloudBusinessId(ownerId: string): Promise<string> {
  const business = await getOrCreateBusinessForOwner(ownerId);
  return business.id;
}

export const CLOUD_REGIONS = ["eu-west-1", "us-east-1", "ap-southeast-1"] as const;

export const DEFAULT_PLAN_SLUGS = [
  "starter",
  "professional",
  "business",
  "enterprise",
  "custom",
] as const;

export const CLOUD_FEATURE_FLAG_KEYS = [
  "restaurant_module",
  "ai_platform",
  "crm",
  "hr",
  "finance",
  "marketing",
  "marketplace",
  "developer_platform",
  "integrations",
  "documents",
  "automation",
  "communication",
] as const;

export function encryptCloudConfiguration(payload: Record<string, unknown>): string {
  return Buffer.from(JSON.stringify(payload)).toString("base64url");
}

export function decryptCloudConfiguration(sealed: string): Record<string, unknown> {
  try {
    const parsed = JSON.parse(Buffer.from(sealed, "base64url").toString("utf8")) as Record<
      string,
      unknown
    >;
    return parsed;
  } catch {
    return {};
  }
}

export function generateLicenseKey(tenantKey: string, planSlug: string): string {
  return createHash("sha256").update(`${tenantKey}:${planSlug}`).digest("hex").slice(0, 32);
}
