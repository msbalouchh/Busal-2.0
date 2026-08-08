import { cache } from "react";

import { INVENTORY_MODULE_PERMISSIONS } from "@/modules/inventory/constants/permissions";
import { resolveInventoryScope, toInventoryPlatformContext } from "@/modules/inventory/lib/inventory-scope";
import { protectedPage } from "@/modules/platform-guards/guards/page.guards";
import { buildInventoryPlatformSnapshot } from "@/modules/inventory/services/inventory-platform.service";
import { inventoryService } from "@/modules/inventory/services/inventory.service";

export const getInventoryModuleContext = cache(async () => {
  const platform = await protectedPage({ permission: INVENTORY_MODULE_PERMISSIONS.INVENTORY_READ });
  const scope = resolveInventoryScope(platform);
  const context = toInventoryPlatformContext(scope);

  const [snapshot, categories, locations, suppliers, purchaseOrders, recipeMappings] =
    await Promise.all([
      buildInventoryPlatformSnapshot(context),
      inventoryService.listCategories(context),
      inventoryService.listLocations(context),
      inventoryService.listSuppliers(context),
      inventoryService.listPurchaseOrders(context),
      inventoryService.listRecipeMappings(context),
    ]);

  return {
    ...snapshot,
    categories,
    locations,
    suppliers,
    purchaseOrders,
    recipeMappings,
  };
});
