import { cache } from "react";

import { ORDER_MODULE_PERMISSIONS } from "@/modules/orders/constants/permissions";
import { resolveOrderScope, toOmsPlatformContext } from "@/modules/orders/lib/order-scope";
import { orderService } from "@/modules/orders/services/order.service";
import { buildOmsPlatformSnapshot } from "@/modules/orders/services/oms-platform.service";
import { protectedPage } from "@/modules/platform-guards/guards/page.guards";
import type { OmsPlatformSnapshot } from "@/modules/orders/services/oms-platform.service";

export const getOrderModuleContext = cache(async () => {
  const platform = await protectedPage({ permission: ORDER_MODULE_PERMISSIONS.ORDER_READ });
  const scope = resolveOrderScope(platform);
  const platformContext = toOmsPlatformContext(scope);
  const snapshot = await buildOmsPlatformSnapshot(platformContext);

  const permissions = platform.permissions;

  return {
    user: platform.user,
    business: platform.business,
    branchId: scope.branchId,
    platformContext,
    snapshot,
    permissions: {
      canRead: permissions.includes(ORDER_MODULE_PERMISSIONS.ORDER_READ),
      canCreate: permissions.includes(ORDER_MODULE_PERMISSIONS.ORDER_CREATE),
      canUpdate: permissions.includes(ORDER_MODULE_PERMISSIONS.ORDER_UPDATE),
      canDelete: permissions.includes(ORDER_MODULE_PERMISSIONS.ORDER_DELETE),
      canCancel: permissions.includes(ORDER_MODULE_PERMISSIONS.ORDER_CANCEL),
      canRefund: permissions.includes(ORDER_MODULE_PERMISSIONS.ORDER_REFUND),
      canDiscount: permissions.includes(ORDER_MODULE_PERMISSIONS.ORDER_DISCOUNT),
      canTransfer: permissions.includes(ORDER_MODULE_PERMISSIONS.ORDER_TRANSFER),
    },
  };
});

export type OrderModulePageContext = Awaited<ReturnType<typeof getOrderModuleContext>>;

export async function getOrderSnapshot(): Promise<OmsPlatformSnapshot> {
  const context = await getOrderModuleContext();
  return context.snapshot;
}
