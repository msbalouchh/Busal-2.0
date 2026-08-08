import "server-only";

import { TABLE_STATUSES } from "@/modules/table-management/constants/table-status";
import { tableManagementService } from "@/modules/table-management/services/table-management.service";
import {
  buildTablePlatformSnapshot,
  getHighUtilizationTables,
} from "@/modules/table-management/services/table-platform.service";
import {
  resolveTableScope,
  toTablePlatformContext,
} from "@/modules/table-management/lib/table-scope";
import type { BusinessContext } from "@/modules/business-context/types/business-context";
import {
  filterByMinCapacity,
  getTableSummary,
  isAvailableTable,
  sortByUtilization,
} from "@/modules/table-management/utils/table-selectors";
import type {
  TableAiContext,
  TablePlatformContext,
  TableRecord,
} from "@/modules/table-management/types/table-management";
import {
  resolveBusinessContextFromModule,
  runModuleAiJsonTask,
  type ModulePlatformContext,
} from "@/services/ai-engine-bridge.service";

const MODULE_NAME = "table-management";

function toModulePlatform(context: TablePlatformContext): ModulePlatformContext {
  return {
    tenantId: context.tenantId,
    workspaceId: context.workspaceId,
    businessId: context.businessId,
    branchId: context.branchId,
    userId: context.userId,
  };
}

async function runTableAiInference<T extends Record<string, unknown>>(
  context: TablePlatformContext,
  task: string,
  data: Record<string, unknown>,
  instructions?: string,
): Promise<T | null> {
  const platform = await resolveBusinessContextFromModule(toModulePlatform(context));
  return runModuleAiJsonTask<T>(platform, {
    module: MODULE_NAME,
    task,
    context: data,
    instructions,
  });
}

export async function buildTableAiContext(
  context: TablePlatformContext,
  tableId: string,
): Promise<TableAiContext | null> {
  const record = await tableManagementService.getTableById(context, tableId);

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

export async function recommendTableForParty(
  context: TablePlatformContext,
  partySize: number,
  floorId?: string,
): Promise<Record<string, unknown>> {
  const candidates = (await tableManagementService.getAvailableTables(context, partySize, floorId))
    .filter(isAvailableTable)
    .filter((record) => record.table.seatCapacity >= partySize);

  const sorted = sortByUtilization(filterByMinCapacity(candidates, partySize));
  const best = sorted[0];

  const dataContext = {
    partySize,
    floorId: floorId ?? null,
    candidateCount: candidates.length,
    candidates: sorted.slice(0, 5).map((record) => ({
      tableId: record.table.id,
      label: record.table.label,
      seatCapacity: record.table.seatCapacity,
      seatingScore: record.aiContext.seatingScore,
      occupancyPercent: record.availability.occupancyPercent,
    })),
    bestMatch: best
      ? {
          tableId: best.table.id,
          label: best.table.label,
          seatCapacity: best.table.seatCapacity,
          seatingScore: best.aiContext.seatingScore,
        }
      : null,
  };

  const aiResult = await runTableAiInference<Record<string, unknown>>(
    context,
    "recommendTableForParty",
    dataContext,
    "Recommend table for party. Return JSON with partySize, recommendation (tableId, label, seatCapacity, zoneId, seatingScore), and rationale.",
  );

  if (aiResult) {
    return aiResult;
  }

  if (!best) {
    return {
      partySize,
      recommendation: null,
      candidateCount: 0,
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
  };
}

export async function predictWaitTime(
  context: TablePlatformContext,
  partySize: number,
  floorId?: string,
): Promise<Record<string, unknown>> {
  const snapshot = await buildTablePlatformSnapshot(context);
  const available = await tableManagementService.getAvailableTables(context, partySize, floorId);
  const occupied = (
    await tableManagementService.searchTables({ floorId, status: TABLE_STATUSES.OCCUPIED }, context)
  ).records;

  const avgOccupancy =
    occupied.length > 0
      ? occupied.reduce((sum, record) => sum + record.analytics.avgOccupancyMinutes, 0) /
        occupied.length
      : 45;

  const dataContext = {
    partySize,
    availableTableCount: available.length,
    occupiedTableCount: occupied.length,
    avgOccupancyMinutes: avgOccupancy,
    realtimeOccupancyPercent: snapshot.realtimeOccupancyPercent,
  };

  const aiResult = await runTableAiInference<Record<string, unknown>>(
    context,
    "predictWaitTime",
    dataContext,
    "Predict wait time. Return JSON with partySize, predictedWaitMinutes, availableTableCount, realtimeOccupancyPercent, and confidence.",
  );

  if (aiResult) {
    return aiResult;
  }

  return dataContext;
}

export async function optimizeSeatingLayout(
  context: TablePlatformContext,
  floorId?: string,
): Promise<Record<string, unknown>> {
  const scope = {
    tenantId: context.tenantId,
    workspaceId: context.workspaceId,
    businessId: context.businessId,
    branchId: context.branchId,
    userId: context.userId,
  };
  const floors = floorId
    ? (await tableManagementService.listFloors(context)).filter((f) => f.floor.id === floorId)
    : await tableManagementService.listFloors(context);

  const tables = floors.flatMap((floor) => floor.tables);
  const highUtil = await getHighUtilizationTables(scope, 3);
  const idleTables = tables.filter(
    (record) =>
      record.table.status === TABLE_STATUSES.AVAILABLE &&
      record.analytics.utilizationScore < 0.2,
  );

  return {
    floorCount: floors.length,
    tableCount: tables.length,
    suggestions: [
      "Prioritize turning cleaning tables within 8 minutes during peak",
      "Keep VIP tables for parties of 4+ with reservation tags",
      idleTables.length > 2
        ? "Consider merging adjacent idle tables during peak wait"
        : "Merge adjacent available tables when wait exceeds 20 minutes",
    ],
    highUtilizationTables: highUtil.map((record) => ({
      tableId: record.table.id,
      label: record.table.label,
      utilizationScore: record.analytics.utilizationScore,
    })),
    idleTables: idleTables.slice(0, 5).map((record) => ({
      tableId: record.table.id,
      label: record.table.label,
    })),
  };
}

export async function detectIdleTables(
  context: TablePlatformContext,
  floorId?: string,
): Promise<Record<string, unknown>> {
  const search = await tableManagementService.searchTables(
    { floorId, status: TABLE_STATUSES.AVAILABLE, pageSize: 100 },
    context,
  );

  const idle = search.records.filter((record) => record.analytics.utilizationScore < 0.25);
  const dataContext = {
    idleCount: idle.length,
    tables: idle.map((record) => ({
      tableId: record.table.id,
      label: record.table.label,
      utilizationScore: record.analytics.utilizationScore,
    })),
  };

  const aiResult = await runTableAiInference<Record<string, unknown>>(
    context,
    "detectIdleTables",
    dataContext,
    "Detect idle tables. Return JSON with idleCount, tables, and recommendedActions.",
  );

  if (aiResult) {
    return aiResult;
  }

  return dataContext;
}

export async function recommendMergeOrSplit(
  context: TablePlatformContext,
  partySize: number,
  floorId?: string,
): Promise<Record<string, unknown>> {
  const available = await tableManagementService.getAvailableTables(context, 2, floorId);
  const noFit = !(await tableManagementService.getAvailableTables(context, partySize, floorId))
    .length;

  const dataContext = {
    partySize,
    floorId: floorId ?? null,
    availableTableCount: available.length,
    noSingleTableFit: noFit,
    candidateTableIds: available.slice(0, 2).map((record) => record.table.id),
  };

  const aiResult = await runTableAiInference<Record<string, unknown>>(
    context,
    "recommendMergeOrSplit",
    dataContext,
    "Recommend merge or split. Return JSON with action (merge|split|assign|monitor), rationale, and candidateTableIds.",
  );

  if (aiResult) {
    return aiResult;
  }

  return {
    partySize,
    noSingleTableFit: noFit,
    availableTableCount: available.length,
  };
}

export async function searchTablesForAi(
  context: TablePlatformContext,
  query: string,
  limit = 10,
): Promise<TableRecord[]> {
  const result = await tableManagementService.searchTables({ query, limit }, context);
  return result.records;
}

export async function buildFloorSummary(
  context: TablePlatformContext,
  floorId: string,
): Promise<Record<string, unknown> | null> {
  const floor = await tableManagementService.getFloorById(context, floorId);

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

export function resolveTableAiContext(platform: BusinessContext): TablePlatformContext {
  return toTablePlatformContext(resolveTableScope(platform));
}
