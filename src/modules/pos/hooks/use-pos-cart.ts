"use client";

import { useMemo } from "react";

import { usePosContext } from "@/modules/pos/hooks/use-pos";
import { calculateOrderTotal } from "@/modules/pos/utils/pos-tax-utils";
import type { PosCartContextValue } from "@/modules/pos/types/pos-platform";

export function usePosCart(orderId?: string): PosCartContextValue {
  const { records, selectedOrder, refresh } = usePosContext();

  return useMemo<PosCartContextValue>(() => {
    const record = orderId ? (records.find((r) => r.order.id === orderId) ?? null) : selectedOrder;

    if (!record) {
      return {
        cart: null,
        cartItems: [],
        subtotalCents: 0,
        totalCents: 0,
        refresh,
      };
    }

    return {
      cart: record.cart,
      cartItems: record.cartItems,
      subtotalCents: record.cart.subtotalCents,
      totalCents: calculateOrderTotal(
        record.cart.subtotalCents,
        record.cart.discountCents,
        record.cart.taxCents,
      ),
      refresh,
    };
  }, [orderId, records, selectedOrder, refresh]);
}
