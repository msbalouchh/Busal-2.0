import "server-only";

import { ORDER_STATUSES } from "@/modules/orders/constants/order-status";
import { orderService } from "@/modules/orders/services/order.service";
import { buildOmsPlatformSnapshot } from "@/modules/orders/services/oms-platform.service";
import { getOrderSummary } from "@/modules/orders/utils/order-selectors";
import type { OmsPlatformContext, OrderAiContext, OrderRecord } from "@/modules/orders/types/order";
import {
  resolveBusinessContextFromModule,
  runModuleAiJsonTask,
  type ModulePlatformContext,
} from "@/services/ai-engine-bridge.service";

const MODULE_NAME = "orders";

function toModulePlatform(context: OmsPlatformContext): ModulePlatformContext {
  return {
    tenantId: context.tenantId,
    workspaceId: context.workspaceId,
    businessId: context.businessId,
    branchId: context.branchId,
    userId: context.userId,
  };
}

async function runOrderAiInference<T extends Record<string, unknown>>(
  context: OmsPlatformContext,
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

export async function buildOrderAiContext(
  context: OmsPlatformContext,
  orderId: string,
): Promise<OrderAiContext | null> {
  const record = await orderService.getById(context, orderId);
  if (!record) {
    return null;
  }

  return {
    ...record.aiContext,
    summary: getOrderSummary(record),
    insights: [
      ...record.aiContext.insights,
      `Delay risk: ${(record.analytics.delayRiskScore * 100).toFixed(0)}%`,
      `Fulfillment: ${record.fulfillment.status.replace("_", " ")}`,
    ],
    lastGeneratedAt: new Date().toISOString(),
  };
}

export async function generateUpsellRecommendations(
  context: OmsPlatformContext,
  orderId: string,
): Promise<string[]> {
  const record = await orderService.getById(context, orderId);
  if (!record) {
    return [];
  }

  const dataContext = {
    orderId,
    orderNumber: record.order.orderNumber,
    orderType: record.order.orderType,
    totalPence: record.order.totalPence,
    items: record.items.map((item) => item.productName),
    existingSuggestions: record.aiContext.upsellSuggestions,
  };

  const aiResult = await runOrderAiInference<{ suggestions?: string[] }>(
    context,
    "generateUpsellRecommendations",
    dataContext,
    "Generate upsell recommendations. Return JSON with suggestions string array.",
  );

  if (aiResult?.suggestions?.length) {
    return aiResult.suggestions;
  }

  return record.aiContext.upsellSuggestions.length > 0
    ? record.aiContext.upsellSuggestions
    : [];
}

export async function predictOrderDelay(
  context: OmsPlatformContext,
  orderId: string,
): Promise<Record<string, unknown> | null> {
  const record = await orderService.getById(context, orderId);
  if (!record) {
    return null;
  }

  const dataContext = {
    orderId,
    orderNumber: record.order.orderNumber,
    delayRiskScore: record.analytics.delayRiskScore,
    orderType: record.order.orderType,
    fulfillment: record.fulfillment,
    items: record.items,
    status: record.order.status,
  };

  const aiResult = await runOrderAiInference<Record<string, unknown>>(
    context,
    "predictOrderDelay",
    dataContext,
    "Predict order delay. Return JSON with orderId, orderNumber, delayRiskScore, predictedDelayMinutes, factors array, and recommendation.",
  );

  if (aiResult) {
    return aiResult;
  }

  return {
    orderId,
    orderNumber: record.order.orderNumber,
    delayRiskScore: record.analytics.delayRiskScore,
    estimatedReadyAt: record.fulfillment.estimatedReadyAt,
  };
}

export async function predictPreparationTime(
  context: OmsPlatformContext,
  orderId: string,
): Promise<Record<string, unknown> | null> {
  const record = await orderService.getById(context, orderId);
  if (!record) {
    return null;
  }

  const dataContext = {
    orderId,
    orderNumber: record.order.orderNumber,
    delayRiskScore: record.analytics.delayRiskScore,
    items: record.items.map((item) => ({
      name: item.productName,
      quantity: item.quantity,
    })),
    fulfillment: record.fulfillment,
  };

  const aiResult = await runOrderAiInference<Record<string, unknown>>(
    context,
    "predictPreparationTime",
    dataContext,
    "Predict preparation time. Return JSON with orderId, estimatedPrepMinutes, confidence, and factors.",
  );

  if (aiResult) {
    return aiResult;
  }

  return {
    orderId,
    delayRiskScore: record.analytics.delayRiskScore,
    itemCount: record.items.length,
  };
}

export async function suggestOrderOptimizations(
  context: OmsPlatformContext,
): Promise<Record<string, unknown>> {
  const snapshot = await buildOmsPlatformSnapshot(context);
  const preparing = snapshot.orders.filter((o) => o.order.status === ORDER_STATUSES.PREPARING);
  const dataContext = {
    activeOrders: snapshot.activeCount,
    preparingCount: preparing.length,
    completedTodayCount: snapshot.completedTodayCount,
    totalRevenuePence: snapshot.totalRevenuePence,
    preparingOrders: preparing.slice(0, 10).map((o) => ({
      orderId: o.order.id,
      orderNumber: o.order.orderNumber,
      itemCount: o.items.length,
    })),
  };

  const aiResult = await runOrderAiInference<Record<string, unknown>>(
    context,
    "suggestOrderOptimizations",
    dataContext,
    "Suggest order workflow optimizations. Return JSON with activeOrders, suggestions array, and rationale.",
  );

  if (aiResult) {
    return aiResult;
  }

  return {
    activeOrders: snapshot.activeCount,
    preparingCount: preparing.length,
  };
}

export async function forecastDemand(context: OmsPlatformContext): Promise<Record<string, unknown>> {
  const snapshot = await buildOmsPlatformSnapshot(context);
  const dataContext = {
    branchId: context.branchId,
    activeCount: snapshot.activeCount,
    completedTodayCount: snapshot.completedTodayCount,
    totalRevenuePence: snapshot.totalRevenuePence,
  };

  const aiResult = await runOrderAiInference<Record<string, unknown>>(
    context,
    "forecastDemand",
    dataContext,
    "Forecast order demand. Return JSON with branchId, projectedCovers, peakWindow, confidence, and hourlyBreakdown.",
  );

  if (aiResult) {
    return aiResult;
  }

  return {
    branchId: context.branchId,
    activeCount: snapshot.activeCount,
    completedTodayCount: snapshot.completedTodayCount,
  };
}

export async function detectHighValueCustomers(
  context: OmsPlatformContext,
): Promise<Record<string, unknown>> {
  const result = await orderService.search({ pageSize: 50 }, context);
  const highValue = result.records.filter((record) => record.order.totalPence >= 5000);
  const dataContext = {
    count: highValue.length,
    orders: highValue.slice(0, 10).map((record) => ({
      orderId: record.order.id,
      orderNumber: record.order.orderNumber,
      customerName: record.order.customerName,
      totalPence: record.order.totalPence,
    })),
  };

  const aiResult = await runOrderAiInference<Record<string, unknown>>(
    context,
    "detectHighValueCustomers",
    dataContext,
    "Detect high-value customers from orders. Return JSON with count, orders, and customerInsights.",
  );

  if (aiResult) {
    return aiResult;
  }

  return {
    count: highValue.length,
    orders: highValue.slice(0, 5).map((record) => ({
      orderId: record.order.id,
      orderNumber: record.order.orderNumber,
      customerName: record.order.customerName,
      totalPence: record.order.totalPence,
    })),
  };
}

export async function detectDelays(context: OmsPlatformContext): Promise<Record<string, unknown>> {
  const result = await orderService.search({ status: ORDER_STATUSES.PREPARING, pageSize: 50 }, context);
  const delayed = result.records.filter((record) => record.analytics.delayRiskScore > 0.35);
  const dataContext = {
    count: delayed.length,
    orders: delayed.map((record) => ({
      orderId: record.order.id,
      orderNumber: record.order.orderNumber,
      delayRiskScore: record.analytics.delayRiskScore,
    })),
  };

  const aiResult = await runOrderAiInference<Record<string, unknown>>(
    context,
    "detectDelays",
    dataContext,
    "Detect delayed orders. Return JSON with count, orders, and recommendedActions.",
  );

  if (aiResult) {
    return aiResult;
  }

  return dataContext;
}

export async function buildOrderTrackingSummary(
  context: OmsPlatformContext,
  orderId: string,
): Promise<Record<string, unknown> | null> {
  const record = await orderService.getById(context, orderId);
  if (!record) {
    return null;
  }

  return {
    orderId,
    orderNumber: record.order.orderNumber,
    status: record.order.status,
    orderType: record.order.orderType,
    customerName: record.order.customerName,
    timeline: record.timeline.slice(0, 8),
    fulfillment: record.fulfillment,
    payments: record.payments,
    analytics: record.analytics,
  };
}

export async function searchOrdersForAi(
  context: OmsPlatformContext,
  query: string,
  limit = 10,
): Promise<OrderRecord[]> {
  const result = await orderService.search({ query, pageSize: limit }, context);
  return result.records;
}

export async function buildOrderCatalogSummary(context: OmsPlatformContext): Promise<Record<string, unknown>> {
  const snapshot = await buildOmsPlatformSnapshot(context);
  return {
    activeCount: snapshot.activeCount,
    preparingCount: snapshot.preparingCount,
    completedTodayCount: snapshot.completedTodayCount,
    totalRevenuePence: snapshot.totalRevenuePence,
  };
}
