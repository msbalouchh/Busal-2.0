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
import type { KitchenAiContext, KitchenRecord } from "@/modules/kitchen/types/kitchen";

export function buildKitchenAiContext(kitchenOrderId: string): KitchenAiContext | null {
  const record = kitchenService.getById(kitchenOrderId);

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

export function routeOrderToStation(kitchenOrderId: string): Record<string, unknown> | null {
  const record = kitchenService.getById(kitchenOrderId);

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

export function assignStationForTicket(
  ticketId: string,
  stationId?: string,
): Record<string, unknown> | null {
  const records = kitchenService.list();
  const record = records.find((r) => r.tickets.some((t) => t.id === ticketId));

  if (!record) {
    return null;
  }

  const targetStationId = stationId ?? record.aiContext.suggestedStationIds[0] ?? "station-grill";

  const updated = kitchenService.assignStation({
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

export function predictKitchenDelays(limit = 5): Record<string, unknown> {
  const delayed = getDelayedKitchenOrders();
  const active = getActiveKitchenOrders(20);

  const atRisk = active
    .filter((record) => record.aiContext.delayRiskScore >= 0.5)
    .sort((a, b) => b.aiContext.delayRiskScore - a.aiContext.delayRiskScore)
    .slice(0, limit);

  return {
    delayedCount: delayed.length,
    atRiskCount: atRisk.length,
    delayed: delayed.map(toDelaySummary),
    atRisk: atRisk.map(toDelaySummary),
  };
}

export function optimizeKitchenQueue(): Record<string, unknown> {
  const snapshot = buildKitchenPlatformSnapshot();
  const active = snapshot.records.filter(
    (r) =>
      r.order.status !== KITCHEN_STATUSES.SERVED && r.order.status !== KITCHEN_STATUSES.CANCELLED,
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

export function estimatePreparationTime(kitchenOrderId: string): Record<string, unknown> | null {
  const record = kitchenService.getById(kitchenOrderId);

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

export function recommendWorkflowImprovements(): Record<string, unknown> {
  const snapshot = buildKitchenPlatformSnapshot();
  const recommendations: string[] = [];

  if (snapshot.delayedCount > 0) {
    recommendations.push(
      `Address ${snapshot.delayedCount} delayed order(s) — consider re-routing to backup stations`,
    );
  }

  if (snapshot.onTimePercentage < 90) {
    recommendations.push("On-time rate below 90% — review station staffing during peak hours");
  }

  if (snapshot.preparingCount > snapshot.stations.length * 2) {
    recommendations.push("High concurrent prep load — enable expedite screen auto-bump");
  }

  if (recommendations.length === 0) {
    recommendations.push("Kitchen operating within target SLAs — maintain current workflow");
  }

  return {
    kitchenId: snapshot.context.kitchenId,
    onTimePercentage: snapshot.onTimePercentage,
    delayedCount: snapshot.delayedCount,
    recommendations,
  };
}

export function detectKitchenBottlenecks(): Record<string, unknown> {
  const snapshot = buildKitchenPlatformSnapshot();
  const active = snapshot.records.filter(
    (r) =>
      r.order.status !== KITCHEN_STATUSES.SERVED && r.order.status !== KITCHEN_STATUSES.CANCELLED,
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
    .filter((s) => s.utilization >= 75)
    .sort((a, b) => b.utilization - a.utilization);

  return {
    kitchenId: snapshot.context.kitchenId,
    stationLoad,
    bottlenecks,
    primaryBottleneck: bottlenecks[0] ?? null,
  };
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
