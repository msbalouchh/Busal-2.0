"use client";

import { useMemo } from "react";

import { useTableManagement } from "@/modules/table-management/hooks/use-table-management";

export function useTableFloor(floorId: string | null) {
  const { selectedFloor, selectFloor, floors, refresh } = useTableManagement();

  const floor = useMemo(() => {
    if (!floorId) return selectedFloor;
    return floors.find((record) => record.floor.id === floorId) ?? null;
  }, [floorId, selectedFloor, floors]);

  return {
    floor,
    floors,
    selectFloor,
    refresh,
  };
}
