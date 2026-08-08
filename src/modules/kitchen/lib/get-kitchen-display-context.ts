import { cache } from "react";

import { KITCHEN_MODULE_PERMISSIONS } from "@/modules/kitchen/constants/permissions";
import {
  resolveKitchenScope,
} from "@/modules/kitchen/lib/kitchen-scope";
import { protectedPage } from "@/modules/platform-guards/guards/page.guards";
import {
  refreshElapsedLabels,
  serializeKitchenOrderCard,
  type ClientKitchenOrderCard,
} from "@/modules/kitchen/lib/kitchen-display-utils";
import { kitchenRepository } from "@/modules/kitchen/repository/kitchen-repository";

export const getKitchenDisplayContext = cache(async (): Promise<ClientKitchenOrderCard[]> => {
  const platform = await protectedPage({ permission: KITCHEN_MODULE_PERMISSIONS.KITCHEN_READ });
  const scope = resolveKitchenScope(platform);

  const queueItems = await kitchenRepository.loadDisplayCards(scope);
  return refreshElapsedLabels(queueItems.map(serializeKitchenOrderCard));
});
