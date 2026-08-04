"use client";

import { useMemo } from "react";

import { useKitchenContext } from "@/modules/kitchen/hooks/use-kitchen";
import { KITCHEN_STATUSES } from "@/modules/kitchen/constants/kitchen-status";
import type { KitchenStationContextValue } from "@/modules/kitchen/types/kitchen";

export function useKitchenStation(stationId?: string): KitchenStationContextValue {
  const { stations, records, refresh } = useKitchenContext();

  return useMemo<KitchenStationContextValue>(() => {
    const station = stationId
      ? (stations.find((s) => s.id === stationId) ?? null)
      : (stations[0] ?? null);

    if (!station) {
      return {
        station: null,
        activeRecords: [],
        refresh,
      };
    }

    const activeRecords = records.filter(
      (record) =>
        record.tickets.some((ticket) => ticket.stationId === station.id) &&
        record.order.status !== KITCHEN_STATUSES.SERVED &&
        record.order.status !== KITCHEN_STATUSES.CANCELLED,
    );

    return {
      station,
      activeRecords,
      refresh,
    };
  }, [stationId, stations, records, refresh]);
}
