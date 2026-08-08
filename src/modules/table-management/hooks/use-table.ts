"use client";

import { useMemo } from "react";

import { useTableManagement } from "@/modules/table-management/hooks/use-table-management";

export function useTable(tableId: string | null) {
  const { selectedTable, selectTable, refresh, floors, searchTables } = useTableManagement();

  const table = useMemo(() => {
    if (!tableId) return selectedTable;
    if (selectedTable?.table.id === tableId) return selectedTable;

    for (const floor of floors) {
      const match = floor.tables.find((record) => record.table.id === tableId);
      if (match) return match;
    }

    return searchTables({ query: tableId, limit: 1 })[0] ?? null;
  }, [tableId, selectedTable, floors, searchTables]);

  return {
    table,
    selectTable,
    refresh,
  };
}
