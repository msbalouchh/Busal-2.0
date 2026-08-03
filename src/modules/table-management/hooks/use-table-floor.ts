"use client";

import { useMemo } from "react";

import { useTableManagement } from "@/modules/table-management/hooks/use-table-management";
import { tableManagementService } from "@/modules/table-management/services/table-management.service";

export function useTableFloor(floorId: string | null) {
  const { selectedFloor, selectFloor, floors, refresh } = useTableManagement();

  const floor = useMemo(() => {
    if (!floorId) return selectedFloor;
    return tableManagementService.getFloorById(floorId) ?? null;
  }, [floorId, selectedFloor]);

  return {
    floor,
    floors,
    selectFloor,
    refresh,
  };
}
