"use client";

import { useCallback, useMemo, useState, type ReactNode } from "react";

import { OrdersContext } from "@/modules/orders/contexts/orders-context";
import { orderRepository } from "@/modules/orders/repository/order-repository";
import {
  buildOmsPlatformContext,
  buildOmsPlatformSnapshot,
  type OmsPlatformInput,
} from "@/modules/orders/services/oms-platform.service";
import type { OrderSearchQuery, OrdersContextValue } from "@/modules/orders/types/order";

interface OrdersProviderProps {
  children: ReactNode;
  initialInput?: OmsPlatformInput;
}

export function OrdersProvider({ children, initialInput }: OrdersProviderProps) {
  const [input] = useState<OmsPlatformInput>(() => initialInput ?? {});
  const [snapshot, setSnapshot] = useState(() => buildOmsPlatformSnapshot(input));
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  const refresh = useCallback(() => {
    setSnapshot(buildOmsPlatformSnapshot(input));
  }, [input]);

  const value = useMemo<OrdersContextValue>(() => {
    const context = buildOmsPlatformContext(input);
    const selectedOrder = selectedOrderId
      ? (orderRepository.findById(selectedOrderId) ?? null)
      : null;

    return {
      context,
      orders: snapshot.orders,
      selectedOrder,
      selectOrder: setSelectedOrderId,
      searchOrders: (query: OrderSearchQuery) =>
        orderRepository.search({
          ...query,
          tenantId: query.tenantId ?? context.tenantId,
          businessId: query.businessId ?? context.businessId,
          branchId: query.branchId ?? context.branchId,
        }),
      refresh,
    };
  }, [input, snapshot, selectedOrderId, refresh]);

  return <OrdersContext.Provider value={value}>{children}</OrdersContext.Provider>;
}
