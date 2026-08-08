import { cache } from "react";

import { KITCHEN_MODULE_PERMISSIONS } from "@/modules/kitchen/constants/permissions";
import {
  resolveKitchenScope,
  toKitchenPlatformContext,
} from "@/modules/kitchen/lib/kitchen-scope";
import { protectedPage } from "@/modules/platform-guards/guards/page.guards";
import { buildKitchenPlatformSnapshot } from "@/modules/kitchen/services/kitchen-platform.service";
import type { KitchenPlatformSnapshot } from "@/modules/kitchen/services/kitchen-platform.service";

export const getKitchenModuleContext = cache(async (): Promise<KitchenPlatformSnapshot> => {
  const platform = await protectedPage({ permission: KITCHEN_MODULE_PERMISSIONS.KITCHEN_READ });
  const scope = resolveKitchenScope(platform);
  const context = toKitchenPlatformContext(scope);
  return buildKitchenPlatformSnapshot(context);
});
