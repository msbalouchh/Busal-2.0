"use client";

import { useMemo } from "react";

import { useInventoryContext } from "@/modules/inventory/hooks/use-inventory";
import { isLowStock } from "@/modules/inventory/utils/inventory-selectors";
import type { InventoryStockContextValue } from "@/modules/inventory/types/inventory-platform";

export function useInventoryStock(locationId?: string): InventoryStockContextValue {
  const { locations, records, context, refresh } = useInventoryContext();

  return useMemo<InventoryStockContextValue>(() => {
    const location = locationId
      ? (locations.find((l) => l.id === locationId) ?? null)
      : (locations.find((l) => l.id === context.defaultLocationId) ?? null);

    const locationRecords = location
      ? records.filter((r) => r.stocks.some((s) => s.locationId === location.id))
      : records;

    return {
      location,
      records: locationRecords,
      lowStockCount: locationRecords.filter(isLowStock).length,
      refresh,
    };
  }, [locationId, locations, records, context.defaultLocationId, refresh]);
}
