import { TABLE_STATUSES } from "@/modules/table-management/constants/table-status";
import { tableManagementService } from "@/modules/table-management/services/table-management.service";
import {
  buildTablePlatformSnapshot,
  getHighUtilizationTables,
} from "@/modules/table-management/services/table-platform.service";
import {
  filterByMinCapacity,
  getTableSummary,
  isAvailableTable,
  sortByUtilization,
} from "@/modules/table-management/utils/table-selectors";
import type {
  TableAiContext,
  TableRecord,
} from "@/modules/table-management/types/table-management";

export function buildTableAiContext(tableId: string): TableAiContext | null {
  const record = tableManagementService.getTableById(tableId);

  if (!record) {
    return null;
  }

  return {
    ...record.aiContext,
    summary: getTableSummary(record),
    insights: [
      ...record.aiContext.insights,
      `Occupancy ${record.availability.occupancyPercent}%`,
      `Turnover ${(record.analytics.turnoverRate * 100).toFixed(0)}%`,
    ],
    lastGeneratedAt: new Date().toISOString(),
  };
}

export function recommendTableForParty(
  partySize: number,
  floorId?: string,
): Record<string, unknown> {
  const candidates = tableManagementService
    .getAvailableTables(partySize, floorId)
    .filter(isAvailableTable);

  const sorted = sortByUtilization(filterByMinCapacity(candidates, partySize));
  const best = sorted[0];

  if (!best) {
    return {
      partySize,
      recommendation: null,
      rationale: "No available tables meet party size — consider waiting area or merge",
    };
  }

  return {
    partySize,
    recommendation: {
      tableId: best.table.id,
      label: best.table.label,
      seatCapacity: best.table.seatCapacity,
      zoneId: best.table.zoneId,
      seatingScore: best.aiContext.seatingScore,
    },
    rationale: `Best fit with ${best.table.seatCapacity} seats and ${best.availability.occupancyPercent}% current occupancy`,
  };
}

export function predictWaitTime(partySize: number, floorId?: string): Record<string, unknown> {
  const snapshot = buildTablePlatformSnapshot();
  const available = tableManagementService.getAvailableTables(partySize, floorId);
  const occupied = tableManagementService.searchTables({
    floorId,
    status: TABLE_STATUSES.OCCUPIED,
  });

  const avgOccupancy =
    occupied.length > 0
      ? occupied.reduce((sum, record) => sum + record.analytics.avgOccupancyMinutes, 0) /
        occupied.length
      : 45;

  const waitMinutes =
    available.length > 0
      ? Math.max(5, Math.round(avgOccupancy * 0.15))
      : Math.round(avgOccupancy * 0.6 + partySize * 3);

  return {
    partySize,
    predictedWaitMinutes: waitMinutes,
    availableTableCount: available.length,
    realtimeOccupancyPercent: snapshot.realtimeOccupancyPercent,
    confidence: available.length > 0 ? 0.82 : 0.58,
  };
}

export function optimizeSeatingLayout(floorId?: string): Record<string, unknown> {
  const floors = floorId
    ? tableManagementService.listFloors().filter((f) => f.floor.id === floorId)
    : tableManagementService.listFloors();

  const tables = floors.flatMap((floor) => floor.tables);
  const highUtil = getHighUtilizationTables(3);

  return {
    floorCount: floors.length,
    tableCount: tables.length,
    suggestions: [
      "Prioritize turning cleaning tables within 8 minutes during peak",
      "Keep VIP tables for parties of 4+ with reservation tags",
      "Merge adjacent available tables when wait exceeds 20 minutes",
    ],
    highUtilizationTables: highUtil.map((record) => ({
      tableId: record.table.id,
      label: record.table.label,
      utilizationScore: record.analytics.utilizationScore,
    })),
  };
}

export function searchTablesForAi(query: string, limit = 10): TableRecord[] {
  return tableManagementService.searchTables({ query, limit });
}

export function buildFloorSummary(floorId: string): Record<string, unknown> | null {
  const floor = tableManagementService.getFloorById(floorId);

  if (!floor) {
    return null;
  }

  return {
    floorId: floor.floor.id,
    floorName: floor.floor.name,
    zoneCount: floor.zones.length,
    tableCount: floor.tables.length,
    availableCount: floor.tables.filter((t) => t.table.status === TABLE_STATUSES.AVAILABLE).length,
    occupiedCount: floor.tables.filter((t) => t.table.status === TABLE_STATUSES.OCCUPIED).length,
  };
}
