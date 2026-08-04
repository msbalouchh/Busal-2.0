"use client";

import { useCallback, useMemo, useState, type ReactNode } from "react";

import { InventoryContext } from "@/modules/inventory/contexts/inventory-context";
import { inventoryRepository } from "@/modules/inventory/repository/inventory-repository";
import {
  buildInventoryPlatformContext,
  buildInventoryPlatformSnapshot,
  type InventoryPlatformInput,
} from "@/modules/inventory/services/inventory-platform.service";
import type {
  InventoryContextValue,
  InventorySearchQuery,
} from "@/modules/inventory/types/inventory-platform";

interface InventoryProviderProps {
  children: ReactNode;
  initialInput?: InventoryPlatformInput;
}

export function InventoryProvider({ children, initialInput }: InventoryProviderProps) {
  const [input] = useState<InventoryPlatformInput>(() => initialInput ?? {});
  const [snapshot, setSnapshot] = useState(() => buildInventoryPlatformSnapshot(input));
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  const refresh = useCallback(() => {
    setSnapshot(buildInventoryPlatformSnapshot(input));
  }, [input]);

  const value = useMemo<InventoryContextValue>(() => {
    const context = buildInventoryPlatformContext(input);
    const selectedItem = selectedItemId
      ? (inventoryRepository.findById(selectedItemId) ?? null)
      : null;

    return {
      context,
      records: snapshot.records,
      categories: inventoryRepository.listCategories(),
      locations: inventoryRepository.listLocations(),
      suppliers: inventoryRepository.listSuppliers(),
      purchaseOrders: inventoryRepository.listPurchaseOrders(),
      selectedItemId,
      selectedItem,
      selectItem: setSelectedItemId,
      searchItems: (query: InventorySearchQuery) =>
        inventoryRepository.search({
          ...query,
          tenantId: query.tenantId ?? context.tenantId,
          businessId: query.businessId ?? context.businessId,
          branchId: query.branchId ?? context.branchId,
        }),
      refresh,
    };
  }, [input, snapshot, selectedItemId, refresh]);

  return <InventoryContext.Provider value={value}>{children}</InventoryContext.Provider>;
}
