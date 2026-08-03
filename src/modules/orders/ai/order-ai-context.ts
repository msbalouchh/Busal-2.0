import { orderService } from "@/modules/orders/services/order.service";
import { getOrderSummary } from "@/modules/orders/utils/order-selectors";
import type { OrderAiContext, OrderRecord } from "@/modules/orders/types/order";

export function buildOrderAiContext(orderId: string): OrderAiContext | null {
  const record = orderService.getById(orderId);

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
    recommendedActions: record.aiContext.recommendedActions,
    upsellSuggestions: record.aiContext.upsellSuggestions,
    delayPredictionMinutes: record.analytics.delayRiskScore > 0.4 ? 15 : null,
    lastGeneratedAt: new Date().toISOString(),
  };
}

export function generateUpsellRecommendations(orderId: string): string[] {
  const record = orderService.getById(orderId);

  if (!record) {
    return [];
  }

  const suggestions = [...record.aiContext.upsellSuggestions];

  if (
    record.order.orderType === "dine_in" &&
    !record.items.some((item) => item.productName.includes("Dessert"))
  ) {
    suggestions.push("Add dessert — high attach rate for dine-in");
  }

  if (record.order.totalPence < 3000) {
    suggestions.push("Bundle upgrade — increase basket value");
  }

  return suggestions.length > 0 ? suggestions : ["No upsell opportunities identified"];
}

export function predictOrderDelay(orderId: string): Record<string, unknown> | null {
  const record = orderService.getById(orderId);

  if (!record) {
    return null;
  }

  const riskScore = record.analytics.delayRiskScore;
  const predictedMinutes = riskScore > 0.5 ? 18 : riskScore > 0.3 ? 10 : riskScore > 0.15 ? 5 : 0;

  return {
    orderId,
    orderNumber: record.order.orderNumber,
    delayRiskScore: riskScore,
    predictedDelayMinutes: predictedMinutes,
    factors: [
      riskScore > 0.4 ? "High kitchen queue pressure" : "Normal kitchen load",
      record.order.orderType === "delivery" ? "Delivery routing active" : "On-premise fulfillment",
      record.fulfillment.estimatedReadyAt
        ? `ETA: ${record.fulfillment.estimatedReadyAt}`
        : "ETA not set",
    ],
    recommendation:
      predictedMinutes > 10 ? "Notify customer of potential delay" : "On track — no action needed",
  };
}

export function buildOrderTrackingSummary(orderId: string): Record<string, unknown> | null {
  const record = orderService.getById(orderId);

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

export function searchOrdersForAi(query: string): OrderRecord[] {
  return orderService.search({ query, limit: 10 });
}
