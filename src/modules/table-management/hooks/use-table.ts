"use client";

import { useMemo } from "react";

import { useTableManagement } from "@/modules/table-management/hooks/use-table-management";
import { tableManagementService } from "@/modules/table-management/services/table-management.service";

export function useTable(tableId: string | null) {
  const { selectedTable, selectTable, refresh } = useTableManagement();

  const table = useMemo(() => {
    if (!tableId) return selectedTable;
    return tableManagementService.getTableById(tableId) ?? null;
  }, [tableId, selectedTable]);

  return {
    table,
    selectTable,
    refresh,
  };
}
