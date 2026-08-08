"use client";

import { useCallback, useMemo, useState, type ReactNode } from "react";

import { KitchenContext } from "@/modules/kitchen/contexts/kitchen-context";
import { buildKitchenPlatformContext } from "@/modules/kitchen/lib/kitchen-platform-context";
import type { KitchenPlatformSnapshot } from "@/modules/kitchen/services/kitchen-platform.service";
import type {
  KitchenContextValue,
  KitchenPlatformContext,
  KitchenSearchQuery,
} from "@/modules/kitchen/types/kitchen";

interface KitchenProviderProps {
  children: ReactNode;
  initialInput?: KitchenPlatformContext;
  initialSnapshot?: KitchenPlatformSnapshot;
}

export function KitchenProvider({
  children,
  initialInput,
  initialSnapshot,
}: KitchenProviderProps) {
  const [input] = useState<KitchenPlatformContext>(
    () =>
      initialInput ??
      initialSnapshot?.context ??
      buildKitchenPlatformContext({ businessId: "", branchId: "" }),
  );
  const [snapshot, setSnapshot] = useState<KitchenPlatformSnapshot | null>(
    initialSnapshot ?? null,
  );
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(() => {
    setIsRefreshing(true);
    setError(null);

    void fetch("/api/kitchen?snapshot=true")
      .then(async (response) => {
        const payload = (await response.json()) as {
          success: boolean;
          data?: KitchenPlatformSnapshot;
          error?: string;
        };

        if (!payload.success || !payload.data) {
          throw new Error(payload.error ?? "Failed to refresh kitchen data");
        }

        setSnapshot(payload.data);
      })
      .catch((refreshError: unknown) => {
        setError(refreshError instanceof Error ? refreshError.message : "Refresh failed");
      })
      .finally(() => {
        setIsRefreshing(false);
      });
  }, []);

  const value = useMemo<KitchenContextValue>(() => {
    const context = snapshot?.context ?? input;
    const records = snapshot?.records ?? [];
    const selectedOrder = selectedOrderId
      ? (records.find((record) => record.order.id === selectedOrderId) ?? null)
      : null;

    return {
      context,
      records,
      stations: snapshot?.stations ?? [],
      screens: snapshot?.screens ?? [],
      queues: snapshot?.queues ?? [],
      selectedOrderId,
      selectedOrder,
      selectOrder: setSelectedOrderId,
      searchOrders: (query: KitchenSearchQuery) => {
        let results = [...records];

        if (query.status) {
          results = results.filter((record) => record.order.status === query.status);
        }

        if (query.priority) {
          results = results.filter((record) => record.order.priority === query.priority);
        }

        if (query.stationId) {
          results = results.filter((record) =>
            record.tickets.some((ticket) => ticket.stationId === query.stationId),
          );
        }

        if (query.query) {
          const term = query.query.toLowerCase();
          results = results.filter(
            (record) =>
              record.order.orderNumber.toLowerCase().includes(term) ||
              record.items.some((item) => item.menuItemName.toLowerCase().includes(term)),
          );
        }

        if (query.limit) {
          results = results.slice(0, query.limit);
        }

        return results;
      },
      refresh,
      isRefreshing,
      error,
    };
  }, [input, snapshot, selectedOrderId, refresh, isRefreshing, error]);

  return <KitchenContext.Provider value={value}>{children}</KitchenContext.Provider>;
}
