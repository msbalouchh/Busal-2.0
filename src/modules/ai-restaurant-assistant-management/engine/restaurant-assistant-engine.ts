import "server-only";

import type { AnalyticsFilters } from "@/modules/restaurant-analytics-management/types/restaurant-analytics-types";
import { defaultDateRange } from "@/modules/restaurant-analytics-management/lib/restaurant-analytics-validation";
import {
  getCustomersDashboard,
  getExecutiveDashboard,
  getInventoryDashboard,
  getKitchenDashboard,
  getOrdersDashboard,
  getPaymentsDashboard,
  getProductsDashboard,
  getReservationsDashboard,
  getSalesDashboard,
  getStaffDashboard,
} from "@/services/restaurant-analytics.service";
import type { InsightCard } from "@/modules/ai-restaurant-assistant-management/types/ai-restaurant-assistant-types";
import { runCentralAiChatForOwner, runCentralAiInsightForOwner } from "@/services/ai-engine-bridge.service";

export type RestaurantIntent =
  | "sales_today"
  | "sales_weekly"
  | "sales_monthly"
  | "reservations_today"
  | "peak_hours"
  | "top_products"
  | "worst_products"
  | "low_inventory"
  | "top_customers"
  | "staff_performance"
  | "kitchen_status"
  | "business_summary"
  | "payments_summary"
  | "revenue_insights"
  | "reorder_suggestions"
  | "general";

interface IntentMatch {
  intent: RestaurantIntent;
  confidence: number;
}

const INTENT_PATTERNS: Array<{ intent: RestaurantIntent; patterns: RegExp[] }> = [];

/** @deprecated Intent classification is routed through the centralized AI engine. */
export function detectRestaurantIntent(message: string): IntentMatch {
  void message;
  return { intent: "general", confidence: 0.3 };
}

/** Routes restaurant intent detection through the centralized AI engine. */
export async function detectRestaurantIntentViaEngine(
  ownerId: string,
  message: string,
): Promise<IntentMatch> {
  const result = await runCentralAiInsightForOwner(ownerId, {
    currentModule: "restaurant-assistant",
    prompt: `Classify this restaurant operator request: "${message}"`,
    contextData: { message },
    responseFormat: "json",
  });

  const parsed = result.parsed as { intent?: RestaurantIntent; confidence?: number } | undefined;
  if (parsed?.intent) {
    return {
      intent: parsed.intent,
      confidence: parsed.confidence ?? 0.8,
    };
  }

  return { intent: "general", confidence: 0.3 };
}

function filtersForPeriod(
  period: "daily" | "weekly" | "monthly",
  branchId?: string | null,
): AnalyticsFilters {
  const range = defaultDateRange(period === "daily" ? 1 : period === "weekly" ? 7 : 30);
  return { branchId: branchId ?? null, dateRange: range };
}

function todayFilters(branchId?: string | null): AnalyticsFilters {
  return filtersForPeriod("daily", branchId);
}

export async function composeRestaurantAssistantReply(
  ownerId: string,
  message: string,
  branchId?: string | null,
): Promise<{ content: string; intent: RestaurantIntent; insightCards: InsightCard[] }> {
  const filters = todayFilters(branchId);
  const [{ intent }, executive, sales, inventory, orders] = await Promise.all([
    detectRestaurantIntentViaEngine(ownerId, message),
    getExecutiveDashboard(ownerId, filters),
    getSalesDashboard(ownerId, filters),
    getInventoryDashboard(ownerId, filters),
    getOrdersDashboard(ownerId, filters),
  ]);

  const insightCards: InsightCard[] = executive.kpis.slice(0, 4).map((kpi, index) => ({
    id: `exec-${index}`,
    category: "revenue",
    title: kpi.label,
    value: kpi.value,
  }));

  const engineResult = await runCentralAiChatForOwner(ownerId, {
    message,
    currentModule: "restaurant-assistant",
    enableTools: true,
    metadata: {
      branchId: branchId ?? null,
      detectedIntent: intent,
      analytics: { executive, sales, inventory, orders, dateRange: filters.dateRange },
    },
  });

  return {
    intent,
    insightCards,
    content: engineResult.content,
  };
}

export async function buildBusinessHealthSummary(
  ownerId: string,
  branchId?: string | null,
): Promise<{ score: number; label: string; highlights: InsightCard[]; concerns: string[] }> {
  const filters = todayFilters(branchId);
  const [executive, inventory, orders] = await Promise.all([
    getExecutiveDashboard(ownerId, filters),
    getInventoryDashboard(ownerId, filters),
    getOrdersDashboard(ownerId, filters),
  ]);

  const highlights = executive.kpis.slice(0, 4).map((kpi, index) => ({
    id: `health-${index}`,
    category: "revenue",
    title: kpi.label,
    value: kpi.value,
  }));

  const concerns: string[] = [];
  const lowStockKpi = inventory.kpis.find((kpi) => kpi.label === "Low stock items");
  if (lowStockKpi && Number(lowStockKpi.value) > 0) {
    concerns.push(`${lowStockKpi.value} inventory items are low on stock`);
  }
  if (orders.cancelledOrders > 0) {
    concerns.push(`${orders.cancelledOrders} orders were cancelled today`);
  }

  const score = Math.max(35, Math.min(98, 88 - concerns.length * 12));

  return {
    score,
    label: score >= 80 ? "Healthy" : score >= 60 ? "Needs attention" : "At risk",
    highlights,
    concerns,
  };
}
