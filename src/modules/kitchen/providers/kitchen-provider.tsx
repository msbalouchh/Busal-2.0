"use client";

import { useCallback, useMemo, useState, type ReactNode } from "react";

import { KitchenContext } from "@/modules/kitchen/contexts/kitchen-context";
import { kitchenRepository } from "@/modules/kitchen/repository/kitchen-repository";
import {
  buildKitchenPlatformContext,
  buildKitchenPlatformSnapshot,
  type KitchenPlatformInput,
} from "@/modules/kitchen/services/kitchen-platform.service";
import type { KitchenContextValue, KitchenSearchQuery } from "@/modules/kitchen/types/kitchen";

interface KitchenProviderProps {
  children: ReactNode;
  initialInput?: KitchenPlatformInput;
}

export function KitchenProvider({ children, initialInput }: KitchenProviderProps) {
  const [input] = useState<KitchenPlatformInput>(() => initialInput ?? {});
  const [snapshot, setSnapshot] = useState(() => buildKitchenPlatformSnapshot(input));
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  const refresh = useCallback(() => {
    setSnapshot(buildKitchenPlatformSnapshot(input));
  }, [input]);

  const value = useMemo<KitchenContextValue>(() => {
    const context = buildKitchenPlatformContext(input);
    const selectedOrder = selectedOrderId
      ? (kitchenRepository.findById(selectedOrderId) ?? null)
      : null;

    return {
      context,
      records: snapshot.records,
      stations: snapshot.stations,
      screens: snapshot.screens,
      queues: snapshot.queues,
      selectedOrderId,
      selectedOrder: selectedOrder,
      selectOrder: setSelectedOrderId,
      searchOrders: (query: KitchenSearchQuery) =>
        kitchenRepository.search({
          ...query,
          tenantId: query.tenantId ?? context.tenantId,
          businessId: query.businessId ?? context.businessId,
          branchId: query.branchId ?? context.branchId,
          kitchenId: query.kitchenId ?? context.kitchenId,
        }),
      refresh,
    };
  }, [input, snapshot, selectedOrderId, refresh]);

  return <KitchenContext.Provider value={value}>{children}</KitchenContext.Provider>;
}
