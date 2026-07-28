import { cache } from "react";

import { PERMISSION_CODES } from "@/modules/authorization/constants/permissions";
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
import { listTables } from "@/services/table.service";

export const getPosModuleContext = cache(async () => {
  const context = await protectedPage({ permission: PERMISSION_CODES.POS_USE });
  const posSession = await getOrCreatePosSession(context.business.id);
  const cart = await getOrCreatePosCart(context.business.id, posSession.id);

  const [categories, menuItems, tables, heldOrders] = await Promise.all([
    listActiveCategories(context.business.id, context.branchId),
    listMenuItems(context.business.id, context.branchId),
    listTables(context.business.ownerId, { branchId: context.branchId }),
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
