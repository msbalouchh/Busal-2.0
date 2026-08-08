"use client";

import { useCallback, useMemo, useState, type ReactNode } from "react";

import { OrdersContext } from "@/modules/orders/contexts/orders-context";
import { buildOmsPlatformContext, type OmsPlatformInput } from "@/modules/orders/lib/oms-platform-context";
import type { OmsPlatformSnapshot } from "@/modules/orders/services/oms-platform.service";
import type { OrderSearchQuery, OrdersContextValue } from "@/modules/orders/types/order";

interface OrdersProviderProps {
  children: ReactNode;
  initialInput?: OmsPlatformInput;
  initialSnapshot?: OmsPlatformSnapshot;
}

export function OrdersProvider({ children, initialInput, initialSnapshot }: OrdersProviderProps) {
  const [input] = useState<OmsPlatformInput>(
    () =>
      initialInput ?? {
        businessId: initialSnapshot?.context.businessId ?? "",
        branchId: initialSnapshot?.context.branchId ?? "",
      },
  );
  const [snapshot, setSnapshot] = useState<OmsPlatformSnapshot | null>(initialSnapshot ?? null);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(() => {
    setIsRefreshing(true);
    setError(null);

    void fetch("/api/orders?pageSize=100")
      .then(async (response) => {
        const payload = (await response.json()) as {
          success: boolean;
          data?: { snapshot: OmsPlatformSnapshot };
          error?: string;
        };

        if (!payload.success || !payload.data?.snapshot) {
          throw new Error(payload.error ?? "Failed to refresh orders");
        }

        setSnapshot(payload.data.snapshot);
      })
      .catch((refreshError: unknown) => {
        setError(refreshError instanceof Error ? refreshError.message : "Refresh failed");
      })
      .finally(() => {
        setIsRefreshing(false);
      });
  }, []);

  const value = useMemo<OrdersContextValue>(() => {
    const context = snapshot?.context ?? buildOmsPlatformContext(input);
    const orders = snapshot?.orders ?? [];
    const selectedOrder = selectedOrderId
      ? (orders.find((record) => record.order.id === selectedOrderId) ?? null)
      : null;

    return {
      context,
      orders,
      selectedOrder,
      selectOrder: setSelectedOrderId,
      searchOrders: (query: OrderSearchQuery) => {
        const normalized = query.query?.toLowerCase() ?? "";
        return orders.filter((record) => {
          if (query.status && record.order.status !== query.status) return false;
          if (query.orderType && record.order.orderType !== query.orderType) return false;
          if (query.customerId && record.order.customerId !== query.customerId) return false;
          if (!normalized) return true;
          const haystack = [
            record.order.orderNumber,
            record.order.customerName ?? "",
            ...record.items.map((item) => item.productName),
          ]
            .join(" ")
            .toLowerCase();
          return haystack.includes(normalized);
        });
      },
      refresh,
      isRefreshing,
      error,
    };
  }, [input, snapshot, selectedOrderId, refresh, isRefreshing, error]);

  return <OrdersContext.Provider value={value}>{children}</OrdersContext.Provider>;
}
