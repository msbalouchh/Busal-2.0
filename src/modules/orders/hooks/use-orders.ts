"use client";

import { useContext } from "react";

import { OrdersContext } from "@/modules/orders/contexts/orders-context";
import type { OrdersContextValue } from "@/modules/orders/types/order";

export function useOrdersContext(): OrdersContextValue {
  const context = useContext(OrdersContext);

  if (!context) {
    throw new Error("useOrdersContext must be used within OrdersProvider");
  }

  return context;
}

export function useOrders(): OrdersContextValue {
  return useOrdersContext();
}
