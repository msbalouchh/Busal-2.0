"use client";

import { useMemo } from "react";

import { useOrdersContext } from "@/modules/orders/hooks/use-orders";

export function useOrder(orderId: string | null) {
  const { orders, selectOrder } = useOrdersContext();

  const order = useMemo(
    () => (orderId ? (orders.find((record) => record.order.id === orderId) ?? null) : null),
    [orders, orderId],
  );

  return { order, selectOrder };
}
