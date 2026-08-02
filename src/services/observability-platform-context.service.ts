import "server-only";

import { createHash } from "node:crypto";

import { getOrCreateBusinessForOwner } from "@/services/business-profile.service";

export async function getObservabilityBusinessId(ownerId: string): Promise<string> {
  const business = await getOrCreateBusinessForOwner(ownerId);
  return business.id;
}

export function computeLogChecksum(payload: string): string {
  return createHash("sha256").update(payload).digest("hex");
}

export function sealLogMessage(message: string, businessId: string): string {
  return Buffer.from(`${businessId}:${message}`).toString("base64url");
}

export function unsealLogMessage(sealed: string, businessId: string): string {
  const decoded = Buffer.from(sealed, "base64url").toString("utf8");
  const prefix = `${businessId}:`;
  return decoded.startsWith(prefix) ? decoded.slice(prefix.length) : decoded;
}

export const MONITORED_SERVICES = [
  "authentication",
  "business",
  "restaurant",
  "crm",
  "inventory",
  "orders",
  "payments",
  "ai-platform",
  "automation-platform",
  "communication-platform",
  "developer-platform",
  "marketplace",
  "integrations",
] as const;

export type MonitoredService = (typeof MONITORED_SERVICES)[number];
