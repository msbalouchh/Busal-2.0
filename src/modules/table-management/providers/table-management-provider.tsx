"use client";

import { useCallback, useMemo, useState, type ReactNode } from "react";

import { TableManagementContext } from "@/modules/table-management/contexts/table-management-context";
import {
  buildTablePlatformContext,
  type TablePlatformInput,
} from "@/modules/table-management/lib/table-platform-context";
import type {
  TableManagementContextValue,
  TablePlatformSnapshot,
  TableSearchQuery,
} from "@/modules/table-management/types/table-management";

interface TableManagementProviderProps {
  children: ReactNode;
  initialInput?: TablePlatformInput;
  initialSnapshot?: TablePlatformSnapshot;
}

export function TableManagementProvider({
  children,
  initialInput,
  initialSnapshot,
}: TableManagementProviderProps) {
  const [input] = useState<TablePlatformInput>(
    () =>
      initialInput ?? {
        businessId: initialSnapshot?.context.businessId ?? "",
        branchId: initialSnapshot?.context.branchId ?? "",
      },
  );
  const [snapshot, setSnapshot] = useState<TablePlatformSnapshot | null>(initialSnapshot ?? null);
  const [selectedFloorId, setSelectedFloorId] = useState<string | null>(null);
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(() => {
    setIsRefreshing(true);
    setError(null);

    void fetch("/api/table-management/tables?pageSize=100")
      .then(async (response) => {
        const payload = (await response.json()) as {
          success: boolean;
          data?: { snapshot: TablePlatformSnapshot };
          error?: string;
        };

        if (!payload.success || !payload.data?.snapshot) {
          throw new Error(payload.error ?? "Failed to refresh tables");
        }

        setSnapshot(payload.data.snapshot);
      })
      .catch((refreshError: unknown) => {
        setError(refreshError instanceof Error ? refreshError.message : "Refresh failed");
      })
      .finally(() => {
        setIsRefreshing(false);
      });
  }, [input, snapshot?.floors]);

  const value = useMemo<TableManagementContextValue>(() => {
    const context = snapshot?.context ?? buildTablePlatformContext(input);
    const floors = snapshot?.floors ?? [];
    const selectedFloor = selectedFloorId
      ? (floors.find((floor) => floor.floor.id === selectedFloorId) ?? null)
      : null;

    const allTables = floors.flatMap((floor) => floor.tables);
    const selectedTable = selectedTableId
      ? (allTables.find((record) => record.table.id === selectedTableId) ?? null)
      : null;

    return {
      context,
      floors,
      snapshot,
      selectedFloor,
      selectedTable,
      selectFloor: setSelectedFloorId,
      selectTable: setSelectedTableId,
      searchTables: (query: TableSearchQuery) => {
        let results = allTables;

        if (query.floorId) {
          results = results.filter((record) => record.table.floorId === query.floorId);
        }

        if (query.status) {
          results = results.filter((record) => record.table.status === query.status);
        }

        if (query.minCapacity) {
          results = results.filter((record) => record.table.seatCapacity >= query.minCapacity!);
        }

        if (query.query) {
          const normalized = query.query.toLowerCase();
          results = results.filter((record) =>
            [record.table.label, record.table.id, record.reservationState.guestName ?? ""]
              .join(" ")
              .toLowerCase()
              .includes(normalized),
          );
        }

        const limit = query.limit ?? query.pageSize ?? results.length;
        return results.slice(0, limit);
      },
      refresh,
      isRefreshing,
      error,
    };
  }, [input, snapshot, selectedFloorId, selectedTableId, refresh, isRefreshing, error]);

  return (
    <TableManagementContext.Provider value={value}>{children}</TableManagementContext.Provider>
  );
}
