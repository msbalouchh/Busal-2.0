import { cache } from "react";

import { POS_MODULE_PERMISSIONS } from "@/modules/pos/constants/permissions";
import { protectedPage } from "@/modules/platform-guards/guards/page.guards";
import { getOrCreatePosSession } from "@/modules/pos/services/pos-session.service";
import { getOrCreatePosCart, listHeldPosOrders } from "@/modules/pos/services/pos-order.service";
import {
  serializePosCart,
  serializePosCategories,
  serializePosMenuItems,
  serializePosTables,
} from "@/modules/pos/utils/pos-utils";
import { listActiveCategories, listMenuItems } from "@/services/menu-management.service";
import { listTablesForBusiness } from "@/services/table.service";

export const getPosTerminalContext = cache(async () => {
  const context = await protectedPage({ permission: POS_MODULE_PERMISSIONS.POS_READ });
  const posSession = await getOrCreatePosSession(context.business.id);
  const cart = await getOrCreatePosCart(context.business.id, posSession.id);

  const [categories, menuItems, tables, heldOrders] = await Promise.all([
    listActiveCategories(context.business.id, context.branchId),
    listMenuItems(context.business.id, context.branchId),
    listTablesForBusiness(context.business.id, { branchId: context.branchId }),
    listHeldPosOrders(context.business.id, context.branchId),
  ]);

  return {
    context,
    posSessionId: posSession.id,
    cart: serializePosCart(cart),
    heldOrders,
    categories: serializePosCategories(categories),
    menuItems: serializePosMenuItems(menuItems),
    tables: serializePosTables(tables),
  };
});
