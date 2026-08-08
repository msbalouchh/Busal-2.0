import "server-only";

import { KITCHEN_STATUSES } from "@/modules/kitchen/constants/kitchen-status";
import { kitchenService } from "@/modules/kitchen/services/kitchen.service";
import {
  buildKitchenPlatformSnapshot,
  getActiveKitchenOrders,
  getDelayedKitchenOrders,
} from "@/modules/kitchen/services/kitchen-platform.service";
import {
  estimateQueueWaitMinutes,
  groupRecordsByStation,
  sortKitchenQueue,
} from "@/modules/kitchen/utils/kitchen-queue-utils";
import { getKitchenOrderSummary } from "@/modules/kitchen/utils/kitchen-selectors";
import { estimateCompletionAt } from "@/modules/kitchen/utils/kitchen-timer-utils";
import type {
  KitchenAiContext,
  KitchenPlatformContext,
  KitchenRecord,
} from "@/modules/kitchen/types/kitchen";
import {
  resolveBusinessContextFromModule,
  runModuleAiJsonTask,
  type ModulePlatformContext,
} from "@/services/ai-engine-bridge.service";

const MODULE_NAME = "kitchen";

function toModulePlatform(context: KitchenPlatformContext): ModulePlatformContext {
  return {
    tenantId: context.tenantId,
    workspaceId: context.workspaceId,
    businessId: context.businessId,
    branchId: context.branchId,
    userId: context.userId,
  };
}

async function runKitchenAiInference<T extends Record<string, unknown>>(
  context: KitchenPlatformContext,
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

export async function buildKitchenAiContext(
  context: KitchenPlatformContext,
  kitchenOrderId: string,
): Promise<KitchenAiContext | null> {
  const record = await kitchenService.getById(context, kitchenOrderId);

  if (!record) {
    return null;
  }

  return {
    ...record.aiContext,
    summary: getKitchenOrderSummary(record),
    insights: [
      ...record.aiContext.insights,
      `Priority: ${record.order.priority}`,
      `Status: ${record.order.status}`,
      `Delay risk: ${(record.aiContext.delayRiskScore * 100).toFixed(0)}%`,
    ],
    lastGeneratedAt: new Date().toISOString(),
  };
}

export async function routeOrderToStation(
  context: KitchenPlatformContext,
  kitchenOrderId: string,
): Promise<Record<string, unknown> | null> {
  const record = await kitchenService.getById(context, kitchenOrderId);

  if (!record) {
    return null;
  }

  const primaryItem = record.items[0];

  if (!primaryItem) {
    return { error: "No items to route." };
  }

  const suggestedStationId = record.aiContext.suggestedStationIds[0] ?? primaryItem.stationId;

  return {
    kitchenOrderId,
    orderNumber: record.order.orderNumber,
    suggestedStationId,
    stationType: primaryItem.stationType,
    rationale: `Route ${primaryItem.menuItemName} to optimal station based on item type and load`,
    itemCount: record.items.length,
  };
}

export async function assignStationForTicket(
  context: KitchenPlatformContext,
  ticketId: string,
  stationId?: string,
): Promise<Record<string, unknown> | null> {
  const records = await kitchenService.list(context);
  const record = records.find((entry) => entry.tickets.some((ticket) => ticket.id === ticketId));

  if (!record) {
    return null;
  }

  const stations = await kitchenService.listStations(context);
  const targetStationId = stationId ?? record.aiContext.suggestedStationIds[0] ?? stations[0]?.id;

  if (!targetStationId) {
    return { error: "No station available." };
  }

  const updated = await kitchenService.assignStation(context, {
    ticketId,
    stationId: targetStationId,
    isAutoAssigned: true,
  });

  return updated
    ? {
        ticketId,
        stationId: targetStationId,
        orderNumber: updated.order.orderNumber,
        assigned: true,
      }
    : { error: "Assignment failed." };
}

export async function predictKitchenDelays(
  context: KitchenPlatformContext,
  limit = 5,
): Promise<Record<string, unknown>> {
  const [delayed, active] = await Promise.all([
    getDelayedKitchenOrders(context),
    getActiveKitchenOrders(context, 20),
  ]);

  const atRisk = active
    .filter((record) => record.aiContext.delayRiskScore >= 0.5)
    .sort((a, b) => b.aiContext.delayRiskScore - a.aiContext.delayRiskScore)
    .slice(0, limit);

  const dataContext = {
    delayedCount: delayed.length,
    atRiskCount: atRisk.length,
    delayed: delayed.map(toDelaySummary),
    atRisk: atRisk.map(toDelaySummary),
  };

  const aiResult = await runKitchenAiInference<Record<string, unknown>>(
    context,
    "predictKitchenDelays",
    dataContext,
    "Predict kitchen delays. Return JSON with delayedCount, atRiskCount, delayed, atRisk, and recommendations.",
  );

  if (aiResult) {
    return aiResult;
  }

  return dataContext;
}

export async function optimizeKitchenQueue(
  context: KitchenPlatformContext,
): Promise<Record<string, unknown>> {
  const snapshot = await buildKitchenPlatformSnapshot(context);
  const active = snapshot.records.filter(
    (record) =>
      record.order.status !== KITCHEN_STATUSES.SERVED &&
      record.order.status !== KITCHEN_STATUSES.CANCELLED &&
      record.order.status !== KITCHEN_STATUSES.COMPLETED,
  );

  const optimized = sortKitchenQueue(active, "priority");
  const waitMinutes = estimateQueueWaitMinutes(active);

  return {
    kitchenId: snapshot.context.kitchenId,
    orderCount: active.length,
    estimatedWaitMinutes: waitMinutes,
    recommendedOrder: optimized.map((record, index) => ({
      rank: index + 1,
      orderNumber: record.order.orderNumber,
      priority: record.order.priority,
      status: record.order.status,
    })),
    rationale: "Reordered by VIP/urgent priority then promised time",
  };
}

export async function estimatePreparationTime(
  context: KitchenPlatformContext,
  kitchenOrderId: string,
): Promise<Record<string, unknown> | null> {
  const record = await kitchenService.getById(context, kitchenOrderId);

  if (!record) {
    return null;
  }

  const totalMinutes = record.items.reduce((sum, item) => sum + item.estimatedPrepMinutes, 0);
  const startedAt = record.order.acceptedAt ?? record.order.queuedAt;
  const estimatedCompletionAt = estimateCompletionAt(startedAt, totalMinutes);

  return {
    kitchenOrderId,
    orderNumber: record.order.orderNumber,
    itemCount: record.items.length,
    estimatedPrepMinutes: totalMinutes,
    estimatedCompletionAt,
    perItem: record.items.map((item) => ({
      name: item.menuItemName,
      stationType: item.stationType,
      estimatedPrepMinutes: item.estimatedPrepMinutes,
    })),
  };
}

export async function recommendWorkflowImprovements(
  context: KitchenPlatformContext,
): Promise<Record<string, unknown>> {
  const snapshot = await buildKitchenPlatformSnapshot(context);
  const dataContext = {
    kitchenId: snapshot.context.kitchenId,
    onTimePercentage: snapshot.onTimePercentage,
    delayedCount: snapshot.delayedCount,
    preparingCount: snapshot.preparingCount,
    stationCount: snapshot.stations.length,
  };

  const aiResult = await runKitchenAiInference<Record<string, unknown>>(
    context,
    "recommendWorkflowImprovements",
    dataContext,
    "Recommend kitchen workflow improvements. Return JSON with kitchenId, onTimePercentage, delayedCount, and recommendations array.",
  );

  if (aiResult) {
    return aiResult;
  }

  return dataContext;
}

export async function detectKitchenBottlenecks(
  context: KitchenPlatformContext,
): Promise<Record<string, unknown>> {
  const snapshot = await buildKitchenPlatformSnapshot(context);
  const active = snapshot.records.filter(
    (record) =>
      record.order.status !== KITCHEN_STATUSES.SERVED &&
      record.order.status !== KITCHEN_STATUSES.CANCELLED &&
      record.order.status !== KITCHEN_STATUSES.COMPLETED,
  );

  const byStation = groupRecordsByStation(active);
  const stationLoad = snapshot.stations.map((station) => ({
    stationId: station.id,
    stationName: station.name,
    stationType: station.stationType,
    activeOrders: byStation.get(station.id)?.length ?? 0,
    maxConcurrent: station.maxConcurrentItems,
    utilization:
      station.maxConcurrentItems > 0
        ? ((byStation.get(station.id)?.length ?? 0) / station.maxConcurrentItems) * 100
        : 0,
  }));

  const bottlenecks = stationLoad
    .filter((station) => station.utilization >= 75)
    .sort((a, b) => b.utilization - a.utilization);

  const dataContext = {
    kitchenId: snapshot.context.kitchenId,
    stationLoad,
    bottlenecks,
    primaryBottleneck: bottlenecks[0] ?? null,
  };

  const aiResult = await runKitchenAiInference<Record<string, unknown>>(
    context,
    "detectKitchenBottlenecks",
    dataContext,
    "Detect kitchen bottlenecks. Return JSON with kitchenId, stationLoad, bottlenecks, primaryBottleneck, and recommendations.",
  );

  if (aiResult) {
    return aiResult;
  }

  return dataContext;
}

export async function forecastKitchenLoad(
  context: KitchenPlatformContext,
): Promise<Record<string, unknown>> {
  const snapshot = await buildKitchenPlatformSnapshot(context);
  const activeCount = snapshot.records.filter(
    (record) =>
      record.order.status === KITCHEN_STATUSES.PREPARING ||
      record.order.status === KITCHEN_STATUSES.QUEUED ||
      record.order.status === KITCHEN_STATUSES.PENDING,
  ).length;

  const dataContext = {
    kitchenId: snapshot.context.kitchenId,
    currentActiveOrders: activeCount,
    stationCount: snapshot.stations.length,
    avgPrepMinutes: snapshot.avgPrepMinutes,
  };

  const aiResult = await runKitchenAiInference<Record<string, unknown>>(
    context,
    "forecastKitchenLoad",
    dataContext,
    "Forecast kitchen load. Return JSON with kitchenId, currentActiveOrders, projectedPeakOrders, estimatedClearMinutes, and loadLevel.",
  );

  if (aiResult) {
    return aiResult;
  }

  return {
    kitchenId: snapshot.context.kitchenId,
    currentActiveOrders: activeCount,
    stationCount: snapshot.stations.length,
    avgPrepMinutes: snapshot.avgPrepMinutes,
  };
}

export async function suggestStaffAllocation(
  context: KitchenPlatformContext,
): Promise<Record<string, unknown>> {
  const bottlenecks = await detectKitchenBottlenecks(context);
  const stationLoad = Array.isArray(bottlenecks.stationLoad)
    ? (bottlenecks.stationLoad as Array<Record<string, unknown>>)
    : [];

  const dataContext = {
    kitchenId: context.kitchenId,
    stationLoad,
  };

  const aiResult = await runKitchenAiInference<Record<string, unknown>>(
    context,
    "suggestStaffAllocation",
    dataContext,
    "Suggest kitchen staff allocation. Return JSON with kitchenId, suggestions array (stationId, stationName, recommendation), and totalSuggestions.",
  );

  if (aiResult) {
    return aiResult;
  }

  return {
    kitchenId: context.kitchenId,
    stationCount: stationLoad.length,
  };
}

export async function recommendStationBalancing(
  context: KitchenPlatformContext,
): Promise<Record<string, unknown>> {
  const snapshot = await buildKitchenPlatformSnapshot(context);
  const active = snapshot.records.filter(
    (record) =>
      record.order.status === KITCHEN_STATUSES.PREPARING ||
      record.order.status === KITCHEN_STATUSES.QUEUED,
  );

  const byStation = groupRecordsByStation(active);
  const overloaded = snapshot.stations
    .map((station) => ({
      stationId: station.id,
      stationName: station.name,
      activeOrders: byStation.get(station.id)?.length ?? 0,
      capacity: station.maxConcurrentItems,
    }))
    .filter((station) => station.activeOrders > station.capacity);

  const underloaded = snapshot.stations
    .map((station) => ({
      stationId: station.id,
      stationName: station.name,
      activeOrders: byStation.get(station.id)?.length ?? 0,
      spareCapacity: station.maxConcurrentItems - (byStation.get(station.id)?.length ?? 0),
    }))
    .filter((station) => station.spareCapacity >= 2);

  const dataContext = {
    kitchenId: context.kitchenId,
    overloaded,
    underloaded,
  };

  const aiResult = await runKitchenAiInference<Record<string, unknown>>(
    context,
    "recommendStationBalancing",
    dataContext,
    "Recommend station balancing moves. Return JSON with kitchenId, overloaded, underloaded, and rebalanceMoves array.",
  );

  if (aiResult) {
    return aiResult;
  }

  return dataContext;
}

function toDelaySummary(record: KitchenRecord): Record<string, unknown> {
  return {
    kitchenOrderId: record.order.id,
    orderNumber: record.order.orderNumber,
    status: record.order.status,
    delayRiskScore: record.aiContext.delayRiskScore,
    bottleneckStationId: record.aiContext.bottleneckStationId,
    tableLabel: record.order.tableLabel,
  };
}
