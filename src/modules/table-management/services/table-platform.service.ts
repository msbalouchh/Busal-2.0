import { TABLE_STATUSES } from "@/modules/table-management/constants/table-status";
import { DEFAULT_TABLE_SCOPE } from "@/modules/table-management/constants/mock-data";
import { tableManagementRepository } from "@/modules/table-management/repository/table-management-repository";
import type {
  FloorRecord,
  TablePlatformContext,
  TableRecord,
} from "@/modules/table-management/types/table-management";

export interface TablePlatformSnapshot {
  context: TablePlatformContext;
  floors: FloorRecord[];
  tableCount: number;
  availableCount: number;
  occupiedCount: number;
  reservedCount: number;
  cleaningCount: number;
  blockedCount: number;
  outOfServiceCount: number;
  avgUtilizationScore: number;
  realtimeOccupancyPercent: number;
}

export interface TablePlatformInput {
  tenantId?: string;
  workspaceId?: string;
  businessId?: string;
  branchId?: string;
  userId?: string;
}

export function buildTablePlatformContext(input: TablePlatformInput = {}): TablePlatformContext {
  return {
    tenantId: input.tenantId ?? DEFAULT_TABLE_SCOPE.tenantId,
    workspaceId: input.workspaceId ?? DEFAULT_TABLE_SCOPE.workspaceId,
    businessId: input.businessId ?? DEFAULT_TABLE_SCOPE.businessId,
    branchId: input.branchId ?? DEFAULT_TABLE_SCOPE.branchId,
    userId: input.userId ?? DEFAULT_TABLE_SCOPE.userId,
  };
}

export function buildTablePlatformSnapshot(input: TablePlatformInput = {}): TablePlatformSnapshot {
  const context = buildTablePlatformContext(input);
  const floors = tableManagementRepository
    .listFloors()
    .filter(
      (record) =>
        record.floor.tenantId === context.tenantId &&
        record.floor.businessId === context.businessId,
    );

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

export function getDefaultTableSnapshot(): TablePlatformSnapshot {
  return buildTablePlatformSnapshot();
}

export function getHighUtilizationTables(limit = 5): TableRecord[] {
  return tableManagementRepository
    .listTables()
    .sort((a, b) => b.analytics.utilizationScore - a.analytics.utilizationScore)
    .slice(0, limit);
}
