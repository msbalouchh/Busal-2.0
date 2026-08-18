import "server-only";

import { jsonSuccess, withPlatformApiAuth } from "@/modules/platform/api/v1/platform-api-handler";
import { PLATFORM_API_SCOPES } from "@/modules/platform/constants/api-scopes";
import {
  resolveInventoryScopeFromBusiness,
  toInventoryPlatformContext,
} from "@/modules/inventory/lib/inventory-scope";
import { inventoryService } from "@/modules/inventory/services/inventory.service";
import { inventorySearchSchema } from "@/modules/inventory/validation/inventory-schemas";

export async function handleV1ListInventory(request: Request) {
  return withPlatformApiAuth(request, [PLATFORM_API_SCOPES.INVENTORY_READ], async (auth) => {
    const scope = await resolveInventoryScopeFromBusiness(auth.businessId);
    const context = toInventoryPlatformContext(scope);
    const url = new URL(request.url);
    const parsed = inventorySearchSchema.parse(Object.fromEntries(url.searchParams.entries()));
    const result = await inventoryService.search(parsed, context);
    return jsonSuccess(result);
  });
}
