import "server-only";

import { TABLE_STATUSES } from "@/modules/table-management/constants/table-status";
import { tableManagementRepository } from "@/modules/table-management/repository/table-management-repository";
import {
  buildTableScopeFromInput,
  toTablePlatformContext,
  type TableTenantScope,
} from "@/modules/table-management/lib/table-scope";
import type { TablePlatformInput } from "@/modules/table-management/lib/table-platform-context";
import type {
  TablePlatformSnapshot,
  TableRecord,
} from "@/modules/table-management/types/table-management";

export type { TablePlatformInput };

export async function buildTablePlatformSnapshot(
  input: TablePlatformInput,
): Promise<TablePlatformSnapshot> {
  const scope = buildTableScopeFromInput(input);
  const context = toTablePlatformContext(scope);
  const floors = await tableManagementRepository.listFloors(scope);
  const tables = floors.flatMap((floor) => floor.tables);
  const countByStatus = (status: string) =>
    tables.filter((record) => record.table.status === status).length;

  const utilizationSum = tables.reduce((sum, record) => sum + record.analytics.utilizationScore, 0);

  const occupiedSeats = tables.reduce(
    (sum, record) => sum + record.seats.filter((seat) => seat.isOccupied).length,
    0,
  );
  const totalSeats = tables.reduce((sum, record) => sum + record.table.seatCapacity, 0);

  return {
    context,
    floors,
    tableCount: tables.length,
    availableCount: countByStatus(TABLE_STATUSES.AVAILABLE),
    occupiedCount: countByStatus(TABLE_STATUSES.OCCUPIED),
    reservedCount: countByStatus(TABLE_STATUSES.RESERVED),
    cleaningCount: countByStatus(TABLE_STATUSES.CLEANING),
    blockedCount: countByStatus(TABLE_STATUSES.BLOCKED),
    outOfServiceCount: countByStatus(TABLE_STATUSES.OUT_OF_SERVICE),
    avgUtilizationScore: tables.length > 0 ? utilizationSum / tables.length : 0,
    realtimeOccupancyPercent: totalSeats > 0 ? Math.round((occupiedSeats / totalSeats) * 100) : 0,
  };
}

export async function getHighUtilizationTables(
  scope: TableTenantScope,
  limit = 5,
): Promise<TableRecord[]> {
  const floors = await tableManagementRepository.listFloors(scope);
  return floors
    .flatMap((floor) => floor.tables)
    .sort((a, b) => b.analytics.utilizationScore - a.analytics.utilizationScore)
    .slice(0, limit);
}
