import { cache } from "react";
import { isRedirectError } from "next/dist/client/components/redirect-error";

import { POS_MODULE_PERMISSIONS } from "@/modules/pos/constants/permissions";
import { protectedPage } from "@/modules/platform-guards/guards/page.guards";
import { PLATFORM_GUARD_ERROR_CODES } from "@/modules/platform-guards/constants/errors";
import { getOrCreatePosSession } from "@/modules/pos/services/pos-session.service";
import { getOrCreatePosCart, listHeldPosOrders } from "@/modules/pos/services/pos-order.service";
import type { PosCartView, PosHeldOrderView, PosTerminalState } from "@/modules/pos/types/pos";
import {
  serializePosCart,
  serializePosCategories,
  serializePosMenuItems,
  serializePosTables,
} from "@/modules/pos/utils/pos-utils";
import { isPlatformGuardError } from "@/modules/platform-guards/utils/platform-guard-errors";
import { listActiveCategories, listMenuItems } from "@/services/menu-management.service";
import { listTablesForBusiness } from "@/services/table.service";

export type PosTerminalLoadState =
  | ({ status: "ready" } & Omit<PosTerminalState, "context">)
  | { status: "forbidden"; message: string }
  | { status: "setup"; message: string }
  | { status: "error"; message: string };

const EMPTY_CART: PosCartView = {
  id: "",
  subtotal: 0,
  items: [],
};

async function safeLoad<T>(
  label: string,
  fallback: T,
  loader: () => Promise<T>,
): Promise<T> {
  try {
    return await loader();
  } catch (error) {
    console.error(`[pos] Failed to load ${label}`, error);
    return fallback;
  }
}

export const getPosTerminalContext = cache(async (): Promise<PosTerminalLoadState> => {
  let context;

  try {
    context = await protectedPage({ permission: POS_MODULE_PERMISSIONS.POS_READ });
  } catch (error) {
    if (isRedirectError(error)) {
      throw error;
    }

    if (isPlatformGuardError(error)) {
      if (error.code === PLATFORM_GUARD_ERROR_CODES.PERMISSION_DENIED) {
        return {
          status: "forbidden",
          message: "You do not have permission to access the point-of-sale terminal.",
        };
      }

      if (
        error.code === PLATFORM_GUARD_ERROR_CODES.ONBOARDING_REQUIRED ||
        error.code === PLATFORM_GUARD_ERROR_CODES.BUSINESS_NOT_ACTIVE
      ) {
        return {
          status: "setup",
          message: "Complete business setup before using the POS terminal.",
        };
      }
    }

    return {
      status: "error",
      message: error instanceof Error ? error.message : "Unable to load POS access context.",
    };
  }

  if (!context.branchId && context.accessibleBranches.length === 0) {
    return {
      status: "setup",
      message: "Add a branch before opening the POS terminal.",
    };
  }

  let posSessionId = "";
  let cart = EMPTY_CART;

  try {
    const posSession = await getOrCreatePosSession(context.business.id);
    posSessionId = posSession.id;
    const activeCart = await getOrCreatePosCart(
      context.business.id,
      posSession.id,
      context.branchId,
    );
    cart = serializePosCart(activeCart);
  } catch (error) {
    console.error("[pos] Failed to initialize POS session or cart", error);
    return {
      status: "setup",
      message: "The POS terminal could not be initialized. Verify branch setup and try again.",
    };
  }

  const [categories, menuItems, tables, heldOrders] = await Promise.all([
    safeLoad("categories", [], () =>
      listActiveCategories(context.business.id, context.branchId).then(serializePosCategories),
    ),
    safeLoad("menu items", [], () =>
      listMenuItems(context.business.id, context.branchId).then(serializePosMenuItems),
    ),
    safeLoad("tables", [], () =>
      listTablesForBusiness(context.business.id, { branchId: context.branchId }).then(
        serializePosTables,
      ),
    ),
    safeLoad<PosHeldOrderView[]>("held orders", [], () =>
      listHeldPosOrders(context.business.id, context.branchId),
    ),
  ]);

  return {
    status: "ready",
    posSessionId,
    cart,
    heldOrders,
    categories,
    menuItems,
    tables,
    orderType: "DINE_IN",
    tableId: null,
    tableName: null,
    customerName: null,
    orderNotes: null,
  };
});

/** @deprecated Use getPosTerminalContext — kept for callers expecting the legacy name. */
export const getPosContext = getPosTerminalContext;
