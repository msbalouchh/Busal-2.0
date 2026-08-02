import "server-only";

import { createHash } from "node:crypto";

import { getOrCreateBusinessForOwner } from "@/services/business-profile.service";

export async function getOwnedBusinessId(ownerId: string): Promise<string> {
  const business = await getOrCreateBusinessForOwner(ownerId);
  return business.id;
}

export function computeAppChecksum(content: string): string {
  return createHash("sha256").update(content).digest("hex");
}
