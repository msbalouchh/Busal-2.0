import "server-only";

import { getOrCreateBusinessForOwner } from "@/services/business-profile.service";

export async function getOwnedBusinessId(ownerId: string): Promise<string> {
  const business = await getOrCreateBusinessForOwner(ownerId);
  return business.id;
}
