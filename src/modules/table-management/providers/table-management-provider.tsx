"use client";

import { useCallback, useMemo, useState, type ReactNode } from "react";

import { TableManagementContext } from "@/modules/table-management/contexts/table-management-context";
import { tableManagementRepository } from "@/modules/table-management/repository/table-management-repository";
import {
  buildTablePlatformContext,
  buildTablePlatformSnapshot,
  type TablePlatformInput,
} from "@/modules/table-management/services/table-platform.service";
import type {
  TableManagementContextValue,
  TableSearchQuery,
} from "@/modules/table-management/types/table-management";

interface TableManagementProviderProps {
  children: ReactNode;
  initialInput?: TablePlatformInput;
}

export function TableManagementProvider({ children, initialInput }: TableManagementProviderProps) {
  const [input] = useState<TablePlatformInput>(() => initialInput ?? {});
  const [snapshot, setSnapshot] = useState(() => buildTablePlatformSnapshot(input));
  const [selectedFloorId, setSelectedFloorId] = useState<string | null>(null);
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);

  const refresh = useCallback(() => {
    setSnapshot(buildTablePlatformSnapshot(input));
  }, [input]);

  const value = useMemo<TableManagementContextValue>(() => {
    const context = buildTablePlatformContext(input);
    const selectedFloor = selectedFloorId
      ? (snapshot.floors.find((floor) => floor.floor.id === selectedFloorId) ?? null)
      : null;
    const selectedTable = selectedTableId
      ? (tableManagementRepository.findTableById(selectedTableId) ?? null)
      : null;

    return {
      context,
      floors: snapshot.floors,
      selectedFloor,
      selectedTable,
      selectFloor: setSelectedFloorId,
      selectTable: setSelectedTableId,
      searchTables: (query: TableSearchQuery) =>
        tableManagementRepository.searchTables({
          ...query,
          tenantId: query.tenantId ?? context.tenantId,
          businessId: query.businessId ?? context.businessId,
          branchId: query.branchId ?? context.branchId,
        }),
      refresh,
    };
  }, [input, snapshot, selectedFloorId, selectedTableId, refresh]);

  return (
    <TableManagementContext.Provider value={value}>{children}</TableManagementContext.Provider>
  );
}
