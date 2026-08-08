"use client";

import { useCallback, useMemo, useState, type ReactNode } from "react";

import { InventoryContext } from "@/modules/inventory/contexts/inventory-context";
import { buildInventoryPlatformContext } from "@/modules/inventory/lib/inventory-platform-context";
import type {
  InventoryCategory,
  InventoryContextValue,
  InventoryLocation,
  InventoryPlatformContext,
  InventoryRecord,
  InventorySearchQuery,
  InventorySupplier,
  PurchaseOrder,
  RecipeIngredientMapping,
} from "@/modules/inventory/types/inventory-platform";

interface InventoryPlatformSnapshotExtended {
  context: InventoryPlatformContext;
  records: InventoryRecord[];
  categories: InventoryCategory[];
  locations: InventoryLocation[];
  suppliers: InventorySupplier[];
  purchaseOrders: PurchaseOrder[];
  recipeMappings: RecipeIngredientMapping[];
}

interface InventoryProviderProps {
  children: ReactNode;
  initialInput?: InventoryPlatformContext;
  initialSnapshot?: InventoryPlatformSnapshotExtended;
}

export function InventoryProvider({
  children,
  initialInput,
  initialSnapshot,
}: InventoryProviderProps) {
  const [input] = useState<InventoryPlatformContext>(
    () =>
      initialInput ??
      initialSnapshot?.context ??
      buildInventoryPlatformContext({ businessId: "", branchId: "" }),
  );
  const [snapshot, setSnapshot] = useState<InventoryPlatformSnapshotExtended | null>(
    initialSnapshot ?? null,
  );
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(() => {
    setIsRefreshing(true);
    setError(null);

    void fetch("/api/inventory?snapshot=true")
      .then(async (response) => {
        const payload = (await response.json()) as {
          success: boolean;
          data?: InventoryPlatformSnapshotExtended;
          error?: string;
        };

        if (!payload.success || !payload.data) {
          throw new Error(payload.error ?? "Failed to refresh inventory data");
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

  const value = useMemo<InventoryContextValue>(() => {
    const context = snapshot?.context ?? input;
    const records = snapshot?.records ?? [];
    const selectedItem = selectedItemId
      ? (records.find((record) => record.item.id === selectedItemId) ?? null)
      : null;

    return {
      context,
      records,
      categories: snapshot?.categories ?? [],
      locations: snapshot?.locations ?? [],
      suppliers: snapshot?.suppliers ?? [],
      purchaseOrders: snapshot?.purchaseOrders ?? [],
      selectedItemId,
      selectedItem,
      selectItem: setSelectedItemId,
      searchItems: (query: InventorySearchQuery) => {
        let results = [...records];

        if (query.categoryId) {
          results = results.filter((record) => record.item.categoryId === query.categoryId);
        }

        if (query.locationId) {
          results = results.filter((record) =>
            record.stocks.some((stock) => stock.locationId === query.locationId),
          );
        }

        if (query.status) {
          results = results.filter((record) => record.item.status === query.status);
        }

        if (query.isPerishable !== undefined) {
          results = results.filter((record) => record.item.isPerishable === query.isPerishable);
        }

        if (query.isLowStock) {
          results = results.filter((record) => record.lowStockAlerts.length > 0);
        }

        if (query.query) {
          const term = query.query.toLowerCase();
          results = results.filter(
            (record) =>
              record.item.name.toLowerCase().includes(term) ||
              record.item.sku.toLowerCase().includes(term) ||
              (record.item.barcode?.toLowerCase().includes(term) ?? false),
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
  }, [input, snapshot, selectedItemId, refresh, isRefreshing, error]);

  return <InventoryContext.Provider value={value}>{children}</InventoryContext.Provider>;
}
