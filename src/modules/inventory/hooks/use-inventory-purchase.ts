"use client";

import { useMemo } from "react";

import { useInventoryContext } from "@/modules/inventory/hooks/use-inventory";
import { PURCHASE_ORDER_STATUSES } from "@/modules/inventory/constants/inventory-status";
import type { InventoryPurchaseContextValue } from "@/modules/inventory/types/inventory-platform";

export function useInventoryPurchase(): InventoryPurchaseContextValue {
  const { purchaseOrders, suppliers, refresh } = useInventoryContext();

  return useMemo<InventoryPurchaseContextValue>(() => {
    const pendingStatuses: string[] = [
      PURCHASE_ORDER_STATUSES.DRAFT,
      PURCHASE_ORDER_STATUSES.SUBMITTED,
      PURCHASE_ORDER_STATUSES.ORDERED,
      PURCHASE_ORDER_STATUSES.APPROVED,
    ];

    return {
      purchaseOrders,
      suppliers,
      pendingOrderCount: purchaseOrders.filter((po) => pendingStatuses.includes(po.status)).length,
      refresh,
    };
  }, [purchaseOrders, suppliers, refresh]);
}
